import { expect, test, type Page } from '@playwright/test';
import { NOT_HERE, openPage, skipIn } from './helpers/dimensions';
import {
  landedOn,
  ready,
  scrollToSection,
  visibleScenes,
} from './helpers/home';

// A classic scrollbar that takes room in the layout, as on a Windows desktop. Headless Chromium hides it by
// default, and a launch option cannot be set for a single group of tests: hence a file of its own.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });
// (WebKit's Windows port has such a scrollbar by itself. Firefox, as Playwright runs it, never shows one.)
test.skip(
  ({ browserName }) => browserName === 'firefox',
  `firefox: ${NOT_HERE.classicScrollbar}`,
);

const openSheet = async (page: Page) => {
  await page.locator('.dim-bar [data-action="menu"]').click();
  await expect(page.locator('.dim-sheet')).toHaveCSS('opacity', '1');
  await expect(page.locator('.dim-sheet a').last()).toHaveCSS('opacity', '1');
};
/** Pictures of the nether ledger that are on screen. */
const shownPictures = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-ledger]')]
      .filter((i) => +getComputedStyle(i).opacity > 0.5)
      .map((i) => i.dataset.ledger),
  );
/** Scroll to a fraction of the way through the pinned ledger. */
const scrollToLedgerStep = async (page: Page, fraction: number) => {
  await page.evaluate((f) => {
    const top =
      document.querySelector('#ledger')!.getBoundingClientRect().top +
      window.scrollY;
    window.scrollTo(0, top + f * 3 * window.innerHeight);
  }, fraction);
  await page.waitForTimeout(1800);
};

test.describe('shell: the menu is an overlay on the page', () => {
  test('opening and closing the menu changes nothing about the page: width, scrollbar, positions, scroll', async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 600));
    const measure = () =>
      page.evaluate(() => {
        const x = (sel: string) =>
          document.querySelector(sel)!.getBoundingClientRect().x;
        return {
          client: document.documentElement.clientWidth,
          scrollbar: window.innerWidth - document.documentElement.clientWidth,
          logo: x('.dim-bar .logo'),
          menu: x('.dim-bar [data-action="menu"]'),
          title: x('.head h1'),
          body: getComputedStyle(document.body).overflowY,
          html: getComputedStyle(document.documentElement).overflowY,
          y: window.scrollY,
        };
      });
    const before = await measure();
    // mobile emulation always overlays its scrollbar; on a desktop it is part of the layout
    if (!isMobile) expect(before.scrollbar).toBeGreaterThan(0);
    expect(before.y).toBe(600);

    await openSheet(page);
    expect(await measure()).toEqual(before);
    // the wheel over the sheet and over the bar, and the scroll keys, leave the page where it is
    await page.mouse.move(500, 400);
    await page.mouse.wheel(0, 500);
    await page.mouse.move(500, 30);
    await page.mouse.wheel(0, 500);
    for (const key of ['PageDown', 'Space', 'ArrowDown', 'End'])
      await page.keyboard.press(key);
    await page.waitForTimeout(400);
    expect(await measure()).toEqual(before);
    await expect(page.locator('.dim-sheet')).toHaveCSS('opacity', '1');

    await page.keyboard.press('Escape');
    await expect(page.locator('.dim-sheet')).toHaveCSS('visibility', 'hidden');
    expect(await measure()).toEqual(before);
    // and the page scrolls again
    await page.mouse.move(500, 400);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(before.y);
  });
});

test.describe('home: the menu over the film', () => {
  test('opening and closing the menu mid-page and inside the pinned ledger moves neither the scene nor the scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openPage(page, '/');
    await ready(page);
    const state = () =>
      page.evaluate(() => ({
        y: Math.round(window.scrollY),
        client: document.documentElement.clientWidth,
        logo: document.querySelector('.dim-bar .logo')!.getBoundingClientRect()
          .x,
        body: getComputedStyle(document.body).overflowY,
        html: getComputedStyle(document.documentElement).overflowY,
        stage: Math.round(
          document.querySelector('.ledger-stage')!.getBoundingClientRect().top,
        ),
      }));
    const menu = page.locator('.dim-bar [data-action="menu"]');
    const sheet = page.locator('.dim-sheet');
    const roundTrip = async (scenes: string[]) => {
      const before = await state();
      expect(await visibleScenes(page)).toEqual(scenes);
      await menu.click();
      await expect(sheet).toHaveCSS('opacity', '1');
      expect(await state()).toEqual(before);
      // the wheel and the keys do not reach the film behind the sheet
      await page.mouse.move(500, 400);
      await page.mouse.wheel(0, 600);
      await page.mouse.move(500, 30);
      await page.mouse.wheel(0, 600);
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(1200);
      expect(await state()).toEqual(before);
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCSS('visibility', 'hidden');
      // long enough for a smoothed scroll to have drifted, had one been started
      await page.waitForTimeout(800);
      expect(await state()).toEqual(before);
      expect(await visibleScenes(page)).toEqual(scenes);
      return before;
    };

    await scrollToSection(page, '#overworld', 0.4);
    await roundTrip(['town']);

    await scrollToLedgerStep(page, 2.5 / 6);
    expect(await shownPictures(page)).toEqual(['2']);
    const pinned = await roundTrip(['nether']);
    expect(pinned.stage).toBe(0);
    expect(await shownPictures(page)).toEqual(['2']);

    // and afterwards the film runs again
    await page.mouse.move(500, 400);
    await page.mouse.wheel(0, 400);
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)))
      .toBeGreaterThan(pinned.y);
  });
});

test.describe('home: the cover of a jump is an overlay too', () => {
  test('a cut to a far section changes nothing about the layout while the cover is up', async ({
    page,
    isMobile,
  }) => {
    skipIn(['webkit'], NOT_HERE.frames);
    await page.setViewportSize({ width: 1280, height: 768 });
    await openPage(page, '/');
    await ready(page);
    const measure = () =>
      page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scrollbar: window.innerWidth - document.documentElement.clientWidth,
        logo: document.querySelector('.dim-bar .logo')!.getBoundingClientRect()
          .x,
        body: getComputedStyle(document.body).overflowY,
        html: getComputedStyle(document.documentElement).overflowY,
      }));
    const before = await measure();
    if (!isMobile) expect(before.scrollbar).toBeGreaterThan(0);
    // every frame while the cover is there: the same measurements
    await page.evaluate(() => {
      const w = window as unknown as {
        __m: { cover: number; at: unknown }[];
        __stop: boolean;
      };
      w.__m = [];
      w.__stop = false;
      const tick = () => {
        const cover = document.querySelector('.dim-cover')!;
        const s = getComputedStyle(cover);
        w.__m.push({
          cover: s.visibility === 'hidden' ? 0 : +s.opacity,
          at: {
            client: document.documentElement.clientWidth,
            scrollbar: window.innerWidth - document.documentElement.clientWidth,
            logo: document
              .querySelector('.dim-bar .logo')!
              .getBoundingClientRect().x,
            body: getComputedStyle(document.body).overflowY,
            html: getComputedStyle(document.documentElement).overflowY,
          },
        });
        if (!w.__stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.locator('.hero a.btn').click();
    await landedOn(page, '#respawn');
    const seen = await page.evaluate(() => {
      const w = window as unknown as {
        __m: { cover: number; at: unknown }[];
        __stop: boolean;
      };
      w.__stop = true;
      return w.__m;
    });
    const covered = seen.filter((f) => f.cover > 0);
    expect(covered.length).toBeGreaterThan(10);
    expect(covered.some((f) => f.cover === 1)).toBe(true);
    for (const f of covered) expect(f.at).toEqual(before);
    expect(await measure()).toEqual(before);
    expect(await visibleScenes(page)).toEqual(['day1']);
    // the cover is out of the way of the pointer: the wheel moves the page again
    const y = await page.evaluate(() => window.scrollY);
    await page.mouse.move(600, 300);
    await page.mouse.wheel(0, -300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(y);
  });
});

test.describe('shell: the open menu has no scrollbar of its own unless it must', () => {
  const box = (page: Page) =>
    page.locator('.dim-sheet').evaluate((el) => {
      const s = el as HTMLElement;
      const last = s.querySelector('a:last-child')!.getBoundingClientRect();
      return {
        overflow: s.scrollHeight - s.clientHeight,
        scrollbar: s.offsetWidth - s.clientWidth,
        lastBottom: Math.round(last.bottom),
        screen: window.innerHeight,
      };
    });

  for (const [width, height] of [
    [950, 630],
    // six links only just fit: the size at which a second scrollbar stood beside the page's
    [950, 500],
    [1024, 768],
    [390, 844],
    [844, 390],
  ] as const)
    test(`at ${width}×${height} the six links fit and the sheet shows no scrollbar`, async ({
      page,
      isMobile,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/member/');
      await page.locator('.person').first().waitFor();
      await page.evaluate(() => window.scrollTo(0, 400));
      const pageBar = () =>
        page.evaluate(
          () => window.innerWidth - document.documentElement.clientWidth,
        );
      const before = await pageBar();
      if (!isMobile) expect(before).toBeGreaterThan(0);
      await openSheet(page);
      const m = await box(page);
      expect(m.overflow).toBeLessThanOrEqual(0);
      expect(m.scrollbar).toBe(0);
      // every link is on the screen without scrolling
      expect(m.lastBottom).toBeLessThanOrEqual(m.screen);
      await expect(page.locator('.dim-sheet a')).toHaveCount(6);
      for (const a of await page.locator('.dim-sheet a').all())
        await expect(a).toBeInViewport({ ratio: 1 });
      // the page keeps its own scrollbar, and stays where it is
      expect(await pageBar()).toBe(before);
      expect(await page.evaluate(() => window.scrollY)).toBe(400);
    });

  test('on a screen too short for six links the sheet scrolls, with a thin scrollbar in the design, and the page does not move', async ({
    page,
  }) => {
    skipIn(['webkit'], NOT_HERE.scrollbarColor);
    await page.setViewportSize({ width: 640, height: 280 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 400));
    await openSheet(page);
    const sheet = page.locator('.dim-sheet');
    expect((await box(page)).overflow).toBeGreaterThan(0);
    await expect(sheet).toHaveCSS('overflow-y', 'auto');
    await expect(sheet).toHaveCSS('scrollbar-width', 'thin');
    // the line colour of the design on a clear track, not the system's bar
    expect(
      await sheet.evaluate((el) => getComputedStyle(el).scrollbarColor),
    ).toBe('rgba(242, 244, 246, 0.18) rgba(0, 0, 0, 0)');
    await page.mouse.move(300, 200);
    await page.mouse.wheel(0, 2000);
    await expect
      .poll(() => sheet.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(400);
    await expect(sheet.locator('a').last()).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => window.scrollY)).toBe(400);
  });
});

test.describe('shell: the language list is an overlay too', () => {
  test('opening it changes nothing about the page: width, scrollbar, positions, scroll', async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize({ width: 1280, height: 768 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 500));
    const measure = () =>
      page.evaluate(() => {
        const x = (sel: string) =>
          document.querySelector(sel)!.getBoundingClientRect().x;
        return {
          client: document.documentElement.clientWidth,
          scrollbar: window.innerWidth - document.documentElement.clientWidth,
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          logo: x('.dim-bar .logo'),
          pill: x('.dim-bar [data-action="language"]'),
          discord: x('.dim-bar .discord'),
          title: x('.head h1'),
          body: getComputedStyle(document.body).overflowY,
          html: getComputedStyle(document.documentElement).overflowY,
          y: window.scrollY,
        };
      });
    const before = await measure();
    if (!isMobile) expect(before.scrollbar).toBeGreaterThan(0);
    await page.locator('.dim-bar [data-action="language"]').click();
    const list = page.locator('.dim-bar .lang-list');
    await expect(list).toHaveCSS('opacity', '1');
    expect(await measure()).toEqual(before);
    // the wheel still moves the page under it: the list holds nothing
    await page.keyboard.press('Escape');
    await expect(list).toHaveCSS('visibility', 'hidden');
    expect(await measure()).toEqual(before);
  });
});

test.describe('shell: the cover of a step to another page is an overlay too', () => {
  for (const [from, link, to] of [
    ['/member/', '/survivalProgress/', '/survivalProgress/'],
    ['/', '/member/', '/member/'],
  ] as const)
    test(`from ${from} to ${to}: nothing about the layout changes while the cover is up`, async ({
      page,
      isMobile,
    }) => {
      skipIn(['webkit'], NOT_HERE.frames);
      await page.setViewportSize({ width: 1280, height: 768 });
      // every frame of the document: the measurements, the cover, and the page it was taken on
      await page.addInitScript(() => {
        const w = window as unknown as {
          __m: { cover: number; path: string; at: unknown }[];
        };
        w.__m = [];
        const tick = () => {
          const cover = document.querySelector('.dim-cover');
          const logo = document.querySelector('.dim-bar .logo');
          if (cover && logo) {
            const s = getComputedStyle(cover);
            w.__m.push({
              cover: s.visibility === 'hidden' ? 0 : +s.opacity,
              path: window.location.pathname,
              at: {
                client: document.documentElement.clientWidth,
                scrollbar:
                  window.innerWidth - document.documentElement.clientWidth,
                logo: logo.getBoundingClientRect().x,
                body: getComputedStyle(document.body).overflowY,
                html: getComputedStyle(document.documentElement).overflowY,
              },
            });
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await openPage(page, from);
      if (from === '/') await ready(page);
      else await page.locator('.person').first().waitFor();
      const measure = () =>
        page.evaluate(() => ({
          client: document.documentElement.clientWidth,
          scrollbar: window.innerWidth - document.documentElement.clientWidth,
          logo: document
            .querySelector('.dim-bar .logo')!
            .getBoundingClientRect().x,
          body: getComputedStyle(document.body).overflowY,
          html: getComputedStyle(document.documentElement).overflowY,
        }));
      const before = await measure();
      if (!isMobile) expect(before.scrollbar).toBeGreaterThan(0);
      await page.evaluate(() => {
        (window as unknown as { __m: unknown[] }).__m = [];
      });
      // at 1280 the bar is whole: the link is in it
      await page.locator(`.dim-bar nav a[href="${link}"]`).click();
      await expect.poll(() => new URL(page.url()).pathname).toBe(to);
      await expect(page.locator('.dim-cover')).toHaveCSS(
        'visibility',
        'hidden',
      );
      // the destination has to be as long as the page that was left for its scrollbar to be the same one
      await page.locator('.person, .entry').first().waitFor();
      const seen = await page.evaluate(
        () =>
          (
            window as unknown as {
              __m: { cover: number; path: string; at: unknown }[];
            }
          ).__m,
      );
      const covered = seen.filter((f) => f.cover > 0);
      expect(covered.length).toBeGreaterThan(10);
      expect(covered.some((f) => f.cover === 1)).toBe(true);
      // on the page that is left: the same from the click until it is gone
      const leaving = covered.filter((f) => f.path === from);
      expect(leaving.length).toBeGreaterThan(5);
      for (const f of leaving) expect(f.at).toEqual(before);
      // on the page that is reached: `overflow` is never touched, whatever its own length makes of the scrollbar
      for (const f of covered)
        expect(f.at).toMatchObject({ body: 'visible', html: 'visible' });
      const after = await measure();
      expect(after).toMatchObject({ body: 'visible', html: 'visible' });
      // and once both are long pages, the layout is the one the reader left
      expect(after).toEqual(before);
    });
});
