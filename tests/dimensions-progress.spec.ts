// tests/dimensions-progress.spec.ts
import { expect, test } from '@playwright/test';
import { expectNoMissingKeys, openPage } from './helpers/dimensions';

const DATA = /static-data\/[^/]+\/survivalProgress\.json/;

test.describe('progress page', () => {
  test('lists every milestone, newest first', async ({ page, request }) => {
    const list = await (
      await request.get(
        'https://mc-ctec.org/static-data/zh_TW/survivalProgress.json',
      )
    ).json();
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.entry')).toHaveCount(list.length);
    await expect(page.locator('.entry h2').first()).toHaveText(
      list[list.length - 1].subTitle,
    );
    await expectNoMissingKeys(page);
  });

  test('/survival/ is the same page', async ({ page }) => {
    await openPage(page, '/survival/');
    await expect(page.locator('.entry').first()).toBeVisible();
  });

  test('dimension and year filters combine, and an empty result explains itself', async ({
    page,
  }) => {
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    await page.locator('[data-filter="dim"] button[data-v="end"]').click();
    const end = await page.locator('.entry:visible').count();
    expect(end).toBeGreaterThan(0);
    for (const e of await page.locator('.entry:visible').all())
      await expect(e).toHaveAttribute('data-dim', 'end');
    await page.locator('[data-filter="year"] button[data-v="2025"]').click();
    await expect(page.locator('.entry:visible')).toHaveCount(0);
    await expect(page.locator('.empty')).toBeVisible();
    await page.locator('[data-filter="dim"] button[data-v=""]').click();
    for (const e of await page.locator('.entry:visible').all())
      await expect(e).toHaveAttribute('data-year', '2025');
  });

  test('only confirmed entries carry a dimension tag', async ({ page }) => {
    await openPage(page, '/survivalProgress/');
    await page.locator('.entry').first().waitFor();
    const tagged = await page.locator('.entry .dimtag').count(),
      all = await page.locator('.entry').count();
    expect(tagged).toBeGreaterThan(0);
    expect(tagged).toBeLessThan(all);
  });

  test('the big year and the accent follow the entry being read', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/survivalProgress/');
    const first2022 = page.locator('.entry[data-year="2022"]').first();
    await first2022.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
    await expect(page.locator('.year b')).toHaveText('2022');
  });

  test('a failed request shows an explanation and a retry control', async ({
    page,
  }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.empty')).toContainText('進度資料載入失敗');
    await expect(page.locator('.empty button')).toBeVisible();
  });
});

test.describe('progress page: sticky toolbar and retry', () => {
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    test(`toolbar stays below the bar when scrolled: ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/survivalProgress/');
      await page.locator('.entry').first().waitFor();
      await page.evaluate(() => window.scrollTo(0, 2500));
      await page.waitForTimeout(300);
      const [bar, tools] = await Promise.all(
        ['.dim-bar', '.tools'].map((s) =>
          page.locator(s).evaluate((el) => el.getBoundingClientRect().toJSON()),
        ),
      );
      expect(tools.top).toBeGreaterThanOrEqual(bar.bottom - 1);
      expect(tools.bottom).toBeLessThanOrEqual(height);
    });
  }

  test('retry reloads the log after a failed request', async ({ page }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/survivalProgress/');
    await expect(page.locator('.empty')).toContainText('進度資料載入失敗');
    await page.unroute(DATA);
    await page.locator('.empty button').click();
    await expect(page.locator('.entry').first()).toBeVisible();
  });
});
