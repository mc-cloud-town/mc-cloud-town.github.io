import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTapTargets,
  expectTextFits,
  openPage,
} from './helpers/dimensions';
import { ready, scrollToSection, visibleScenes } from './helpers/home';

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

test.describe('home: overworld', () => {
  test('the town scene shows behind the statement, with the label upright on the right', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#overworld');
    expect(await visibleScenes(page)).toEqual(['town']);
    const label = page.locator('#overworld .vt');
    await expect(label).toHaveCSS('writing-mode', 'vertical-rl');
    const [box, say] = await Promise.all([
      label.boundingBox(),
      page.locator('#overworld .say').boundingBox(),
    ]);
    expect(box!.x).toBeGreaterThan(say!.x + say!.width);
  });

  test('stats show the day count and live member count', async ({
    page,
    request,
  }) => {
    const members = (
      await (
        await request.get('https://mc-ctec.org/static-data/member.json')
      ).json()
    ).member.length;
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#overworld');
    await expect(page.locator('[data-stat="members"]')).toHaveText(
      String(members),
    );
    const days = Math.floor(
      (Date.now() - Date.UTC(2022, 6, 22, 16)) / 86_400_000,
    );
    await expect(page.locator('[data-stat="days"]')).toHaveText(
      days.toLocaleString('en-US'),
    );
    await expect(page.locator('#overworld a.more')).toHaveAttribute(
      'href',
      '/survivalProgress/',
    );
    await expectNoMissingKeys(page);
  });

  test('stats keep their defaults when the requests fail', async ({ page }) => {
    await page.route(/member\.json|api\.github\.com/, (r) => r.abort());
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#overworld');
    await expect(page.locator('[data-stat="members"]')).toHaveText('116');
    await expect(page.locator('[data-stat="repos"]')).toHaveText('29');
  });

  test('each of the three builds shows its own scene', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    for (const [i, scene] of ['w1', 'w2', 'w3'].entries()) {
      await scrollToSection(page, `[data-work="overworld-${i}"]`, 0.2);
      expect(await visibleScenes(page), `build ${i}`).toEqual([scene]);
      await expect(
        page.locator(`[data-work="overworld-${i}"] h3`),
      ).toBeVisible();
    }
  });

  test('halfway into a build both scenes are on screen', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="overworld-0"]', -0.5);
    expect(await visibleScenes(page)).toEqual(['town', 'w1']);
  });

  test('the curtain rises from the bottom and the slide comes in from the right', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    const box = (id: string) =>
      page.evaluate((scene) => {
        const r = document
          .querySelector(`.scene[data-scene="${scene}"]`)!
          .getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y) };
      }, id);
    await scrollToSection(page, '[data-work="overworld-0"]', -0.5);
    const w1 = await box('w1');
    expect(w1.x).toBe(0);
    expect(w1.y).toBeGreaterThan(200);
    expect(w1.y).toBeLessThan(700);
    await scrollToSection(page, '[data-work="overworld-1"]', -0.5);
    expect(await visibleScenes(page)).toEqual(['w1', 'w2']);
    const w2 = await box('w2');
    expect(w2.y).toBe(0);
    expect(w2.x).toBeGreaterThan(300);
    expect(w2.x).toBeLessThan(1140);
  });

  test('scrolling back up undoes every scene change', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="overworld-2"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['w3']);
    for (const [sel, scene] of [
      ['[data-work="overworld-1"]', 'w2'],
      ['[data-work="overworld-0"]', 'w1'],
      ['#overworld', 'town'],
    ] as const) {
      await scrollToSection(page, sel, 0.2);
      expect(await visibleScenes(page), sel).toEqual([scene]);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1800);
    expect(await visibleScenes(page)).toEqual(['spawn']);
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
  });

  test('on a phone in the day theme the text sits on paper, and nothing overflows', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/', { theme: 'light' });
    await ready(page);
    // offset 0: the section is at rest under the bar, nothing is scrolling past it
    await scrollToSection(page, '#overworld', 0);
    expect(await visibleScenes(page)).toEqual(['town']);
    // no clear side to keep on a narrow screen: the veil runs bottom-up under the full-width text
    const veil = await page
      .locator('.scene[data-scene="town"] .veil')
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(veil).toContain('linear-gradient(0deg');
    await expect(page.locator('#overworld .vt')).toHaveCSS(
      'writing-mode',
      'horizontal-tb',
    );
    await expectNoHorizontalScroll(page);
    await expectTextFits(page, { within: '#overworld' });
    await scrollToSection(page, '#overworld .stats', -0.4);
    await expect(page.locator('#overworld a.more')).toBeVisible();
    await expectTapTargets(page);
  });

  test('on a wide screen in the day theme the paper is on the text side only', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { theme: 'light' });
    await ready(page);
    await scrollToSection(page, '#overworld', 0);
    const veil = await page
      .locator('.scene[data-scene="town"] .veil')
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(veil).toContain('linear-gradient(90deg');
    // the label stands on the photograph, on its own strip of paper
    await expect(page.locator('#overworld .vt')).toHaveCSS(
      'background-color',
      'rgba(238, 242, 245, 0.95)',
    );
    await expectTextFits(page, { within: '#overworld' });
  });

  test('reduced motion: the statement is fully shown and scenes still switch', async ({
    page,
  }) => {
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await scrollToSection(page, '#overworld');
    expect(await visibleScenes(page)).toEqual(['town']);
    const lines = page.locator('#overworld .say span');
    expect(await lines.count()).toBe(3);
    for (const line of await lines.all())
      await expect(line).toHaveCSS('opacity', '1');
    await scrollToSection(page, '[data-work="overworld-1"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['w2']);
  });
});
