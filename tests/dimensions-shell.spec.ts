import { expect, test } from '@playwright/test';

const LEGACY = [
  '/join/',
  '/hardware/',
  '/openSource/',
  '/partner/',
  '/collaborative/',
  '/redstoneCollection/',
  '/architectureCollection/',
];

test.describe('legacy shell', () => {
  for (const route of LEGACY) {
    test(`${route} still renders inside the legacy shell`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
      await expect(page.locator('.dim')).toHaveCount(0);
    });
  }
});

import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTapTargets,
  expectTextFits,
  openPage,
  VIEWPORTS,
} from './helpers/dimensions';

test.describe('dimensions shell', () => {
  test('member page renders inside the new shell with the new typefaces', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await expect(page.locator('.dim-bar')).toBeVisible();
    await expect(page.locator('.dim-foot')).toBeVisible();
    await expect(page.locator('[data-shell="legacy"]')).toHaveCount(0);
    const fonts = await page.evaluate(() =>
      [...document.fonts]
        .filter((f) => f.status === 'loaded')
        .map((f) => f.family.replace(/"/g, '')),
    );
    expect(fonts).toContain('Chiron Hei HK');
  });

  test('theme toggle switches data-theme and survives a reload', async ({
    page,
  }) => {
    await openPage(page, '/member/', { theme: 'dark' });
    await page.locator('.dim-bar [data-action="theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('language select changes the nav copy', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page
      .locator('.dim-bar select[data-action="language"]')
      .selectOption('en');
    await expect(page.locator('.dim-bar nav')).toContainText('Overworld');
    await expectNoMissingKeys(page);
  });

  test('narrow screens get a menu that reaches every link', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/member/');
    await expect(page.locator('.dim-bar nav')).toBeHidden();
    await page.locator('.dim-bar [data-action="menu"]').click();
    const sheet = page.locator('.dim-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('a')).toHaveCount(6);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });

  for (const vp of VIEWPORTS) {
    test(`shell fits ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openPage(page, '/member/');
      await expectNoHorizontalScroll(page);
      await expectTapTargets(page);
      await page.locator('.dim-foot').scrollIntoViewIfNeeded();
      await expectTextFits(page);
    });
  }
});
