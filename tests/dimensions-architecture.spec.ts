import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  LOCALES,
  openPage,
} from './helpers/dimensions';
import {
  collectionData,
  detail,
  detailGone,
  detailOpen,
  routeCollection,
  WORKS,
} from './helpers/collection';

// The same component as the redstone collection (its behaviour is in dimensions-redstone.spec.ts): here, that
// this page is that component with its own data, words and dimension.
const PATH = '/architectureCollection/';
const DATA = collectionData('architecture');

test.describe('architecture collection', () => {
  test('is in the new shell, in the overworld, with its own words and its own data', async ({
    page,
  }) => {
    const asked: string[] = [];
    page.on('request', (r) => {
      if (/Collection\.json/.test(r.url())) asked.push(r.url());
    });
    await routeCollection(page, 'architecture', WORKS.slice(2));
    await openPage(page, PATH);
    await expect(page.locator('.dim-bar')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
    await expect(page.locator('.head h1')).toContainText('建築作品');
    await expect(page.locator('.head .crumb')).toContainText('主世界');

    const cards = page.locator('.works .work');
    await expect(cards).toHaveCount(2);
    await expect(cards.first().locator('h2')).toHaveText('出生點雕塑');
    await expect(cards.first().locator('.meta')).toContainText('2023.12.25');
    await expect(page.locator('.tools .count')).toContainText('2 / 2');
    expect(asked.length).toBeGreaterThan(0);
    for (const url of asked) expect(url).toContain('architectureCollection');
    // the other collection is one step away
    await expect(page.locator('.next a')).toHaveAttribute(
      'href',
      '/redstoneCollection/',
    );
    await expectNoMissingKeys(page);
  });

  test('a work opens over the page at its own address, and closes', async ({
    page,
  }) => {
    await routeCollection(page, 'architecture', WORKS.slice(2));
    await openPage(page, PATH);
    const link = page.locator('.work[data-work="spawn"] h2 a');
    await link.click();
    await detailOpen(page);
    await expect(page).toHaveURL(/\/architectureCollection\/\?work=spawn$/);
    await expect(detail(page).locator('h2')).toHaveText('出生點雕塑');
    await expect(detail(page).locator('.wd-slide')).toHaveCount(2);
    await page.keyboard.press('Escape');
    await detailGone(page);
    await expect(page).toHaveURL(/\/architectureCollection\/$/);
    await expect(link).toBeFocused();
  });

  test('a failed request explains itself and offers a retry', async ({
    page,
  }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, PATH);
    await expect(page.locator('.empty[data-state="error"]')).toContainText(
      '作品資料載入失敗',
    );
    await expect(page.locator('.empty button')).toBeVisible();
    await expect(page.locator('.works .work')).toHaveCount(0);
  });

  for (const locale of LOCALES)
    test(`no missing words: ${locale}`, async ({ page }) => {
      await routeCollection(page, 'architecture', WORKS.slice(2));
      await openPage(page, `${PATH}?work=spawn`, { locale });
      await detailOpen(page);
      await expect(page.locator('.works .work')).toHaveCount(2);
      await expectNoMissingKeys(page);
    });

  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ])
    test(`no sideways scroll: ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await routeCollection(page, 'architecture', WORKS.slice(2));
      await openPage(page, PATH);
      await expect(page.locator('.works .work')).toHaveCount(2);
      await expectNoHorizontalScroll(page);
    });
});
