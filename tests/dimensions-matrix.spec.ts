// tests/dimensions-matrix.spec.ts
// The acceptance matrix: nine viewports × three languages × two themes × ten pages (540 cases), and the same
// structure in every language. Each case loads its page once and checks every stop of it at rest.
// Text that stands on a photograph through its veil is not measured for contrast here: the veils are the approved
// design's (docs/design-demos/dimensions-v3-video.html), and a measurement does not overrule them.
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  atRest,
  expectFooterLines,
  expectNoHorizontalScroll,
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
import { COVER_URL } from './helpers/video';

/**
 * The hero is read on the cover of its video (the stand-in's file), never on the site's own picture, which takes
 * the cover's place when the cover is over its budget: on a busy machine that would silently change what is
 * measured. A case in which it happened fails here, by name, instead.
 */
const expectHeroOnItsCover = async (page: Page) => {
  const cover = page.locator('.vid .vid-cover');
  await expect(
    cover,
    'the hero stands on the cover of its video',
  ).toHaveAttribute('data-cover', 'youtube');
  expect(
    await cover.evaluate((img: HTMLImageElement) => img.currentSrc),
  ).toMatch(COVER_URL);
};

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

/**
 * The checks of one screen; what fails is returned, so one run names every defect of a case.
 * `through` names what lies over text without hiding it (a card's link, stretched over the whole card so that the
 * picture opens the work as its name does): it paints nothing, so the text under it is not covered.
 */
const check = async (
  page: Page,
  where: string,
  {
    through,
    ...opts
  }: { within?: string; passing?: string; through?: string } = {},
  more: (() => Promise<void>)[] = [],
) => {
  const found: string[] = [];
  for (const run of [
    () => expectNoHorizontalScroll(page),
    () => expectTextFits(page, opts),
    () =>
      expectNotCovered(page, {
        ...opts,
        passing: [opts.passing, through].filter(Boolean).join(', '),
      }),
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

/**
 * The organisation's repositories, for the open-source page: GitHub's API is unauthenticated and rate-limited, so
 * the matrix never reaches it. Some of every role of the credits, and what a list can hold that is awkward: no
 * description, no language, a long name, a fork that is archived.
 */
const repo = (name: string, more: Record<string, unknown> = {}) => ({
  id: name.length * 1000 + name.charCodeAt(0),
  name,
  html_url: `https://github.com/mc-cloud-town/${name}`,
  description: `About ${name}: what it does for the server, in a sentence of ordinary length.`,
  language: 'Java',
  stargazers_count: 12,
  forks_count: 3,
  fork: false,
  archived: false,
  topics: [],
  pushed_at: '2025-03-04T05:06:07Z',
  ...more,
});
const REPOS = [
  repo('Carpet-CTEC-Addition', { stargazers_count: 1234, forks_count: 56 }),
  repo('carpetmod112'),
  repo('ChatBridgeE', { language: 'Python' }),
  repo('MCDR-LocationMarker', { language: 'Python', fork: true }),
  repo('static-data', { language: null, description: null }),
  repo('dashboard-api', { language: 'Go' }),
  repo('cloud-town-discord-bot', { language: 'TypeScript' }),
  repo('mc-cloud-town.github.io', { language: 'TypeScript' }),
  repo('a-tool-nobody-has-filed-under-a-role-yet-with-a-very-long-name', {
    language: 'Kotlin',
    fork: true,
    archived: true,
    pushed_at: '2024-11-09T00:00:00Z',
  }),
];

/**
 * The other inner pages: each is read from its top to its foot, a screen at a time, with the checks of the two
 * above. (`/collaborative/` is `/partner/` under another address; a work's detail has its own specs.)
 */
/** A work of a collection is one link: its name's, stretched over the card. */
const WORK_LINK = '.dim .work h2 a';
const MORE_PAGES: {
  name: string;
  url: string;
  /** what is in the page once it has its content */
  first: string;
  /** the page has the inner header, with its picture */
  header: boolean;
  setup?: (page: Page) => Promise<unknown>;
  /** what lies over text without hiding it (see `check`) */
  through?: string;
}[] = [
  { name: 'join', url: '/join/', first: '.join-dept', header: true },
  {
    name: 'openSource',
    url: '/openSource/',
    first: '.repo',
    header: true,
    setup: (page) =>
      page.route(/api\.github\.com\/orgs\/mc-cloud-town\/repos/, (r) =>
        r.fulfill({ json: REPOS }),
      ),
  },
  { name: 'partner', url: '/partner/', first: '.partner', header: true },
  { name: 'hardware', url: '/hardware/', first: '.spec', header: true },
  {
    name: 'redstone',
    url: '/redstoneCollection/',
    first: '.work',
    header: true,
    through: WORK_LINK,
  },
  {
    name: 'architecture',
    url: '/architectureCollection/',
    first: '.work',
    header: true,
    through: WORK_LINK,
  },
  {
    name: 'notFound',
    url: '/this-page-does-not-exist/',
    first: '.void h1',
    header: false,
  },
];

for (const vp of VIEWPORTS) {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      const tag = `${vp.name} ${locale} ${theme}`;

      test(`home ${tag}`, async ({ page }, info) => {
        test.slow();
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await openPage(page, '/', { locale: locale as Locale, theme });
        await arrived(page);
        await expectHeroOnItsCover(page);
        await expectNoMissingKeys(page);
        const found: string[] = [];
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
                ? [() => expectEvenRows(page, '#overworld .stats b')]
                : [],
            )),
          );
          await shoot(page, info, `home-${tag}-${i}-${stop.sel}`);
          if (stop.walk)
            await walk(page, stop.sel, async (n) => {
              await picturesIn(page, `${where} ↓${n}`);
              await atRest(page);
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
            () => expectFooterLines(page),
          ])),
        );
        await shoot(page, info, `home-${tag}-foot`);
        expect(found, found.join('\n')).toEqual([]);
      });

      for (const [name, url, first] of [
        ['progress', '/survivalProgress/', '.entry'],
        ['members', '/member/', '.person'],
      ] as const) {
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
          const found = await check(page, 'top');
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

      for (const p of MORE_PAGES) {
        test(`${p.name} ${tag}`, async ({ page }, info) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await p.setup?.(page);
          await openPage(page, p.url, { locale: locale as Locale, theme });
          await page.locator(p.first).first().waitFor();
          // the entrance has played: everything stands where it belongs
          await atRest(page);
          await expectNoMissingKeys(page);
          // the picture the header's words stand on
          const picture = page.locator('.head .bg img');
          await expect(picture).toHaveCount(p.header ? 1 : 0);
          if (p.header)
            await expect
              .poll(() =>
                picture.evaluate(
                  (img: HTMLImageElement) =>
                    img.complete && img.naturalWidth > 0,
                ),
              )
              .toBe(true);
          const found = await check(page, 'top', { through: p.through });
          await shoot(page, info, `${p.name}-${tag}-top`);

          // the menu, wherever the bar shows its button instead of its links
          const menu = page.locator('.dim-bar [data-action="menu"]');
          if (await menu.isVisible()) {
            await menu.click();
            await expect(page.locator('.dim-sheet')).toHaveCSS('opacity', '1');
            await atRest(page);
            found.push(
              ...(await check(page, 'menu', { within: '.dim-sheet' })),
            );
            await shoot(page, info, `${p.name}-${tag}-menu`);
            await menu.click();
            await expect(page.locator('.dim-sheet')).toHaveCSS(
              'visibility',
              'hidden',
            );
          }

          // read on to the end of the page's own content, a screen at a time
          await walk(page, '.dim main', async (n) => {
            found.push(
              ...(await check(page, `↓${n}`, {
                passing: OVER_LIST,
                through: p.through,
              })),
            );
            await shoot(page, info, `${p.name}-${tag}-down${n}`);
          });

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
            ...(await check(
              page,
              'foot',
              { passing: OVER_LIST, through: p.through },
              [() => expectFooterLines(page)],
            )),
          );
          await shoot(page, info, `${p.name}-${tag}-foot`);
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
