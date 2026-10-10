// tests/dimensions-matrix.spec.ts
// The acceptance matrix: nine viewports × three languages × two themes × three pages (162 cases), and the same
// structure in every language. Each case loads its page once and checks every stop of it at rest.
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  atRest,
  expectFooterLines,
  expectNoHorizontalScroll,
  expectLegible,
  expectNoMissingKeys,
  expectNotCovered,
  expectTapTargets,
  expectTextFits,
  LOCALES,
  openPage,
  VIEWPORTS,
  type Locale,
  type ThemeName,
} from './helpers/dimensions';
import { arrived, jumpTo, ready, visibleScenes } from './helpers/home';

const THEMES: ThemeName[] = ['dark', 'light'];

/** Set to a directory to keep every screenshot of the run there as well (for reading them side by side). */
const SHOTS = process.env.MATRIX_SHOTS;

/**
 * Set to measure what awaits a decision instead of holding it to its floor: every pending block of the home page
 * is then asked for a ratio no block has, in every case of its family (not only those listed as failing), so each
 * case reports what each block really measures, named by its decision. The floors below were set from such a run.
 */
const MEASURE = !!process.env.MATRIX_MEASURE;
const UNREACHABLE = 99;

/** The facilities of the pinned ledger: one stop each. The pin is three screens of scrolling long. */
const LEDGER_STEPS = 6;
const LEDGER_SCREENS = 3;

/** What is fixed over the page while it is read on: text passes behind it. */
const BAR = '.dim-bar';
/** On an inner page the toolbar sticks under the bar as well. */
const OVER_LIST = '.dim-bar, .dim .tools';

interface Stop {
  /** what is brought to the top of the screen */
  sel: string;
  /** how far below the section's top the screen stands, in screens: 0 is the section at rest under the bar */
  off: number;
  /** the scene that shows there */
  scene: string;
  /**
   * A place the reader is taken to (the bar, the rail, a link): it stands at rest under the bar, and nothing of it
   * may be behind the bar. The other sections are only ever scrolled through, so their text passes behind it.
   */
  anchor?: boolean;
  /** a section taller than the screen is read to its end, a screen at a time */
  walk?: boolean;
}

/** Every stop on the home page that has its own layout, with the scene expected there. */
const HOME_STOPS: Stop[] = [
  { sel: '#top', off: 0, scene: 'spawn', anchor: true },
  { sel: '#overworld', off: 0, scene: 'town', anchor: true, walk: true },
  { sel: '[data-work="overworld-0"]', off: 0, scene: 'w1', walk: true },
  { sel: '[data-work="overworld-1"]', off: 0, scene: 'w2', walk: true },
  { sel: '[data-work="overworld-2"]', off: 0, scene: 'w3', walk: true },
  { sel: '#nether', off: 0, scene: 'nether', anchor: true, walk: true },
  ...Array.from({ length: LEDGER_STEPS }, (_, i) => ({
    sel: '#ledger',
    off: ((i + 0.5) / LEDGER_STEPS) * LEDGER_SCREENS,
    scene: 'nether',
    // pinned: the stage stands still under the bar for as long as the facilities are read
    anchor: true,
  })),
  { sel: '.rank', off: 0, scene: 'nether', walk: true },
  { sel: '#end', off: 0, scene: 'hall', anchor: true, walk: true },
  { sel: '[data-work="end-0"]', off: 0, scene: 'moon', walk: true },
  { sel: '[data-work="end-1"]', off: 0, scene: 'farm', walk: true },
  { sel: '#credits', off: 0, scene: 'end', walk: true },
  { sel: '#respawn', off: 0, scene: 'day1', anchor: true, walk: true },
];

/** The checks of one screen; what fails is returned, so one run names every defect of a case. */
const check = async (
  page: Page,
  where: string,
  opts: { within?: string; passing?: string } = {},
  more: (() => Promise<void>)[] = [],
) => {
  const found: string[] = [];
  for (const run of [
    () => expectNoHorizontalScroll(page),
    () => expectTextFits(page, opts),
    () => expectNotCovered(page, opts),
    () => expectTapTargets(page),
    ...more,
  ]) {
    try {
      await run();
    } catch (e) {
      found.push(
        ...(e as Error).message
          .split('\n\n')[0]
          .split('\n')
          .map((line) => `${where}: ${line}`),
      );
    }
  }
  return found;
};

/**
 * What stands over a scene on the home page, by what it is: every kind is read against the pixels behind it
 * wherever it stands on the screen, at every stop of the page.
 */
const HOME_TEXT: [kind: string, selector: string][] = [
  ['hero meta', '.hero-meta [data-t]'],
  ['hero lead', '.hero-copy .lead'],
  ['statement', '.open .say span'],
  ['body of a dimension', '.open p.body'],
  ['work caption', '.work [data-t]'],
  ['rank statement', '.rank .claim, .rank p[data-t="body"]'],
  ['respawn title', '#respawn h2'],
  ['department rows', '#respawn .depts [data-t]'],
  ['footer', '#respawn .dim-foot [data-t]'],
];

/**
 * The home page's words can be read where the screen stands (`expectLegible`, its method and its thresholds).
 * A block is read when it is there to be read: lit (a statement waits dimmed for the scroll that lights it; a
 * block that is rising in has not arrived), and clear of the bar, which carries a ground of its own.
 * `seen` counts what was read, by kind, so that a kind that was never read anywhere on the page is a finding too.
 * `pending` is what awaits a decision in this case (see PENDING): it is not asked for AA here (it is kept as a
 * fixme of its own), only for its floor, if it has one.
 */
const expectHomeLegible = async (
  page: Page,
  seen: Map<string, number>,
  pending: { entry: string; selector: string; floor?: number }[] = [],
) => {
  const kinds = await page.evaluate(
    ([text, bar, skip, floors]) => {
      const vh = window.innerHeight;
      const under = document.querySelector(bar)!.getBoundingClientRect().bottom;
      const through = (el: Element) => {
        let o = 1;
        for (
          let e: Element | null = el;
          e && e !== document.documentElement;
          e = e.parentElement
        ) {
          const c = getComputedStyle(e);
          if (c.visibility === 'hidden' || c.display === 'none') return 0;
          o *= +c.opacity;
        }
        return o;
      };
      const out: string[] = [];
      for (const [kind, sel] of text)
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.top < under || r.top >= vh - 2) continue;
          if (through(el) < 0.99) continue;
          const held = skip.findIndex((s) => el.matches(s));
          if (held < 0) {
            el.setAttribute('data-legible', '');
            out.push(kind);
          } else {
            el.setAttribute('data-legible-held', String(held));
            out.push(`held ${held}`);
            // read as well, against its floor
            if (floors[held] !== null) out.push(kind);
          }
        }
      return out;
    },
    [
      HOME_TEXT,
      BAR,
      pending.map((p) => p.selector),
      pending.map((p) => p.floor ?? null),
    ] as const,
  );
  const whole = await page.locator('[data-legible]').count();
  const problems: string[] = [];
  const run = async (selector: string, floor?: number, entry?: string) => {
    try {
      await expectLegible(page, selector, floor);
    } catch (e) {
      problems.push(
        ...(e as Error).message
          .split('\n\n')[0]
          .split('\n')
          // what is held to a floor says which decision it is
          .map((line) => (entry ? `[${entry.split(',')[0]}] ${line}` : line)),
      );
    }
  };
  try {
    const read = kinds.filter((kind) => !kind.startsWith('held '));
    for (const kind of read) seen.set(kind, (seen.get(kind) ?? 0) + 1);
    if (whole) await run('[data-legible]');
    for (const [i, p] of pending.entries())
      if (p.floor !== undefined && kinds.includes(`held ${i}`))
        await run(`[data-legible-held="${i}"]`, p.floor, p.entry);
  } finally {
    await page.evaluate(() =>
      document
        .querySelectorAll('[data-legible], [data-legible-held]')
        .forEach((el) => {
          el.removeAttribute('data-legible');
          el.removeAttribute('data-legible-held');
        }),
    );
  }
  expect(problems, problems.join('\n')).toEqual([]);
};

/**
 * The pictures of the scenes that show have come and can be drawn: the page is read on its pictures, never on the
 * bare stage a picture has yet to arrive on. (They are asked for when the loader lifts, and a stop of this walk
 * can be reached before one has come.) What then fades in is waited for by `atRest`.
 */
const picturesIn = (page: Page, where: string) =>
  expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('.dim .scene')]
            .filter((scene) => {
              const c = getComputedStyle(scene);
              return c.visibility !== 'hidden' && +c.opacity > 0.01;
            })
            .flatMap((scene) => [
              ...scene.querySelectorAll<HTMLImageElement>('.cam > img'),
            ])
            // one of the facilities' pictures that is not the one showing has nothing to wait for
            .filter(
              (img) =>
                img.dataset.ledger === undefined ||
                +getComputedStyle(img).opacity > 0.01,
            )
            .every(
              (img) =>
                img.complete &&
                img.naturalWidth > 0 &&
                (img.dataset.ledger !== undefined || img.dataset.in === ''),
            ),
        ),
      {
        message: `${where}: the pictures of the scenes on screen`,
        timeout: 30_000,
      },
    )
    .toBe(true);

/** What stands over the header's picture on an inner page, each in its own colour. */
const HEAD_TEXT = [
  '.head .crumb a',
  '.head .crumb .acc',
  '.head h1',
  '.head p[data-t="body"]',
  '.head .vt',
];

/**
 * What each finding of the home page measures at the least, case by case (`viewport locale theme`), a little
 * under it: read with the page at rest and its pictures in (a `MATRIX_MEASURE` run, Task G1 fix round 1;
 * the figures are in task-g1-report.md). Only the cases that are under AA are here.
 */
type Floors = Record<string, number>;
const FLOORS_3: Floors = {
  'tablet-land en light': 3.6,
};
const FLOORS_4: Floors = {
  'phone-s en light': 1.9,
  'phone-s zh_CN light': 2.2,
  'phone-s zh_TW light': 2.2,
  'phone en light': 2.1,
  'phone zh_CN light': 2.3,
  'phone zh_TW light': 2.3,
  'phone-land en light': 1.4,
  'phone-land zh_CN light': 1.4,
  'phone-land zh_TW light': 1.4,
  'tablet en light': 2.5,
  'tablet zh_CN light': 2.5,
  'tablet zh_TW light': 2.5,
  'tablet-land en light': 1.9,
  'tablet-land zh_CN light': 1.9,
  'tablet-land zh_TW light': 1.9,
  'laptop en light': 1.4,
  'laptop zh_CN light': 1.4,
  'laptop zh_TW light': 1.4,
  'desktop en light': 1.8,
  'desktop zh_CN light': 1.8,
  'desktop zh_TW light': 1.8,
  'desktop-l en light': 2.0,
  'desktop-l zh_CN light': 2.0,
  'desktop-l zh_TW light': 2.0,
  'ultrawide en light': 2.4,
  'ultrawide zh_CN light': 2.4,
  'ultrawide zh_TW light': 2.4,
};
const FLOORS_5: Floors = {
  'phone-s en dark': 4.0,
  'phone-s en light': 4.0,
  'phone-s zh_CN dark': 4.0,
  'phone-s zh_CN light': 4.0,
  'phone-s zh_TW dark': 4.0,
  'phone-s zh_TW light': 4.0,
};
const FLOORS_6: Floors = {
  'phone-s en dark': 3.1,
  'phone-s zh_CN dark': 3.6,
  'phone-s zh_TW dark': 3.6,
  'phone en dark': 3.7,
  'phone zh_CN dark': 3.6,
  'phone zh_TW dark': 3.6,
  'phone-land en dark': 4.1,
  'phone-land zh_CN dark': 4.1,
  'phone-land zh_TW dark': 4.1,
  'tablet en dark': 4.0,
  'tablet zh_CN dark': 4.1,
  'tablet zh_TW dark': 4.1,
  'tablet-land en dark': 2.3,
  'tablet-land zh_CN dark': 2.5,
  'tablet-land zh_TW dark': 2.5,
  'laptop en dark': 3.4,
  'laptop zh_CN dark': 2.9,
  'laptop zh_TW dark': 2.9,
  'desktop en dark': 4.0,
  'desktop zh_CN dark': 3.6,
  'desktop zh_TW dark': 3.6,
  'desktop-l zh_CN dark': 4.2,
  'desktop-l zh_TW dark': 4.2,
  'ultrawide zh_CN dark': 4.2,
  'ultrawide zh_TW dark': 4.2,
};
const FLOORS_7: Floors = {
  'phone-land zh_CN dark': 4.4,
  'phone-land zh_TW dark': 4.4,
  'tablet-land en dark': 3.6,
  'tablet-land zh_CN dark': 3.8,
  'tablet-land zh_TW dark': 3.8,
  'laptop en dark': 4.1,
  'laptop zh_CN dark': 4.0,
  'laptop zh_TW dark': 4.0,
};
/** A finding of the home page applies in the cases it has a floor for. */
const onHome =
  (floors: Floors) =>
  (
    page: string,
    viewport: string,
    _width: number,
    theme: ThemeName,
    locale: Locale,
  ) =>
    page === 'home' && `${viewport} ${locale} ${theme}` in floors;

/**
 * Legibility findings whose fix is a choice between several designs, awaiting the user's decision
 * (task-10-report.md and task-g1-report.md, "Needs a decision"). In the cases they apply to, that one block is
 * not asserted against AA in the case itself, so everything else in the case still is; it is kept as a
 * `test.fixme` of its own, by the name of the report entry, and comes back by deleting its line here.
 * A finding that has a `floor` is not left unwatched meanwhile: in every case it applies to, the block is still
 * asserted against that ratio, so it cannot get worse than it is while the decision is open.
 */
const PENDING: {
  entry: string;
  selector: string;
  floor?: number;
  /**
   * For a finding of the home page: the cases it is found in (`viewport locale theme`), each with its own floor,
   * a little under the least that case measures with the page at rest and its pictures in. A case that is not
   * listed reads the block at AA like any other.
   */
  floors?: Record<string, number>;
  /** the cases a measuring run reads it in: the theme it is a finding of */
  family?: ThemeName | 'both';
  applies: (
    page: string,
    viewport: string,
    width: number,
    theme: ThemeName,
    locale: Locale,
  ) => boolean;
}[] = [
  {
    // Needs a decision 1: by night the upright label stands on the bare photograph (by day it has a strip of paper)
    entry: 'decision 1, the upright label on the photograph by night',
    selector: '.head .vt',
    applies: (page, viewport, width, theme) =>
      theme === 'dark' &&
      (page === 'progress'
        ? width > 860
        : page === 'members' && viewport === 'ultrawide'),
  },
  // (Decision 2, the current page of the crumb in the day accent, is settled: Task G1 gave accent-coloured words
  // of an inner header a deeper ink of the same hue by day, and the block is asked for AA like the others.)
  // The home page, read for legibility since Task G1. What follows is what that reading found outside the places
  // that task set right (the day paper of the hero and of the respawn). Each is listed for the cases it fails in,
  // and held there to that case's own floor.
  {
    // Needs a decision 3: the column is 44vw wide and the day paper of the side veil ends before it does; only
    // English fills the column to its end, and only at this width is the picture behind that end dark (3.72 : 1)
    entry:
      'decision 3, the Overworld body past the day paper in English at 1024',
    selector: '#overworld p.body',
    family: 'light',
    floors: FLOORS_3,
    applies: onHome(FLOORS_3),
  },
  {
    // Needs a decision 4: a note in the day accent (4.7 : 1 on bare paper) stands high in the bottom-up veil of a
    // build, where there is little paper. Every day case: the least of a case is 1.54 to 2.67 : 1 (the first
    // build's note, or the third's on a phone); the second build's note has 3.7 to 4.4
    entry: 'decision 4, the notes of the Overworld builds in the day accent',
    selector: '[data-work^="overworld"] p.acc',
    family: 'light',
    floors: FLOORS_4,
    applies: onHome(FLOORS_4),
  },
  {
    // Needs a decision 5: the End is dark in both themes; at 360px its accent has 4.11 to 4.13 : 1 over the moon
    // (6.7 and more at every other width)
    entry: 'decision 5, the note of the first End build on a small phone',
    selector: '[data-work="end-0"] p.acc',
    family: 'both',
    floors: FLOORS_5,
    applies: onHome(FLOORS_5),
  },
  {
    // Needs a decision 6: by night the side veil has thinned to about a half where the body ends, over a bright
    // town: 2.46 to 4.35 : 1 in the muted grey, in 25 of the 27 night cases (English at 1920 and 2560 passes)
    entry: 'decision 6, the Overworld body in the muted grey by night',
    selector: '#overworld p.body',
    family: 'dark',
    floors: FLOORS_6,
    applies: onHome(FLOORS_6),
  },
  {
    // Needs a decision 7: by night the footer's links stand in the muted grey where the wide veil is thin: 3.7 to
    // 3.91 : 1 at 1024, 4.17 to 4.22 at 1280. At 844 × 390 a department's description in Chinese is on the line
    // (4.50 at rest, a hair under it in an earlier reading): listed, so that it is not a coin toss
    entry:
      'decision 7, the footer and the departments of the respawn in the muted grey by night',
    selector: '#respawn .dim-foot [data-t], #respawn .depts li > span',
    family: 'dark',
    floors: FLOORS_7,
    applies: onHome(FLOORS_7),
  },
];

/**
 * A set of figures that wraps does so evenly: every row holds as many as the others (four, or two and two;
 * never three and one left over).
 */
const expectEvenRows = async (page: Page, selector: string) => {
  const rows = await page.locator(selector).evaluateAll((els) => {
    const count = new Map<number, number>();
    for (const el of els) {
      const top = Math.round(el.getBoundingClientRect().top);
      count.set(top, (count.get(top) ?? 0) + 1);
    }
    return [...count.values()];
  });
  expect(rows.length, `${selector} is in the page`).toBeGreaterThan(0);
  expect(
    new Set(rows).size,
    `${selector} wraps unevenly: rows of ${rows.join(' + ')}`,
  ).toBe(1);
};

const shoot = async (page: Page, info: TestInfo, name: string) => {
  const file = `${name.replace(/[^\w.-]+/g, '_')}.jpg`;
  const body = await page.screenshot({ type: 'jpeg', quality: 60 });
  await info.attach(file, { body, contentType: 'image/jpeg' });
  if (SHOTS) {
    fs.mkdirSync(SHOTS, { recursive: true });
    fs.writeFileSync(path.join(SHOTS, file), body);
  }
};

/** How far the bottom of `sel` is below the bottom of the screen. */
const below = (page: Page, sel: string) =>
  page.evaluate(
    (s) =>
      document.querySelector(s)!.getBoundingClientRect().bottom -
      window.innerHeight,
    sel,
  );

/** Read on from where the screen stands to the end of `sel`, three quarters of a screen at a time. */
const walk = async (
  page: Page,
  sel: string,
  each: (n: number) => Promise<void>,
) => {
  for (let n = 1, left = await below(page, sel); left > 1; n++) {
    await page.evaluate((by) => {
      window.scrollBy({
        top: Math.min(by, window.innerHeight * 0.75),
        behavior: 'instant',
      });
    }, left);
    await atRest(page);
    await each(n);
    const now = await below(page, sel);
    // the end of the page: there is nothing further to read
    if (now >= left - 1) break;
    left = now;
  }
};

for (const vp of VIEWPORTS) {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      const tag = `${vp.name} ${locale} ${theme}`;

      const key = `${vp.name} ${locale} ${theme}`;
      const homePending = PENDING.filter((p) =>
        MEASURE
          ? p.family === 'both' || p.family === theme
          : p.applies('home', vp.name, vp.width, theme, locale as Locale),
      ).map((p) => ({
        ...p,
        floor: MEASURE ? UNREACHABLE : p.floors?.[key] ?? p.floor,
      }));
      for (const p of homePending)
        test.fixme(`home ${tag}: ${p.entry}`, async ({ page }) => {
          test.slow();
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await openPage(page, '/', { locale: locale as Locale, theme });
          await arrived(page);
          // at every screen of the page where it stands: AA, as everything else
          let seen = 0;
          const read = async () => {
            const there = await page.evaluate(
              ([sel, bar]) => {
                const under = document
                  .querySelector(bar)!
                  .getBoundingClientRect().bottom;
                let n = 0;
                for (const el of document.querySelectorAll(sel)) {
                  const r = el.getBoundingClientRect();
                  if (r.top < under || r.top >= window.innerHeight - 2)
                    continue;
                  el.setAttribute('data-legible', '');
                  n++;
                }
                return n;
              },
              [p.selector, BAR] as const,
            );
            if (!there) return;
            seen += there;
            try {
              await expectLegible(page, '[data-legible]');
            } finally {
              await page.evaluate(() =>
                document
                  .querySelectorAll('[data-legible]')
                  .forEach((el) => el.removeAttribute('data-legible')),
              );
            }
          };
          for (const stop of HOME_STOPS) {
            await jumpTo(page, stop.sel, stop.off);
            await atRest(page);
            await read();
            if (stop.walk) await walk(page, stop.sel, read);
          }
          expect(seen, `${p.selector} was on screen`).toBeGreaterThan(0);
        });

      test(`home ${tag}`, async ({ page }, info) => {
        test.slow();
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await openPage(page, '/', { locale: locale as Locale, theme });
        await arrived(page);
        await expectNoMissingKeys(page);
        const found: string[] = [];
        const read = new Map<string, number>();
        const legible = () => expectHomeLegible(page, read, homePending);
        for (const [i, stop] of HOME_STOPS.entries()) {
          const where = `${stop.sel}+${stop.off.toFixed(2)}`;
          // at once: the page is checked where it stands, not on the way there
          await jumpTo(page, stop.sel, stop.off);
          await expect
            .poll(() => visibleScenes(page), { message: `${where} scene` })
            .toContain(stop.scene);
          await picturesIn(page, where);
          await atRest(page);
          found.push(
            ...(await check(
              page,
              where,
              stop.anchor ? {} : { passing: BAR },
              stop.sel === '#overworld'
                ? [() => expectEvenRows(page, '#overworld .stats b'), legible]
                : [legible],
            )),
          );
          await shoot(page, info, `home-${tag}-${i}-${stop.sel}`);
          if (stop.walk)
            await walk(page, stop.sel, async (n) => {
              await picturesIn(page, `${where} ↓${n}`);
              await atRest(page);
              found.push(
                ...(await check(page, `${where} ↓${n}`, { passing: BAR }, [
                  legible,
                ])),
              );
              await shoot(page, info, `home-${tag}-${i}-${stop.sel}-down${n}`);
            });
        }
        // the foot of the page, at the end of the respawn
        await page.evaluate(() =>
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'instant',
          }),
        );
        await atRest(page);
        await expect(page.locator('.dim-foot')).toBeInViewport();
        found.push(
          ...(await check(page, 'foot', { passing: BAR }, [
            () => expectFooterLines(page),
            legible,
          ])),
        );
        await shoot(page, info, `home-${tag}-foot`);
        // every kind of text was read somewhere on the page
        for (const [kind] of HOME_TEXT)
          if (!read.get(kind)) found.push(`never read for legibility: ${kind}`);
        expect(found, found.join('\n')).toEqual([]);
      });

      for (const [name, url, first] of [
        ['progress', '/survivalProgress/', '.entry'],
        ['members', '/member/', '.person'],
      ] as const) {
        const pending = PENDING.filter((p) =>
          p.applies(name, vp.name, vp.width, theme, locale as Locale),
        );
        for (const p of pending)
          test.fixme(`${name} ${tag}: ${p.entry}`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await openPage(page, url, { locale: locale as Locale, theme });
            await page.locator(first).first().waitFor();
            await atRest(page);
            await expectLegible(page, p.selector);
          });

        test(`${name} ${tag}`, async ({ page }, info) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await openPage(page, url, { locale: locale as Locale, theme });
          await page.locator(first).first().waitFor();
          // the entrance has played: the header, the toolbar and the list stand where they belong
          await atRest(page);
          await expectNoMissingKeys(page);
          expect(await page.locator(first).count()).toBeGreaterThan(3);
          // the picture the header's words stand on
          await expect
            .poll(() =>
              page
                .locator('.head .bg img')
                .evaluate(
                  (img: HTMLImageElement) =>
                    img.complete && img.naturalWidth > 0,
                ),
            )
            .toBe(true);
          const found = await check(page, 'top', {}, [
            () =>
              expectLegible(
                page,
                HEAD_TEXT.filter(
                  (sel) => !pending.some((p) => p.selector === sel),
                ).join(', '),
              ),
            // what awaits a decision is held to its floor meanwhile
            ...pending
              .filter((p) => p.floor !== undefined)
              .map((p) => () => expectLegible(page, p.selector, p.floor)),
          ]);
          await shoot(page, info, `${name}-${tag}-top`);

          // the menu, wherever the bar shows its button instead of its links
          const menu = page.locator('.dim-bar [data-action="menu"]');
          if (await menu.isVisible()) {
            await menu.click();
            await expect(page.locator('.dim-sheet')).toHaveCSS('opacity', '1');
            await atRest(page);
            found.push(
              ...(await check(page, 'menu', { within: '.dim-sheet' })),
            );
            await shoot(page, info, `${name}-${tag}-menu`);
            await menu.click();
            await expect(page.locator('.dim-sheet')).toHaveCSS(
              'visibility',
              'hidden',
            );
          }

          // into the list: the toolbar has stuck under the bar
          await page
            .locator(first)
            .nth(3)
            .evaluate((el) => {
              window.scrollTo({
                top:
                  el.getBoundingClientRect().top +
                  window.scrollY -
                  window.innerHeight * 0.5,
                behavior: 'instant',
              });
            });
          await atRest(page);
          found.push(...(await check(page, 'list', { passing: OVER_LIST })));
          await shoot(page, info, `${name}-${tag}-list`);

          // the end of the page: the way on, and the footer
          await page.evaluate(() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: 'instant',
            }),
          );
          await atRest(page);
          await expect(page.locator('.dim-foot')).toBeInViewport();
          found.push(
            ...(await check(page, 'foot', { passing: OVER_LIST }, [
              () => expectFooterLines(page),
            ])),
          );
          await shoot(page, info, `${name}-${tag}-foot`);
          expect(found, found.join('\n')).toEqual([]);
        });
      }
    }
  }
}

// The same design in every language: same sections, same scenes in the same order, labels upright on the right.
for (const locale of LOCALES) {
  test(`structure is identical in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { locale: locale as Locale });
    await ready(page);
    expect(await page.locator('main > section').count()).toBe(13);
    expect(
      await page
        .locator('.scene')
        .evaluateAll((s) => s.map((e) => (e as HTMLElement).dataset.scene)),
    ).toEqual([
      'spawn',
      'town',
      'w1',
      'w2',
      'w3',
      'nether',
      'hall',
      'moon',
      'farm',
      'end',
      'day1',
    ]);
    await expect(page.locator('.hero h1')).toHaveAttribute(
      'aria-label',
      '雲鎮工藝',
    );
    for (const id of ['overworld', 'nether', 'end']) {
      await jumpTo(page, `#${id}`, 0.3);
      await atRest(page);
      const label = page.locator(`#${id} .vt`);
      await expect(label).toHaveCSS('writing-mode', 'vertical-rl');
      const [l, say] = await Promise.all([
        label.boundingBox(),
        page.locator(`#${id} .say`).boundingBox(),
      ]);
      expect(l!.x, `${id} label is right of the statement`).toBeGreaterThan(
        say!.x + say!.width,
      );
    }
  });
}
