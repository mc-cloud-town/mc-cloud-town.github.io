import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTapTargets,
  expectTextFits,
  LOCALES,
  openPage,
} from './helpers/dimensions';
import { joinLink, serverLink } from '../src/constants';
const OLD = ['redstone', 'build', 'logistics'] as const;

/** What the page is checked against: the translations themselves, as the page reads them. */
interface Text {
  home: { serverRunning: string };
  join: Record<
    (typeof OLD)[number],
    { imageUrl: string; subTitle?: string; features: string[] }
  >;
  dimensions: {
    respawn: { depts: { name: string; body: string; action: string }[] };
    join: { title: string[]; next: string };
  };
}
const read = (locale: string): Text =>
  JSON.parse(
    fs.readFileSync(`src/i18n/locales/${locale}/translation.json`, 'utf8'),
  );
const TEXT = { zh_TW: read('zh_TW'), zh_CN: read('zh_CN'), en: read('en') };
const zhTW = TEXT.zh_TW;
/** In the order of respawn.depts: redstone, building, logistics. */
const ACTIONS = [
  joinLink.redstoneChannel,
  joinLink.applicationForm,
  joinLink.applicationForm,
];

test.describe('join page', () => {
  test('is in the new shell, in the respawn, with the three departments of the home page', async ({
    page,
  }) => {
    await openPage(page, '/join/');
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
    await expect(page.locator('.dim-bar')).toBeVisible();
    await expect(page.locator('[data-shell="legacy"]')).toHaveCount(0);
    // the bar says this is the page the reader is on, and nothing else is
    const current = page.locator('.dim-bar nav a[aria-current]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(current).toHaveAttribute('href', '/join/');
    await expect(page.locator('.head h1')).toContainText('如何加入');
    await expect(page.locator('.head .bg img')).toHaveAttribute(
      'src',
      '/assets/join/CTEC_Lounge.webp',
    );

    const depts = page.locator('.join-dept');
    await expect(depts).toHaveCount(3);
    for (const [i, d] of zhTW.dimensions.respawn.depts.entries()) {
      const dept = depts.nth(i);
      // the same words as the home page's respawn, and the same way in
      await expect(dept.locator('h2')).toHaveText(d.name);
      await expect(dept.locator('header p')).toHaveText(d.body);
      const action = dept.locator('.join-link');
      await expect(action).toContainText(d.action);
      await expect(action).toHaveAttribute('href', ACTIONS[i]);
      await expect(action).toHaveAttribute('target', '_blank');
      // everything the old page said about this department
      const old = zhTW.join[OLD[i]];
      for (const line of old.features)
        await expect(dept).toContainText(line.trim());
      await expect(dept.locator('figure img')).toHaveAttribute(
        'src',
        `/assets/${old.imageUrl}`,
      );
    }
    await expect(depts.nth(1)).toContainText(zhTW.join.build.subTitle!);
    // the reviewers of the redstone department, each by their own link
    const reviewers = depts.nth(0).locator('.join-people a');
    await expect(reviewers).toHaveCount(2);
    await expect(reviewers.nth(0)).toHaveAttribute(
      'href',
      'https://discordapp.com/users/676261754782613514',
    );
    await expect(reviewers.nth(1)).toHaveAttribute(
      'href',
      'https://discordapp.com/users/378510281250439168',
    );
    // the form is a link, never a frame
    await expect(page.locator('main iframe')).toHaveCount(0);
    await expect(page.locator('.join-cta')).toHaveAttribute(
      'href',
      serverLink.discord,
    );
    await expectNoMissingKeys(page);
  });

  test('says how long the server has been running', async ({ page }) => {
    await openPage(page, '/join/');
    const days = page.locator('.join-since b').first();
    await expect(days).toHaveText(/^\d{1,3}(,\d{3})*$/);
    const n = Number((await days.innerText()).replace(/,/g, ''));
    // opened 2022.07.23 (UTC+8)
    expect(n).toBe(
      Math.floor((Date.now() - Date.UTC(2022, 6, 22, 16)) / 86_400_000),
    );
    await expect(page.locator('.join-since')).toContainText(
      zhTW.home.serverRunning,
    );
  });

  for (const locale of LOCALES)
    test(`every text is translated: ${locale}`, async ({ page }) => {
      await openPage(page, '/join/', { locale });
      const t = TEXT[locale];
      await expect(page.locator('.head h1')).toHaveText(
        t.dimensions.join.title.join(''),
      );
      await expect(page.locator('.join-dept h2')).toHaveText(
        t.dimensions.respawn.depts.map((d) => d.name),
      );
      await expect(page.locator('.next a')).toContainText(
        t.dimensions.join.next,
      );
      await expectNoMissingKeys(page);
    });

  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ])
    test(`fits the screen at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/join/', { locale: 'en' });
      await expect(page.locator('.join-dept')).toHaveCount(3);
      await expectNoHorizontalScroll(page);
      for (const sel of ['.head', '.join-way', '.join-dept >> nth=1']) {
        await page.locator(sel).scrollIntoViewIfNeeded();
        await page.locator(sel).evaluate((el) =>
          window.scrollTo({
            top: el.getBoundingClientRect().top + window.scrollY - 100,
            behavior: 'instant',
          }),
        );
        await expectTextFits(page, { passing: '.dim-bar' });
        await expectTapTargets(page);
      }
      await expectNoHorizontalScroll(page);
    });

  test('the bar leads here from another page, and to the respawn section on the home page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    const onHome = page.locator('.dim-bar nav a[data-d="respawn"]');
    await expect(onHome).toHaveAttribute('href', '#respawn');
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const link = page.locator('.dim-bar nav a[data-d="respawn"]');
    await expect(link).toHaveAttribute('href', '/join/');
    await expect(link).not.toHaveAttribute('aria-current', /.*/);
    await link.click();
    await expect(page).toHaveURL(/\/join\/$/);
    await expect(page.locator('.join-dept')).toHaveCount(3);
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    await expect(
      page.locator('.dim-bar nav a[data-d="respawn"]'),
    ).toHaveAttribute('aria-current', 'page');
  });
});
