import { expect, test } from '@playwright/test';
import {
  LOCALES,
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTextFits,
  openPage,
} from './helpers/dimensions';

const UNKNOWN = '/this-page-does-not-exist/';

test.describe('not found page', () => {
  test('is served as a 404 inside the new shell, with the way back', async ({
    page,
  }) => {
    const res = await page.goto(UNKNOWN);
    expect(res?.status()).toBe(404);
    await page.locator('.dim').waitFor();
    await expect(page.locator('.dim-bar')).toBeVisible();
    await expect(page.locator('.dim-foot')).toBeVisible();
    await expect(page.locator('[data-shell="legacy"]')).toHaveCount(0);
    await expect(page.locator('.void h1')).toContainText('虛空');
    for (const href of ['/', '/survivalProgress/', '/member/', '/join/'])
      await expect(page.locator(`.void .ways a[href="${href}"]`)).toBeVisible();
  });

  for (const theme of ['dark', 'light'] as const)
    test(`the void is near-black and without an accent: ${theme}`, async ({
      page,
    }) => {
      await openPage(page, UNKNOWN, { theme });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const dim = page.locator('.dim');
      await expect(dim).toHaveCSS('background-color', 'rgb(6, 8, 11)');
      await expect(dim).toHaveCSS('color', 'rgb(242, 244, 246)');
      // the accent is neither the overworld's nor the Nether's nor the End's
      const accent = await dim.evaluate((el) =>
        getComputedStyle(el).getPropertyValue('--accent').trim().toLowerCase(),
      );
      expect([
        '#86cdff',
        '#0b6fb5',
        '#ff6a45',
        '#c2330f',
        '#cdb0ff',
      ]).not.toContain(accent);
    });

  for (const locale of LOCALES)
    test(`${locale}: no missing keys`, async ({ page }) => {
      await openPage(page, UNKNOWN, { locale });
      await expect(page.locator('.void .ways a')).toHaveCount(4);
      await expectNoMissingKeys(page);
    });

  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ])
    test(`does not scroll sideways, text fits: ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, UNKNOWN);
      await page.locator('.void h1').waitFor();
      await expectNoHorizontalScroll(page);
      await expectTextFits(page, { within: '.void' });
    });

  test('client navigation from it reaches the page and its shell', async ({
    page,
  }) => {
    await openPage(page, UNKNOWN);
    await page.locator('.void .ways a[href="/member/"]').click();
    await expect(page).toHaveURL(/\/member\/$/);
    await expect(page.locator('.person').first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    // the step's cover has lifted: nothing is left over the page
    await expect(page.locator('.dim-cover')).toHaveCount(1);
    await expect(page.locator('.dim-cover')).not.toHaveAttribute(
      'data-on',
      'true',
    );
    await expect(page.locator('html')).not.toHaveAttribute('data-nav', /.+/);
    await expect(page.locator('.dim-bar')).toHaveCount(1);
  });
});
