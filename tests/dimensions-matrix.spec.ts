// tests/dimensions-matrix.spec.ts
// The acceptance matrix: nine viewports × three languages × two themes × three pages (162 cases), and the same
// structure in every language. Each case loads its page once and checks every stop of it at rest.
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  atRest,
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

/** What stands over the header's picture on an inner page, each in its own colour. */
const HEAD_TEXT = [
  '.head .crumb a',
  '.head .crumb .acc',
  '.head h1',
  '.head p[data-t="body"]',
  '.head .vt',
];

/**
 * Legibility findings whose fix is a choice between several designs, awaiting the user's decision
 * (task-10-report.md, "Needs a decision"). In the cases they apply to, that one block is not asserted in the
 * case itself, so everything else in the case still is; it is kept as a `test.fixme` of its own, by the name
 * of the report entry, and comes back by deleting its line here.
 */
const PENDING: {
  entry: string;
  selector: string;
  applies: (
    page: string,
    viewport: string,
    width: number,
    theme: ThemeName,
  ) => boolean;
}[] = [
  {
    // Needs a decision 1: by night the upright label stands on the bare photograph (by day it has a strip of paper)
    entry: 'decision 1, the upright label on the photograph by night',
    selector: '.head .vt',
    applies: (page, viewport, width, theme) =>
      theme === 'dark' &&
      (page === 'progress' ? width > 860 : viewport === 'ultrawide'),
  },
  {
    // Needs a decision 2: the day accent is 4.7 : 1 on bare paper, so any picture under the veil takes it below 4.5
    entry: 'decision 2, the current page of the crumb in the day accent',
    selector: '.head .crumb .acc',
    applies: (page, _viewport, _width, theme) =>
      page === 'progress' && theme === 'light',
  },
];

/**
 * The footer's links read as one line of words: all on one row, with the same space between each word and the
 * next (measured on the words, not on the boxes that make them big enough to tap).
 */
const expectFooterLine = async (page: Page) => {
  const words = await page.locator('.dim-foot a').evaluateAll((links) =>
    links.map((a) => {
      const range = document.createRange();
      range.selectNodeContents(a);
      const r = range.getBoundingClientRect();
      return { left: r.left, right: r.right, mid: (r.top + r.bottom) / 2 };
    }),
  );
  expect(words.length, 'links in the footer').toBeGreaterThan(2);
  const problems: string[] = [];
  const rows = new Set(words.map((w) => Math.round(w.mid)));
  if (rows.size > 1) problems.push(`footer links on ${rows.size} rows`);
  else {
    const gaps = words.slice(1).map((w, i) => w.left - words[i].right);
    if (Math.max(...gaps) - Math.min(...gaps) > 1.5)
      problems.push(
        `footer links unevenly spaced: ${gaps.map((g) => g.toFixed(1)).join(', ')}`,
      );
  }
  expect(problems, problems.join('\n')).toEqual([]);
};

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

      test(`home ${tag}`, async ({ page }, info) => {
        test.slow();
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await openPage(page, '/', { locale: locale as Locale, theme });
        await arrived(page);
        await expectNoMissingKeys(page);
        const found: string[] = [];
        for (const [i, stop] of HOME_STOPS.entries()) {
          const where = `${stop.sel}+${stop.off.toFixed(2)}`;
          // at once: the page is checked where it stands, not on the way there
          await jumpTo(page, stop.sel, stop.off);
          await expect
            .poll(() => visibleScenes(page), { message: `${where} scene` })
            .toContain(stop.scene);
          await atRest(page);
          found.push(
            ...(await check(
              page,
              where,
              stop.anchor ? {} : { passing: BAR },
              stop.sel === '#overworld'
                ? [() => expectEvenRows(page, '#overworld .stats b')]
                : [],
            )),
          );
          await shoot(page, info, `home-${tag}-${i}-${stop.sel}`);
          if (stop.walk)
            await walk(page, stop.sel, async (n) => {
              found.push(
                ...(await check(page, `${where} ↓${n}`, { passing: BAR })),
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
            () => expectFooterLine(page),
          ])),
        );
        await shoot(page, info, `home-${tag}-foot`);
        expect(found, found.join('\n')).toEqual([]);
      });

      for (const [name, url, first] of [
        ['progress', '/survivalProgress/', '.entry'],
        ['members', '/member/', '.person'],
      ] as const) {
        const pending = PENDING.filter((p) =>
          p.applies(name, vp.name, vp.width, theme),
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
              () => expectFooterLine(page),
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
