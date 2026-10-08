import { expect, test, type Page } from '@playwright/test';
import { openPage } from './helpers/dimensions';
import { ready, scrollToSection, visibleScenes } from './helpers/home';

// A classic scrollbar that takes room in the layout, as on a Windows desktop. Headless Chromium hides it by
// default, and a launch option cannot be set for a single group of tests: hence a file of its own.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

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

  test('on a short landscape screen the sheet scrolls inside itself, not the page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.evaluate(() => window.scrollTo(0, 400));
    await openSheet(page);
    const sheet = page.locator('.dim-sheet');
    expect(
      await sheet.evaluate((el) => el.scrollHeight - el.clientHeight),
    ).toBeGreaterThan(0);
    await page.mouse.move(400, 250);
    await page.mouse.wheel(0, 2000);
    await expect
      .poll(() => sheet.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
    // at its end the wheel does not carry on into the page
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBe(400);
    // the last link is reachable
    await expect(sheet.locator('a').last()).toBeInViewport();
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
