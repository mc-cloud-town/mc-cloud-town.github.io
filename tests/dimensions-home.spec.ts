import { expect, test } from '@playwright/test';
import { expectNoMissingKeys, openPage } from './helpers/dimensions';
import { ready, visibleScenes } from './helpers/home';

test.describe('home: spawn', () => {
  test('the loader gives way to the title over the spawn scene', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toBeHidden();
    await expect(page.locator('.hero h1')).toHaveAttribute(
      'aria-label',
      '雲鎮工藝',
    );
    await expect(page.locator('.hero h1')).toBeVisible();
    expect(await visibleScenes(page)).toEqual(['spawn']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
    await expectNoMissingKeys(page);
  });

  test('the title stays 雲鎮工藝 in English, with the English name beside it', async ({
    page,
  }) => {
    await openPage(page, '/', { locale: 'en' });
    await ready(page);
    await expect(page.locator('.hero h1')).toHaveAttribute(
      'aria-label',
      '雲鎮工藝',
    );
    await expect(page.locator('.hero-copy')).toContainText(
      'CLOUD TOWN EXQUISITE CRAFT',
    );
    await expect(page.locator('.hero-copy')).toContainText('Join us');
  });

  test('/home/ is the same page', async ({ page }) => {
    await openPage(page, '/home/');
    await ready(page);
    await expect(page.locator('.hero h1')).toBeVisible();
  });

  test('uptime counts days since 2022-07-23', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    const days = Math.floor(
      (Date.now() - Date.UTC(2022, 6, 22, 16)) / 86_400_000,
    );
    await expect(page.locator('.hero-meta')).toContainText(String(days));
  });
});

/** Same as LOADER_TIMEOUT_MS in src/components/dimensions/home/Loader.tsx. */
const LOADER_TIMEOUT_MS = 6000;

test.describe('home: loader', () => {
  test('the served HTML already has the loader over the whole screen', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const loader = page.locator('.loader');
    await expect(loader).toBeVisible();
    const box = (await loader.boundingBox())!;
    expect(box.x).toBeLessThanOrEqual(0);
    expect(box.y).toBeLessThanOrEqual(0);
    expect(box.width).toBeGreaterThanOrEqual(1440);
    expect(box.height).toBeGreaterThanOrEqual(900);
    await expect(loader).toHaveCSS('background-color', 'rgb(6, 8, 11)');
    await context.close();
  });

  test('the title is covered until the page is ready, and the lifting loader lets clicks through', async ({
    page,
  }) => {
    // Sample every frame from the very first one: what is on top where the title sits?
    await page.addInitScript(() => {
      const w = window as unknown as {
        __frames: number;
        __uncovered: number;
        __atReady: { loader: boolean; swallows: boolean } | null;
      };
      w.__frames = 0;
      w.__uncovered = 0;
      w.__atReady = null;
      const tick = () => {
        const dim = document.querySelector<HTMLElement>('.dim--home');
        const title = document.querySelector('.hero h1');
        if (dim && title) {
          const r = title.getBoundingClientRect();
          const top = document.elementFromPoint(
            r.left + r.width / 2,
            r.top + r.height / 2,
          );
          const loader = document.querySelector('.loader');
          const box = loader?.getBoundingClientRect();
          const style = loader && getComputedStyle(loader);
          // opaque and over the whole title (pointer-events does not matter for what is seen)
          const covered = Boolean(
            box &&
              style &&
              style.visibility === 'visible' &&
              style.opacity === '1' &&
              style.backgroundColor === 'rgb(6, 8, 11)' &&
              box.left <= r.left &&
              box.top <= r.top &&
              box.right >= r.right &&
              box.bottom >= r.bottom,
          );
          if (dim.dataset.ready !== 'true') {
            w.__frames++;
            if (!covered) w.__uncovered++;
          } else if (!w.__atReady) {
            w.__atReady = {
              loader: Boolean(loader),
              swallows: Boolean(top?.closest('.loader')),
            };
            return;
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await openPage(page, '/');
    await ready(page);
    const seen = await page.evaluate(() => {
      const w = window as unknown as {
        __frames: number;
        __uncovered: number;
        __atReady: { loader: boolean; swallows: boolean } | null;
      };
      return {
        frames: w.__frames,
        uncovered: w.__uncovered,
        atReady: w.__atReady,
      };
    });
    expect(seen.frames, 'frames sampled before ready').toBeGreaterThan(10);
    expect(seen.uncovered, 'frames with the title uncovered').toBe(0);
    // the loader is still on screen, fading, but no longer in the way of the pointer
    expect(seen.atReady).toEqual({ loader: true, swallows: false });
    await expect(page.locator('.loader')).toBeHidden();
    await expect(page.locator('.hero h1')).toBeVisible();
  });

  test('a first scene that never loads does not keep the loader up', async ({
    page,
  }) => {
    let stalled = 0;
    await page.route('**/CTEC_Members.webp', () => {
      stalled++; // never answered
    });
    await openPage(page, '/');
    await page
      .locator('.dim[data-ready="true"]')
      .waitFor({ timeout: LOADER_TIMEOUT_MS + 4000 });
    expect(stalled).toBeGreaterThan(0);
    await expect(page.locator('.loader')).toBeHidden();
    await expect(page.locator('.hero h1')).toBeVisible();
  });

  test('reduced motion: the loader goes away and the page is usable', async ({
    page,
  }) => {
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.loader')).toHaveCount(0);
    const onTop = await page.evaluate(() => {
      const r = document.querySelector('.hero .btn')!.getBoundingClientRect();
      return Boolean(
        document
          .elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          ?.closest('.hero .btn'),
      );
    });
    expect(onTop, 'the call to action can be clicked').toBe(true);
  });
});
