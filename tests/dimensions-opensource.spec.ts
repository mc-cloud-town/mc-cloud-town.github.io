import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTextFits,
  LOCALES,
  openPage,
} from './helpers/dimensions';

/** The organisation's repositories. Unauthenticated and rate-limited: no test reaches it. */
const API = /api\.github\.com\/orgs\/mc-cloud-town\/repos/;

const repo = (
  id: number,
  name: string,
  more: Record<string, unknown> = {},
) => ({
  id,
  name,
  html_url: `https://github.com/mc-cloud-town/${name}`,
  description: `About ${name}`,
  language: 'Java',
  stargazers_count: 0,
  forks_count: 0,
  fork: false,
  archived: false,
  topics: [],
  pushed_at: '2025-03-04T05:06:07Z',
  ...more,
});

const REPOS = [
  repo(1, 'Carpet-CTEC-Addition', {
    description: 'A carpet extension for the server',
    stargazers_count: 1234,
    forks_count: 5,
  }),
  repo(2, 'ChatBridgeE', { language: 'Python', stargazers_count: 7 }),
  repo(3, 'static-data', { language: null, description: null }),
  repo(4, 'cloud-town-discord-bot', {
    language: 'TypeScript',
    topics: ['discord'],
  }),
  repo(5, 'a-tool-nobody-has-filed-under-a-role-yet-with-a-very-long-name', {
    language: 'Kotlin',
    fork: true,
    archived: true,
    pushed_at: '2024-11-09T00:00:00Z',
  }),
  repo(6, '.github'),
];

const serve = (page: Page) =>
  page.route(API, (r) => r.fulfill({ json: REPOS }));

test.describe('open source page', () => {
  for (const locale of LOCALES)
    test(`the projects, in the new shell and in the End (${locale})`, async ({
      page,
    }) => {
      await serve(page);
      await openPage(page, '/openSource/', { locale });
      await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
      await expect(page.locator('.dim-bar')).toBeVisible();
      // the hidden repository of the organisation's own settings is not a project
      await expect(page.locator('.repo')).toHaveCount(5);
      await expectNoMissingKeys(page);
    });

  test('grouped as the home page’s credits, each with its language, stars and link', async ({
    page,
  }) => {
    await serve(page);
    await openPage(page, '/openSource/');
    await expect(page.locator('.head h1')).toContainText('開源');
    await expect(page.locator('.group h2')).toHaveText([
      '遊戲核心',
      '伺服器管理',
      '基礎設施',
      '社群工具',
      '其他專案',
    ]);
    const first = page.locator('.repo').first();
    await expect(first).toHaveAttribute(
      'href',
      'https://github.com/mc-cloud-town/Carpet-CTEC-Addition',
    );
    await expect(first).toContainText('A carpet extension for the server');
    const meta = first.locator('.meta');
    await expect(meta).toContainText('Java');
    await expect(meta).toContainText('★ 1,234');
    await expect(meta).toContainText('2025.03.04');
    await expect(meta).toHaveCSS('font-family', /JetBrains Mono/);
    // what the old page said of a repository is still said
    const other = page.locator('.group').last();
    await expect(other.locator('.meta')).toContainText('Fork');
    await expect(other.locator('.meta')).toContainText('已封存');
    await expect(page.locator('.group').nth(2)).toContainText(
      '目前還沒有補上專案說明',
    );
    // the organisation's numbers
    await expect(page.locator('.os-stats dd')).toHaveText([
      '5',
      '4',
      '1,241',
      '5',
    ]);
    await expect(page.locator('.os-stats a')).toHaveAttribute(
      'href',
      'https://github.com/mc-cloud-town',
    );
  });

  test('search reads names, descriptions and topics, and says so when nothing matches', async ({
    page,
  }) => {
    await serve(page);
    await openPage(page, '/openSource/');
    await page.locator('.repo').first().waitFor();
    await page.locator('.search').fill('carpet extension');
    await expect(page.locator('.repo')).toHaveCount(1);
    await page.locator('.search').fill('CHATBRIDGE');
    await expect(page.locator('.repo')).toHaveText([/ChatBridgeE/]);
    await page.locator('.search').fill('discord');
    await expect(page.locator('.repo')).toHaveCount(1);
    await page.locator('.search').fill('zzzzzz');
    await expect(page.locator('.repo')).toHaveCount(0);
    await expect(page.locator('.empty')).toContainText('找不到');
    await page.locator('.empty button').click();
    await expect(page.locator('.repo')).toHaveCount(5);
  });

  test('a refused request is explained, with a retry and the way to GitHub', async ({
    page,
  }) => {
    await page.route(API, (r) =>
      r.fulfill({
        status: 403,
        json: { message: 'API rate limit exceeded' },
      }),
    );
    await openPage(page, '/openSource/');
    const failed = page.locator('.empty[data-state="error"]');
    await expect(failed).toContainText('次數限制');
    await expect(failed.locator('a')).toHaveAttribute(
      'href',
      'https://github.com/mc-cloud-town',
    );
    await expect(page.locator('.repo')).toHaveCount(0);
    await page.unroute(API);
    await serve(page);
    await failed.locator('button').click();
    await expect(page.locator('.repo')).toHaveCount(5);
    await expect(failed).toHaveCount(0);
  });

  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ])
    test(`nothing runs off the side at ${width}`, async ({ page }) => {
      await serve(page);
      await page.setViewportSize({ width, height });
      await openPage(page, '/openSource/');
      await page.locator('.repo').first().waitFor();
      await expectNoHorizontalScroll(page);
      await page.locator('.repo').last().scrollIntoViewIfNeeded();
      await expectNoHorizontalScroll(page);
      await expectTextFits(page, { passing: '.dim-bar, .tools' });
    });
});
