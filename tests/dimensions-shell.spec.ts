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
  LOCALES,
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
      await expectTextFits(page);
      // scrolled down, page text legitimately passes under the fixed bar: check the footer on its own
      await page.locator('.dim-foot').scrollIntoViewIfNeeded();
      await expectTextFits(page, { within: '.dim-foot' });
    });
  }

  for (const locale of LOCALES) {
    for (const width of [880, 1024, 1280]) {
      test(`bar items fit and do not overlap: ${locale} ${width}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await openPage(page, '/member/', { locale });
        // wait until the locale's copy is rendered
        await expect(page.locator('.dim-bar nav')).toContainText(
          { zh_TW: '終界', zh_CN: '末地', en: 'The End' }[locale],
        );
        const problems = await page.evaluate(() => {
          const vw = window.innerWidth;
          const items = [
            ...document.querySelectorAll<HTMLElement>(
              '.dim-bar .logo, .dim-bar nav a, .dim-bar .pill',
            ),
          ].filter((el) => el.getBoundingClientRect().width > 0);
          const rects = items.map((el) => el.getBoundingClientRect());
          const out: string[] = [];
          // the logo must keep its aspect ratio, not be squeezed by the nav
          const img =
            document.querySelector<HTMLImageElement>('.dim-bar .logo img');
          if (img) {
            const r = img.getBoundingClientRect();
            if (r.width < (img.naturalWidth / img.naturalHeight) * r.height - 1)
              out.push('logo squeezed: ' + Math.round(r.width) + 'px');
          }
          const name = (el: HTMLElement) =>
            el.textContent?.trim() || el.className;
          rects.forEach((r, i) => {
            if (r.left < -0.5 || r.right > vw + 0.5)
              out.push('outside viewport: ' + name(items[i]));
            for (let j = i + 1; j < rects.length; j++) {
              const q = rects[j];
              if (
                Math.min(r.right, q.right) - Math.max(r.left, q.left) > 1 &&
                Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 1
              )
                out.push('overlap: ' + name(items[i]) + ' x ' + name(items[j]));
            }
          });
          return out;
        });
        expect(problems, problems.join(', ')).toEqual([]);
      });
    }
  }

  test('resizing past the breakpoint closes the sheet and releases the scroll lock', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/member/');
    await page.locator('.dim-bar [data-action="menu"]').click();
    await expect(page.locator('.dim-sheet')).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('.dim-sheet')).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .not.toBe('hidden');
  });
});
