import { expect, test } from '@playwright/test';
import {
  LOCALES,
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTextFits,
  openPage,
  setLanguage,
} from './helpers/dimensions';

test.describe('hardware page', () => {
  test('is in the new shell, in the Nether, with every group and feature', async ({
    page,
  }) => {
    await openPage(page, '/hardware/');
    await expect(page.locator('.dim-bar')).toBeVisible();
    await expect(page.locator('.dim-foot')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('.head h1')).toContainText('這幾台機器');
    await expect(page.locator('.spec')).toHaveCount(6);
    await expect(page.locator('.feature')).toHaveCount(7);
    // the model of the processor is a value, set in the mono face
    const first = page.locator('.spec').first();
    await expect(first.locator('dt')).toContainText('處理器');
    await expect(first.locator('dd').first()).toContainText(
      'Intel Core i9-13900K',
    );
    const family = await first
      .locator('dd')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain('JetBrains Mono');
    await expectNoMissingKeys(page);
  });

  for (const locale of LOCALES)
    test(`${locale}: no missing keys, same structure`, async ({ page }) => {
      await openPage(page, '/hardware/', { locale });
      await expect(page.locator('.spec')).toHaveCount(6);
      await expect(page.locator('.feature')).toHaveCount(7);
      await expectNoMissingKeys(page);
    });

  test('a language switch changes the words, not the structure', async ({
    page,
  }) => {
    await openPage(page, '/hardware/');
    await setLanguage(page, 'en');
    await expect(page.locator('.spec').first().locator('dt')).toContainText(
      'Processor',
    );
    await expect(page.locator('.spec')).toHaveCount(6);
  });

  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ])
    test(`does not scroll sideways, text fits: ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/hardware/');
      await page.locator('.spec').first().waitFor();
      await expectNoHorizontalScroll(page);
      await expectTextFits(page, { within: '.specs' });
    });
});
