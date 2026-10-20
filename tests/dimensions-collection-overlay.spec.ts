import { expect, test } from '@playwright/test';
import { NOT_HERE, openPage } from './helpers/dimensions';
import { detailGone, detailOpen, routeCollection } from './helpers/collection';

// A classic scrollbar that takes room in the layout, as on a Windows desktop (see dimensions-overlay.spec.ts:
// a launch option cannot be set for a single group of tests, hence a file of its own).
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });
test.skip(
  ({ browserName }) => browserName === 'firefox',
  `firefox: ${NOT_HERE.classicScrollbar}`,
);

test.describe('collection: the detail of a work is an overlay on the page', () => {
  test('opening and closing a work changes nothing about the page: width, scrollbar, positions, scroll', async ({
    page,
    isMobile,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await routeCollection(page, 'redstone');
    await openPage(page, '/redstoneCollection/');
    await expect(page.locator('.works .work')).toHaveCount(4);
    await page.evaluate(() => window.scrollTo(0, 420));
    const measure = () =>
      page.evaluate(() => {
        const x = (sel: string) =>
          document.querySelector(sel)!.getBoundingClientRect().x;
        return {
          client: document.documentElement.clientWidth,
          scrollbar: window.innerWidth - document.documentElement.clientWidth,
          height: document.documentElement.scrollHeight,
          logo: x('.dim-bar .logo'),
          title: x('.head h1'),
          card: x('.works .work'),
          body: getComputedStyle(document.body).overflowY,
          html: getComputedStyle(document.documentElement).overflowY,
          y: window.scrollY,
        };
      });
    const before = await measure();
    // mobile emulation always overlays its scrollbar; on a desktop it is part of the layout
    if (!isMobile) expect(before.scrollbar).toBeGreaterThan(0);
    expect(before.y).toBe(420);

    await page.locator('.work h2 a').first().click();
    await detailOpen(page);
    expect(await measure()).toEqual(before);
    // the wheel and the scroll keys leave the page behind where it is
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 500);
    for (const key of ['PageDown', 'ArrowDown', 'End'])
      await page.keyboard.press(key);
    await page.waitForTimeout(400);
    expect(await measure()).toEqual(before);

    await page.keyboard.press('Escape');
    await detailGone(page);
    expect(await measure()).toEqual(before);
    // and the page scrolls again
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(before.y);
  });
});
