import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTextFits,
  openPage,
} from './helpers/dimensions';

const DATA = 'https://mc-ctec.org/static-data/member.json';

test.describe('members page', () => {
  test('lists every full and trial member', async ({ page, request }) => {
    const data = await (await request.get(DATA)).json();
    const total = data.member.length + data.trial.length;
    await openPage(page, '/member/');
    await expect(page.locator('.person')).toHaveCount(total);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await expect(page.locator('.head h1')).toContainText('製作名單');
    await expectNoMissingKeys(page);
  });

  test('search filters the roster and says so when nothing matches', async ({
    page,
  }) => {
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    await page.locator('.search').fill('xiaoyu');
    await expect(page.locator('.person:visible')).toHaveCount(1);
    await page.locator('.search').fill('zzzzzz');
    await expect(page.locator('.person:visible')).toHaveCount(0);
    await expect(page.locator('.empty')).toBeVisible();
    await expect(page.locator('.group:visible')).toHaveCount(0);
  });

  test('a failed request shows an explanation and a retry control', async ({
    page,
  }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/member/');
    await expect(page.locator('.empty')).toContainText('成員資料載入失敗');
    await expect(page.locator('.empty button')).toBeVisible();
  });

  test('a very long name does not break the layout', async ({ page }) => {
    await page.route(DATA, (r) =>
      r.fulfill({
        json: {
          member: [
            {
              uuid: 'x',
              name: 'A_very_long_minecraft_name_that_keeps_going_0123456789',
            },
          ],
          trial: [],
        },
      }),
    );
    await page.setViewportSize({ width: 360, height: 740 });
    await openPage(page, '/member/');
    await page.locator('.person').waitFor();
    await expectNoHorizontalScroll(page);
    await expectTextFits(page);
  });
});

test.describe('members page: sticky toolbar and retry', () => {
  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ]) {
    test(`toolbar stays below the bar when scrolled: ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/member/');
      await page.locator('.person').first().waitFor();
      await page.evaluate(() => window.scrollTo(0, 1500));
      await page.waitForTimeout(300);
      const [bar, tools, search] = await Promise.all(
        ['.dim-bar', '.tools', '.search'].map((s) =>
          page.locator(s).evaluate((el) => el.getBoundingClientRect().toJSON()),
        ),
      );
      expect(tools.top).toBeGreaterThanOrEqual(bar.bottom - 1);
      expect(search.top).toBeGreaterThanOrEqual(bar.bottom - 1);
      expect(search.bottom).toBeLessThanOrEqual(height);
    });
  }

  test('retry reloads the roster after a failed request', async ({ page }) => {
    await page.route(DATA, (r) => r.abort());
    await openPage(page, '/member/');
    await expect(page.locator('.empty')).toContainText('成員資料載入失敗');
    await page.unroute(DATA);
    await page.locator('.empty button').click();
    await expect(page.locator('.person').first()).toBeVisible();
  });
});
