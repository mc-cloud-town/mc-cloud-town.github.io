import { expect, test, type Page } from '@playwright/test';
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

  test('switching language keeps the scenes, the statement and the captions working', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="overworld-1"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['w2']);
    const language = page.locator('.dim-bar select[data-action="language"]');
    const scenes = async (lang: string) => {
      for (const [i, scene] of ['w1', 'w2', 'w3'].entries()) {
        await scrollToSection(page, `[data-work="overworld-${i}"]`, 0.2);
        expect(await visibleScenes(page), `${lang} build ${i}`).toEqual([
          scene,
        ]);
        // the caption has risen into view
        await expect(page.locator(`[data-work="overworld-${i}"] h3`)).toHaveCSS(
          'opacity',
          '1',
        );
        await expect(page.locator(`[data-work="overworld-${i}"] p`)).toHaveCSS(
          'opacity',
          '1',
        );
      }
    };

    await language.selectOption('en');
    await expect(page.locator('[data-work="overworld-1"] h3')).toHaveText(
      'The new spawn',
    );
    await scenes('en');
    // back at the opening, with the end of the statement a third of the way down: every line is lit by then
    const sayHeight = await page
      .locator('#overworld .say')
      .evaluate((el) => el.getBoundingClientRect().height / innerHeight);
    await scrollToSection(page, '#overworld .say', sayHeight - 0.33);
    expect(await visibleScenes(page)).toEqual(['town']);
    const lines = page.locator('#overworld .say span');
    expect(await lines.count()).toBe(3);
    await expect(lines.first()).toHaveText('Redstone is engineering.');
    for (const line of await lines.all())
      await expect(line).toHaveCSS('opacity', '1');

    await language.selectOption('zh_CN');
    await expect(page.locator('[data-work="overworld-1"] h3')).toHaveText(
      '新出生点',
    );
    await scenes('zh_CN');
  });

  test('a two-line build name breaks where the copy says, and reads as one name', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="overworld-0"]', 0.2);
    const title = page.locator('[data-work="overworld-0"] h3');
    await expect(title.locator('br')).toHaveCount(1);
    await expect(title).toHaveAttribute('aria-label', '進撃の巨人 瑪莉亞之牆');
    await expect(title).not.toContainText('：');
    // a one-line name has no break
    const plain = page.locator('[data-work="overworld-1"] h3');
    await expect(plain).toHaveText('新出生點');
    await expect(plain.locator('br')).toHaveCount(0);
    await expect(page.locator('#overworld .tag')).toContainText('OVERWORLD');
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

test.describe('home: nether', () => {
  /** The six facilities of dimensions.nether.ledger (zh_TW), in order. */
  const FACILITIES = [
    '地獄大廳',
    'Y0 切門豬人農場',
    '地獄 1k 空置域',
    '雙維度百萬豬布林交易',
    '地獄大廳主砲',
    '刷花機（地獄）',
  ];
  /** Indices of the ledger pictures that are showing. */
  const shownPictures = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-ledger]')]
        .filter((i) => +getComputedStyle(i).opacity > 0.5)
        .map((i) => i.dataset.ledger),
    );
  /** Scroll to a fraction of the way through the pinned ledger. */
  const scrollToLedgerStep = async (page: Page, fraction: number) => {
    await page.evaluate((f) => {
      const top =
        document.querySelector('#ledger')!.getBoundingClientRect().top +
        window.scrollY;
      window.scrollTo(0, top + f * 3 * window.innerHeight);
    }, fraction);
    await page.waitForTimeout(1800);
  };
  /** The middle of the transition is a single scroll position, so "full" allows for a fraction of a pixel. */
  const expectPortalAtFull = async (page: Page) =>
    expect((await portalState(page)).opacity).toBeGreaterThan(0.98);
  const portalState = (page: Page) =>
    page.locator('canvas.portal').evaluate((c) => {
      const s = getComputedStyle(c);
      return { visibility: s.visibility, opacity: +s.opacity };
    });

  test('the portal covers the screen mid-transition and no game texture is requested', async ({
    page,
  }) => {
    const requested: string[] = [];
    page.on('request', (r) => requested.push(r.url()));
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether', -0.5);
    const portal = page.locator('canvas.portal');
    await expect(portal).toBeVisible();
    await expectPortalAtFull(page);
    const box = (await portal.boundingBox())!;
    const view = page.viewportSize()!;
    expect(box.x).toBeLessThanOrEqual(0);
    expect(box.y).toBeLessThanOrEqual(0);
    expect(box.x + box.width).toBeGreaterThanOrEqual(view.width);
    expect(box.y + box.height).toBeGreaterThanOrEqual(view.height);
    const painted = await portal.evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      // purple: opaque, blue well above green
      for (let i = 0; i < d.length; i += 4)
        if (d[i + 3] === 255 && d[i + 2] > 60 && d[i + 2] > d[i + 1] * 2) n++;
      return n / (d.length / 4);
    });
    expect(painted).toBeGreaterThan(0.9);
    expect(requested.length).toBeGreaterThan(0);
    expect(requested.filter((u) => /nether_portal|\/mc\//.test(u))).toEqual([]);
  });

  test('the portal swirls while it is on screen', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether', -0.5);
    const sample = () =>
      page
        .locator('canvas.portal')
        .evaluate((c: HTMLCanvasElement) =>
          Array.from(
            c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data,
          ).join(),
        );
    const first = await sample();
    await page.waitForTimeout(600);
    expect(await sample()).not.toBe(first);
  });

  test('partway in, the portal is rising over the last build; partway out, it clears over the nether', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether', -0.7);
    expect(await visibleScenes(page)).toEqual(['w3']);
    const rising = await portalState(page);
    expect(rising.visibility).toBe('visible');
    expect(rising.opacity).toBeGreaterThan(0.1);
    expect(rising.opacity).toBeLessThan(0.9);
    await scrollToSection(page, '#nether', -0.3);
    expect(await visibleScenes(page)).toEqual(['nether']);
    const clearing = await portalState(page);
    expect(clearing.visibility).toBe('visible');
    expect(clearing.opacity).toBeGreaterThan(0.1);
    expect(clearing.opacity).toBeLessThan(0.9);
  });

  test('after the portal the reader is in the nether', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether');
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('canvas.portal')).toBeHidden();
    await expect(page.locator('#nether .tag')).toContainText('THE NETHER');
    await expect(page.locator('#nether .tag .acc')).toHaveCSS(
      'color',
      'rgb(255, 106, 69)',
    );
    expect(await shownPictures(page)).toEqual(['0']);
    await expectNoMissingKeys(page);
  });

  test('in the day theme the nether accent is the darker red', async ({
    page,
  }) => {
    await openPage(page, '/', { theme: 'light' });
    await ready(page);
    await scrollToSection(page, '#nether');
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('#nether .tag .acc')).toHaveCSS(
      'color',
      'rgb(194, 51, 15)',
    );
  });

  test('scrolling back through the portal returns to the overworld', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether');
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    // back to the middle of the portal: it covers the screen again
    await scrollToSection(page, '#nether', -0.5);
    await expectPortalAtFull(page);
    // and out the other side
    await scrollToSection(page, '[data-work="overworld-2"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['w3']);
    await expect(page.locator('canvas.portal')).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
    await expect(page.locator('#overworld .tag .acc')).toHaveCSS(
      'color',
      'rgb(134, 205, 255)',
    );
    const nether = await page
      .locator('.scene[data-scene="nether"]')
      .evaluate((el) => getComputedStyle(el).visibility);
    expect(nether).toBe('hidden');
    // the last build is back at its own size, not left zoomed by the portal
    const scale = await page
      .locator('.scene[data-scene="w3"] .zoom')
      .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(scale).toBeCloseTo(1, 2);
  });

  test('the ledger walks through all six facilities and ends on the last', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#ledger', 0.05);
    await expect(page.locator('.ledger-now h3')).toHaveText('地獄大廳');
    await scrollToSection(page, '.rank', -1.05);
    await expect(page.locator('.ledger-now h3')).toHaveText('刷花機（地獄）');
    await expect(page.locator('.ledger-list li.on')).toHaveCount(1);
    expect(await shownPictures(page)).toEqual(['5']);
  });

  test('the ledger steps through its pictures in order, and back again', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    const dates = [
      '2022.08.08',
      '2023.01.17',
      '2023.04.23',
      '2024.02.13',
      '2024.09.05',
      '2025.02.11',
    ];
    const check = async (i: number, way: string) => {
      await scrollToLedgerStep(page, (i + 0.5) / 6);
      expect(await shownPictures(page), `${way} ${i}`).toEqual([String(i)]);
      await expect(page.locator('.ledger-now h3')).toHaveText(FACILITIES[i]);
      await expect(page.locator('.ledger-now .acc')).toHaveText(dates[i]);
      await expect(page.locator('.ledger-list li.on')).toHaveText(
        `0${i + 1}${FACILITIES[i]}`,
      );
      expect(await visibleScenes(page), `${way} ${i}`).toEqual(['nether']);
      // pinned: the stage has not moved
      const top = await page
        .locator('.ledger-stage')
        .evaluate((el) => Math.round(el.getBoundingClientRect().top));
      expect(top, `${way} ${i}`).toBe(0);
    };
    for (let i = 0; i < 6; i++) await check(i, 'down');
    for (let i = 4; i >= 0; i--) await check(i, 'up');
  });

  test('the rank statement follows the ledger, still in the nether', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '.rank', -0.3);
    await expect(page.locator('.rank h2')).toContainText('世界第六');
    await expect(page.locator('.rank h2 em')).toHaveText('亞洲第一');
    await expect(page.locator('.rank h2')).toHaveCSS('opacity', '1');
    await expect(page.locator('.rank h2 em')).toHaveCSS(
      'color',
      'rgb(255, 106, 69)',
    );
    // page order: everything below the pin is measured after it
    expect(await visibleScenes(page)).toEqual(['nether']);
    expect(await shownPictures(page)).toEqual(['5']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('canvas.portal')).toBeHidden();
    // the statement stands clear of the pinned stage
    const [stage, rank] = await Promise.all([
      page.locator('.ledger-stage').boundingBox(),
      page.locator('.rank').boundingBox(),
    ]);
    expect(rank!.y).toBeGreaterThanOrEqual(stage!.y + stage!.height - 1);
  });

  test('resizing while pinned keeps the nether scene and leaves no stuck spacer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToLedgerStep(page, 0.5);
    expect(await shownPictures(page)).toEqual(['3']);
    for (const [width, height] of [
      [1024, 768],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(1200);
      // wherever the resize left the scroll, go back into the pin
      await scrollToLedgerStep(page, 0.5);
      const size = `${width}×${height}`;
      expect(await visibleScenes(page), size).toEqual(['nether']);
      expect(await shownPictures(page), size).toEqual(['3']);
      await expect(page.locator('.ledger-now h3')).toHaveText(FACILITIES[3]);
      const m = await page.evaluate(() => {
        const stage = document
          .querySelector('.ledger-stage')!
          .getBoundingClientRect();
        const ledger = document
          .querySelector('#ledger')!
          .getBoundingClientRect();
        return {
          spacers: document.querySelectorAll('.pin-spacer').length,
          top: Math.round(stage.top),
          stage: Math.round(stage.height),
          ledger: Math.round(ledger.height),
          vh: window.innerHeight,
          vw: window.innerWidth,
          width: Math.round(stage.width),
        };
      });
      expect(m.spacers, size).toBe(1);
      expect(m.top, size).toBe(0);
      expect(m.stage, size).toBe(m.vh);
      expect(m.width, size).toBe(m.vw);
      // the spacer is exactly the stage plus the pinned distance at this size
      expect(m.ledger, size).toBe(m.vh * 4);
      await expectNoHorizontalScroll(page);
      await scrollToSection(page, '.rank', -0.3);
      expect(await visibleScenes(page), size).toEqual(['nether']);
      await expect(page.locator('.rank h2')).toBeVisible();
      await scrollToSection(page, '[data-work="overworld-2"]', 0.2);
      expect(await visibleScenes(page), size).toEqual(['w3']);
    }
  });

  /** Scroll to the middle of facility `i` and wait until the pinned stage shows it: picture, name, date, list row. */
  const expectLedgerStep = async (page: Page, i: number, note: string) => {
    await page.evaluate(
      (f) => {
        const top =
          document.querySelector('#ledger')!.getBoundingClientRect().top +
          window.scrollY;
        window.scrollTo(0, top + f * 3 * window.innerHeight);
      },
      (i + 0.5) / 6,
    );
    await expect.poll(() => shownPictures(page), note).toEqual([String(i)]);
    await expect(page.locator('.ledger-now h3'), note).toHaveText(
      FACILITIES[i],
    );
    await expect(page.locator('.ledger-list li.on'), note).toHaveCount(1);
    await expect(page.locator('.ledger-list li.on .mono'), note).toHaveText(
      `0${i + 1}`,
    );
    await expect
      .poll(
        () =>
          page
            .locator('.ledger-stage')
            .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
        note,
      )
      .toBe(0);
    expect(await visibleScenes(page), note).toEqual(['nether']);
  };
  /** One pin spacer, as tall as the stage plus the pinned distance at the current viewport. */
  const expectOnePin = async (page: Page, note: string) => {
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const box = (sel: string) =>
              document.querySelector(sel)!.getBoundingClientRect();
            return {
              spacers: document.querySelectorAll('.pin-spacer').length,
              ledger: Math.round(box('#ledger').height) / window.innerHeight,
              stage:
                Math.round(box('.ledger-stage').height) / window.innerHeight,
              width: Math.round(box('.ledger-stage').width) / window.innerWidth,
            };
          }),
        note,
      )
      .toEqual({ spacers: 1, ledger: 4, stage: 1, width: 1 });
  };
  /** Whatever facility the stage settles on, its name, list row and picture are the same one. */
  const expectLedgerConsistent = async (page: Page, note: string) => {
    await expect
      .poll(async () => {
        const shown = await shownPictures(page);
        const name = await page.locator('.ledger-now h3').textContent();
        const row = await page
          .locator('.ledger-list li.on .mono')
          .allTextContents();
        const k = FACILITIES.indexOf(name ?? '');
        // one picture, a known name, and the same number three times
        return (
          k >= 0 &&
          shown.length === 1 &&
          Number(shown[0]) === k &&
          row.length === 1 &&
          row[0] === `0${k + 1}`
        );
      }, note)
      .toBe(true);
  };

  test('on a short landscape screen the pinned ledger still names all six facilities, clear of the bar', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether', -0.5);
    await expectPortalAtFull(page);
    for (let i = 0; i < 6; i++) await expectLedgerStep(page, i, `down ${i}`);
    for (let i = 4; i >= 0; i--) await expectLedgerStep(page, i, `up ${i}`);
    await expectOnePin(page, '844×390');
    // only what fits: the date and the name, under the bar; the side list is put away
    await expectLedgerStep(page, 3, 'longest name');
    await expect(page.locator('.ledger-list')).toBeHidden();
    await expect(page.locator('.ledger-now h3')).toBeVisible();
    const [bar, now] = await Promise.all([
      page.locator('.dim-bar').boundingBox(),
      page.locator('.ledger-now').boundingBox(),
    ]);
    expect(now!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height);
    expect(now!.y + now!.height).toBeLessThanOrEqual(390);
    await expectTextFits(page, { within: '#ledger' });
    await expectNoHorizontalScroll(page);
    await scrollToSection(page, '.rank', 0);
    expect(await visibleScenes(page)).toEqual(['nether']);
    expect(await shownPictures(page)).toEqual(['5']);
    await expect(page.locator('.rank h2')).toBeVisible();
    await expectTextFits(page, { within: '.rank' });
    await expectTapTargets(page);
  });

  const PORTRAIT = { width: 390, height: 844 },
    LANDSCAPE = { width: 844, height: 390 };
  for (const [name, first, second] of [
    ['portrait', PORTRAIT, LANDSCAPE],
    ['landscape', LANDSCAPE, PORTRAIT],
  ] as const)
    test(`rotating a phone inside the ledger keeps it pinned, with name and picture in step (opened in ${name})`, async ({
      page,
    }) => {
      await page.setViewportSize(first);
      await openPage(page, '/');
      await ready(page);
      await expectLedgerStep(page, 2, 'as opened');
      await expectOnePin(page, 'as opened');
      for (const [size, note] of [
        [second, 'rotated'],
        [first, 'rotated back'],
      ] as const) {
        await page.setViewportSize(size);
        // measured again at the new size: one spacer, four screens of this height
        await expectOnePin(page, note);
        await expectLedgerConsistent(page, note);
        // and the steps are where they should be at this size
        await expectLedgerStep(page, 2, note);
        await expectLedgerStep(page, 5, note);
        await expectLedgerStep(page, 2, note);
        await expectNoHorizontalScroll(page);
      }
    });

  test('the portal draws only while it is on screen', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    const frames = () =>
      page
        .locator('canvas.portal')
        .evaluate((c: HTMLCanvasElement) => Number(c.dataset.frames));
    // at the hero: counted, and not moving
    expect(await frames()).toBe(0);
    await page.waitForTimeout(700);
    expect(await frames()).toBe(0);
    await scrollToSection(page, '#nether', -0.5);
    await expect.poll(frames).toBeGreaterThan(3);
    const mid = await frames();
    await expect.poll(frames).toBeGreaterThan(mid + 3);
    // through to the other side: it stops again
    await scrollToSection(page, '#nether', 0.3);
    await expect(page.locator('canvas.portal')).toBeHidden();
    const after = await frames();
    await page.waitForTimeout(700);
    expect(await frames()).toBe(after);
    // and back at the hero
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    const top = await frames();
    await page.waitForTimeout(700);
    expect(await frames()).toBe(top);
  });

  test('on a phone in the day theme the nether text fits', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/', { theme: 'light' });
    await ready(page);
    await scrollToSection(page, '#nether', 0);
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expectTextFits(page, { within: '#nether' });
    await scrollToLedgerStep(page, 0.6);
    await expect(page.locator('.ledger-now h3')).toHaveText(FACILITIES[3]);
    await expect(page.locator('.ledger-list')).toBeHidden();
    await expectTextFits(page, { within: '#ledger' });
    await scrollToSection(page, '.rank', 0.1);
    await expectTextFits(page, { within: '.rank' });
    await expectNoHorizontalScroll(page);
    await expectTapTargets(page);
  });

  test('switching language inside the nether keeps the portal, the ledger and the statement working', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToLedgerStep(page, 0.5);
    await expect(page.locator('.ledger-now h3')).toHaveText(FACILITIES[3]);
    await page
      .locator('.dim-bar select[data-action="language"]')
      .selectOption('en');
    await expect(page.locator('.ledger-now h3')).toHaveText(
      'Million-rate piglin trading',
    );
    await page.waitForTimeout(800);
    expect(await shownPictures(page)).toEqual(['3']);
    expect(await visibleScenes(page)).toEqual(['nether']);
    await scrollToLedgerStep(page, 5.5 / 6);
    expect(await shownPictures(page)).toEqual(['5']);
    await expect(page.locator('.ledger-list li.on')).toHaveCount(1);
    await expect(page.locator('.ledger-list li.on .mono')).toHaveText('06');
    await scrollToSection(page, '.rank', -0.3);
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('.rank h2')).toHaveCSS('opacity', '1');
    await expect(page.locator('.rank h2 em')).not.toHaveText('亞洲第一');
    await expectTextFits(page, { within: '.rank' });
    // the statement of the opening lights up in the new language
    const sayHeight = await page
      .locator('#nether .say')
      .evaluate((el) => el.getBoundingClientRect().height / innerHeight);
    await scrollToSection(page, '#nether .say', sayHeight - 0.33);
    const lines = page.locator('#nether .say span');
    expect(await lines.count()).toBe(2);
    await expect(lines.first()).toHaveText('Through the portal');
    for (const line of await lines.all())
      await expect(line).toHaveCSS('opacity', '1');
    await expect(page.locator('#nether p.body')).toHaveCSS('opacity', '1');
    // and the way back out still works
    await scrollToSection(page, '#nether', -0.5);
    await expectPortalAtFull(page);
    await scrollToSection(page, '[data-work="overworld-2"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['w3']);
    await expectNoMissingKeys(page);
  });

  test('reduced motion: the nether scene shows without the portal, and the ledger reads as a list', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await scrollToSection(page, '#nether', -0.5);
    await expect(page.locator('canvas.portal')).toBeHidden();
    await scrollToSection(page, '#nether');
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await scrollToSection(page, '#ledger', 0);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('.ledger-list li')).toHaveCount(6);
    await expect(page.locator('.ledger-now h3')).toHaveText(FACILITIES[0]);
    await scrollToSection(page, '.rank', -0.3);
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('.rank h2')).toBeVisible();
  });
});
