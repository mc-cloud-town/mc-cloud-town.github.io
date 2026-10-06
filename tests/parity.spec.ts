import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

/**
 * Visual / content parity between the currently deployed site and the local
 * Next.js static export. The live page is captured first and used as the
 * baseline the local page must match.
 */
const LIVE_URL = process.env.PARITY_LIVE_URL ?? 'https://mc-ctec.org';

const ROUTES = [
  '/',
  '/join/',
  '/survival/',
  '/member/',
  '/redstoneCollection/',
  '/architectureCollection/',
  '/openSource/',
  '/partner/',
  '/hardware/',
];

const THEMES = ['light', 'dark'] as const;

// Third-party / non-deterministic content that differs between loads.
const BLOCKED = [
  /youtube\.com/,
  /ytimg\.com/,
  /googletagmanager\.com/,
  /googlesyndication\.com/,
  /google-analytics\.com/,
];

const preparePage = async (page: Page, theme: (typeof THEMES)[number]) => {
  await page.route('**/*', (route) =>
    BLOCKED.some((re) => re.test(route.request().url()))
      ? route.abort()
      : route.continue(),
  );
  await page.addInitScript((t) => {
    localStorage.setItem('ctec-theme-preference', t);
    localStorage.setItem('i18nextLng', 'zh');
  }, theme);
};

/** Scroll through the page so scroll-triggered reveal animations run. */
const settle = async (page: Page, url: string) => {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  // Lazy-loaded images must be fully decoded on both sides.
  await page.waitForFunction(() =>
    Array.from(document.images).every((img) => img.complete),
  );
  await page.waitForTimeout(500);
};

// Typed hero text and the running server timer change every frame.
const masks = (page: Page) => [
  page.locator('.ant-statistic'),
  page.locator('.typed-cursor'),
  page.locator('h1'),
];

/** Visible text with whitespace normalised, excluding volatile parts. */
const visibleText = (page: Page) =>
  page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll('script, style, noscript, .ant-statistic, h1')
      .forEach((el) => el.remove());
    return (clone.innerText || clone.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
  });

for (const route of ROUTES) {
  for (const theme of THEMES) {
    test(`${route} [${theme}] matches the deployed site`, async ({
      browser,
      page,
    }, testInfo) => {
      const name = `${testInfo.project.name}${route.replace(/\//g, '_')}${theme}.png`;

      // Baseline: the live site.
      const liveContext = await browser.newContext(testInfo.project.use);
      const live = await liveContext.newPage();
      await preparePage(live, theme);
      await settle(live, `${LIVE_URL}${route}`);
      const liveShot = await live.screenshot({
        fullPage: true,
        animations: 'disabled',
        mask: masks(live),
      });
      const liveText = await visibleText(live);
      await liveContext.close();

      const snapshotPath = testInfo.snapshotPath(name);
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      fs.writeFileSync(snapshotPath, liveShot);

      // Candidate: the local Next.js build.
      await preparePage(page, theme);
      await settle(page, route);

      expect(await page.title()).toBeTruthy();
      expect(await visibleText(page)).toBe(liveText);
      expect(
        await page.screenshot({
          fullPage: true,
          animations: 'disabled',
          mask: masks(page),
        }),
      ).toMatchSnapshot(name, { maxDiffPixelRatio: 0.01, threshold: 0.2 });
    });
  }
}

test('unknown route renders the 404 page', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('a[href="/home/"]')).toBeVisible();
});
