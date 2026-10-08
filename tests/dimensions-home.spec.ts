import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  expectNoMissingKeys,
  expectTapTargets,
  expectTextFits,
  openPage,
  setLanguage,
} from './helpers/dimensions';
import {
  type Frame,
  coverAtLanding,
  coverRuns,
  landedOn,
  ready,
  record,
  recorded,
  scrollToSection,
  topOf,
  visibleScenes,
} from './helpers/home';
import { STAR_DRIFT } from '../src/constants/starfield';
import { readFileSync } from 'node:fs';

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

test.describe('home: the loader is a map of the world being generated', () => {
  /** The colours of the map, as in src/lib/dimensions/loaderMap.ts. */
  const GROUND = '6,8,11';
  const FIRST_GREY = '57,66,76';
  const FRONTIER = '134,205,255';
  const DONE = '242,244,246';

  interface Seen {
    pct: string;
    label: string;
    /** opacity of the block that holds the map: below 1 once the lift has begun */
    block: number;
    ready: boolean;
    colours: number;
    /** every colour on the map */
    palette: string[];
    centre: string;
    ring: string;
    inner: string;
    border: string;
    corner: string;
  }
  /** Record the loader on every frame from the very first one. */
  const watch = (page: Page) =>
    page.addInitScript(() => {
      const w = window as unknown as { __loader: unknown[] };
      w.__loader = [];
      const tick = () => {
        const map = document.querySelector<HTMLCanvasElement>('.loader canvas');
        const block = document.querySelector('.loader-in');
        if (map && block) {
          const d = map
            .getContext('2d')!
            .getImageData(0, 0, map.width, map.height).data;
          const at = (x: number, y: number) => {
            const i = (y * map.width + x) * 4;
            // nothing drawn yet: the loader's own ground shows through
            return d[i + 3] === 0
              ? '6,8,11'
              : `${d[i]},${d[i + 1]},${d[i + 2]}`;
          };
          const all = new Set<string>();
          for (let y = 0; y < map.height; y++)
            for (let x = 0; x < map.width; x++) all.add(at(x, y));
          w.__loader.push({
            pct: document.querySelector('.loader .pct')?.textContent ?? '',
            label: document.querySelector('.loader .stage')?.textContent ?? '',
            block: +getComputedStyle(block).opacity,
            ready:
              document.querySelector<HTMLElement>('.dim--home')?.dataset
                .ready === 'true',
            colours: all.size,
            palette: [...all],
            centre: at(10, 10),
            inner: at(13, 10),
            ring: at(18, 10),
            border: at(19, 10),
            corner: at(0, 0),
          });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  const seen = (page: Page) =>
    page.evaluate(() => (window as unknown as { __loader: Seen[] }).__loader);
  const number = (f: Seen) => Number(f.pct.replace('%', ''));

  test('the served HTML has the map as a 21×21 pixel canvas, drawn large with hard pixels', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const map = page.locator('.loader canvas');
    await expect(map).toHaveCount(1);
    await expect(map).toHaveAttribute('width', '21');
    await expect(map).toHaveAttribute('height', '21');
    await expect(map).toHaveCSS('image-rendering', 'pixelated');
    const box = (await map.boundingBox())!;
    expect(box.width).toBe(300);
    expect(box.height).toBe(300);
    // the percentage above the map, the stage below it
    const [pct, stage] = await Promise.all([
      page.locator('.loader .pct').boundingBox(),
      page.locator('.loader .stage').boundingBox(),
    ]);
    expect(pct!.y + pct!.height).toBeLessThanOrEqual(box.y);
    expect(stage!.y).toBeGreaterThanOrEqual(box.y + box.height);
    await expect(page.locator('.loader .pct')).toHaveText('0%');
    await expect(page.locator('.loader .stage')).toHaveText('正在建置地形');
    await expect(page.locator('.loader .pct')).toHaveCSS(
      'font-family',
      /JetBrains Mono/,
    );
    // no picture of any kind in the loader
    await expect(page.locator('.loader img')).toHaveCount(0);
    await context.close();
  });

  test('chunks pass through their stages from the centre outward and settle into a finished square with a blue ring', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watch(page);
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toBeHidden();
    const frames = await seen(page);
    expect(frames.length).toBeGreaterThan(40);
    // before anything is drawn: one colour
    expect(frames[0].colours).toBe(1);
    expect(number(frames[0])).toBe(0);
    // partway: several stages are on the map at once, the centre ahead of the rim
    const mid = frames.filter((f) => number(f) >= 30 && number(f) <= 70);
    expect(mid.length).toBeGreaterThan(5);
    for (const f of mid) expect(f.colours).toBeGreaterThan(frames[0].colours);
    expect(Math.max(...mid.map((f) => f.colours))).toBeGreaterThanOrEqual(5);
    expect(mid.some((f) => f.centre === DONE && f.ring !== FRONTIER)).toBe(
      true,
    );
    // the percentage only ever grows
    frames.forEach((f, i) =>
      expect(number(f), `frame ${i}`).toBeGreaterThanOrEqual(
        number(frames[i - 1] ?? f),
      ),
    );
    // finished: done inside, the frontier colour on the ring, the first grey on the border, to the very corner
    const full = frames.filter((f) => f.pct === '100%');
    expect(full.length).toBeGreaterThan(5);
    for (const f of full) {
      expect(f.centre).toBe(DONE);
      expect(f.inner).toBe(DONE);
      expect(f.ring).toBe(FRONTIER);
      expect(f.border).toBe(FIRST_GREY);
      expect(f.corner).toBe(FIRST_GREY);
      expect(f.colours).toBe(3);
    }
    // the site's own greys and the overworld's blue, at every moment: no green, no other colour
    const allowed = [
      GROUND,
      '13,18,23',
      FIRST_GREY,
      '111,121,132',
      '154,163,173',
      FRONTIER,
      DONE,
    ];
    const used = new Set(frames.flatMap((f) => f.palette));
    for (const colour of used) expect(allowed).toContain(colour);
    expect(used.has(FRONTIER)).toBe(true);
    // 100% is reached before the lift begins, and before the page is handed over
    const lifting = frames.filter((f) => f.block < 1);
    expect(lifting.length).toBeGreaterThan(5);
    for (const f of lifting) expect(f.pct).toBe('100%');
    for (const f of frames.filter((f) => f.ready)) expect(f.pct).toBe('100%');
    const held = frames.filter((f) => f.pct === '100%' && f.block === 1);
    expect(held.length).toBeGreaterThan(2);
    // it starts by building; whether it also has to wait depends on the network of the moment
    expect(frames[0].label).toBe('正在建置地形');
  });

  test('with the first scene stalled the map creeps, the label says the world is being entered, and it still lifts at the timeout', async ({
    page,
  }) => {
    await page.route('**/CTEC_Members.webp', () => {
      // never answered
    });
    await watch(page);
    await openPage(page, '/');
    await page
      .locator('.dim[data-ready="true"]')
      .waitFor({ timeout: LOADER_TIMEOUT_MS + 5000 });
    await expect(page.locator('.loader')).toBeHidden();
    await expect(page.locator('.hero h1')).toBeVisible();
    const frames = await seen(page);
    const labels = [...new Set(frames.map((f) => f.label))];
    expect(labels).toEqual(['正在建置地形', '正在進入世界']);
    // while it waits it never claims to be done, and it never stands still for long
    const waiting = frames.filter(
      (f) => f.label === '正在進入世界' && !f.ready,
    );
    expect(waiting.length).toBeGreaterThan(30);
    const values = waiting.map(number);
    expect(values[0]).toBeGreaterThanOrEqual(82);
    expect(new Set(values.filter((v) => v < 100)).size).toBeGreaterThan(4);
    // it creeps up to 95% and stays there; only the last third of a second, once the wait is over, goes beyond
    const creeping = values.filter((v) => v <= 95);
    const finishing = values.filter((v) => v > 95 && v < 100);
    expect(creeping.length).toBeGreaterThan(100);
    expect(finishing.length).toBeLessThan(creeping.length / 4);
    // and it does finish: 100% before the lift
    for (const f of frames.filter((f) => f.block < 1))
      expect(f.pct).toBe('100%');
    expect(frames.at(-1)!.pct).toBe('100%');
  });

  test('in English the two stages are named in English', async ({ page }) => {
    await page.route('**/CTEC_Members.webp', () => {
      // never answered
    });
    await watch(page);
    await openPage(page, '/', { locale: 'en' });
    await page
      .locator('.dim[data-ready="true"]')
      .waitFor({ timeout: LOADER_TIMEOUT_MS + 5000 });
    const labels = [...new Set((await seen(page)).map((f) => f.label))];
    // (the served HTML is in the default language until the reader's own is known)
    expect(labels.slice(-2)).toEqual([
      'Building terrain',
      'Entering the world',
    ]);
    await expectNoMissingKeys(page);
  });

  test('reduced motion: the finished map at once, no build-up, and the loader goes', async ({
    page,
  }) => {
    await watch(page);
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const frames = await seen(page);
    expect(frames.length).toBeGreaterThan(3);
    // the static markup says 0% until the page starts; after that only the finished map
    const values = new Set(frames.map((f) => f.pct));
    for (const v of values) expect(['0%', '100%']).toContain(v);
    expect(values.has('100%')).toBe(true);
    const drawn = frames.filter((f) => f.pct === '100%');
    expect(drawn.length).toBeGreaterThan(1);
    for (const f of drawn) {
      expect(f.centre).toBe(DONE);
      expect(f.ring).toBe(FRONTIER);
      expect(f.border).toBe(FIRST_GREY);
    }
    await expect(page.locator('.hero h1')).toBeVisible();
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

    await setLanguage(page, 'en');
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

    await setLanguage(page, 'zh_CN');
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
    // one line only, and it is the accent-coloured one
    await expect(page.locator('.rank h2')).toHaveText('亞洲第一');
    await expect(page.locator('.rank h2 em')).toHaveText('亞洲第一');
    await expect(page.locator('.rank h2 em')).toHaveCount(1);
    // no locale claims a world ranking any more
    for (const locale of ['zh_TW', 'zh_CN', 'en']) {
      const rank: string[] = JSON.parse(
        readFileSync(`src/i18n/locales/${locale}/translation.json`, 'utf8'),
      ).dimensions.nether.rank;
      expect(rank, locale).toHaveLength(1);
      expect(rank.join(' '), locale).not.toMatch(/第六|6th|sixth/i);
    }
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
    await setLanguage(page, 'en');
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

test.describe('home: the end', () => {
  /** The picture each End scene must carry (survivalProgress ids). */
  const PICTURES = { hall: 'p21', moon: 'p14', farm: 'p6' } as const;
  /** Where each End scene is at rest: selector and offset for scrollToSection. */
  const STOPS = [
    ['#end', 0.3, 'hall'],
    ['[data-work="end-0"]', 0.2, 'moon'],
    ['[data-work="end-1"]', 0.2, 'farm'],
    ['#credits', 0.3, 'end'],
  ] as const;
  /** Walk the pinned ledger from its first facility to its last, as a reader would. */
  const walkTheLedger = async (page: Page) => {
    for (const f of [0.1, 0.5, 0.95]) {
      await page.evaluate((k) => {
        const top =
          document.querySelector('#ledger')!.getBoundingClientRect().top +
          window.scrollY;
        window.scrollTo(0, top + k * 3 * window.innerHeight);
      }, f);
      await expect.poll(() => visibleScenes(page)).toEqual(['nether']);
    }
    await expect(page.locator('.pin-spacer')).toHaveCount(1);
  };
  /** Rotation in degrees, scale and position of a scene's layer or of its .zoom. */
  const pose = (page: Page, scene: string, part: '' | ' .zoom' = ' .zoom') =>
    page.evaluate(
      ([id, sub]) => {
        const el = document.querySelector<HTMLElement>(
          `.scene[data-scene="${id}"]${sub}`,
        )!;
        const m = new DOMMatrix(getComputedStyle(el).transform);
        const r = el.getBoundingClientRect();
        return {
          rotate: (Math.atan2(m.b, m.a) * 180) / Math.PI,
          scale: Math.hypot(m.a, m.b),
          x: Math.round(r.x),
          y: Math.round(r.y),
        };
      },
      [scene, part],
    );
  const picture = (page: Page, scene: string) =>
    page
      .locator(`.scene[data-scene="${scene}"] img`)
      .first()
      .getAttribute('src');
  const lit = async (page: Page, selector: string) => {
    const els = page.locator(selector);
    expect(await els.count(), selector).toBeGreaterThan(0);
    for (const el of await els.all())
      await expect(el).toHaveCSS('opacity', '1');
  };

  test('three End builds each show their own scene, then the stars', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#end');
    expect(await visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await expect(page.locator('[data-work="end-0"] h3')).toHaveText('月宮');
    await scrollToSection(page, '[data-work="end-1"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['farm']);
    await expect(page.locator('[data-work="end-1"] h3')).toHaveText(
      '終界農業區',
    );
    await scrollToSection(page, '#credits', 0.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
  });

  test('after the whole pinned ledger, every End scene is its own picture, down and back up', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    for (const [scene, id] of Object.entries(PICTURES))
      expect(await picture(page, scene), scene).toContain(
        `/survivalProgress/${id}.webp`,
      );
    await walkTheLedger(page);
    await scrollToSection(page, '.rank', -0.3);
    expect(await visibleScenes(page)).toEqual(['nether']);
    for (const [sel, off, scene] of STOPS) {
      await scrollToSection(page, sel, off);
      expect(await visibleScenes(page), `down ${sel}`).toEqual([scene]);
    }
    // the caption of a build has risen by the time its scene is at rest
    await scrollToSection(page, '[data-work="end-1"]', 0.2);
    await lit(page, '[data-work="end-1"] .work > div > *');
    for (const [sel, off, scene] of [...STOPS].reverse()) {
      await scrollToSection(page, sel, off);
      expect(await visibleScenes(page), `up ${sel}`).toEqual([scene]);
    }
    await lit(page, '#end p.body');
    await scrollToSection(page, '.rank', -0.3);
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
  });

  test('the fall: the nether spins away and shrinks while the hall turns into place, and back', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await walkTheLedger(page);
    // 60% of the way through the transition
    await scrollToSection(page, '#end', -0.4);
    expect(await visibleScenes(page)).toEqual(['nether', 'hall']);
    const leaving = await pose(page, 'nether');
    expect(leaving.rotate).toBeGreaterThan(4);
    expect(leaving.rotate).toBeLessThan(20);
    expect(leaving.scale).toBeGreaterThan(0.6);
    expect(leaving.scale).toBeLessThan(0.95);
    const arriving = await pose(page, 'hall');
    expect(arriving.rotate).toBeLessThan(-2);
    expect(arriving.rotate).toBeGreaterThan(-30);
    expect(arriving.scale).toBeGreaterThan(1.03);
    expect(arriving.scale).toBeLessThan(1.6);
    // landed: the hall is square and still
    await scrollToSection(page, '#end', 0);
    expect(await visibleScenes(page)).toEqual(['hall']);
    const landed = await pose(page, 'hall');
    expect(Math.abs(landed.rotate)).toBeLessThan(0.01);
    expect(landed.scale).toBeCloseTo(1, 3);
    // and back: the nether is whole again, the hall is off
    await scrollToSection(page, '.rank', -0.3);
    expect(await visibleScenes(page)).toEqual(['nether']);
    const back = await pose(page, 'nether');
    expect(Math.abs(back.rotate)).toBeLessThan(0.01);
    expect(back.scale).toBeCloseTo(1, 3);
    await expect(page.locator('.scene[data-scene="hall"]')).toBeHidden();
    await expect(page.locator('.rank h2')).toHaveCSS('opacity', '1');
  });

  test('the moon slides in from the right and the farm rises from the bottom, and both undo', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="end-0"]', -0.5);
    expect(await visibleScenes(page)).toEqual(['hall', 'moon']);
    const moon = await pose(page, 'moon', '');
    expect(moon.y).toBe(0);
    expect(moon.x).toBeGreaterThan(300);
    expect(moon.x).toBeLessThan(1140);
    await scrollToSection(page, '[data-work="end-1"]', -0.5);
    expect(await visibleScenes(page)).toEqual(['moon', 'farm']);
    const farm = await pose(page, 'farm', '');
    expect(farm.x).toBe(0);
    expect(farm.y).toBeGreaterThan(200);
    expect(farm.y).toBeLessThan(700);
    await scrollToSection(page, '[data-work="end-1"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['farm']);
    // back up: each later layer is switched off, not parked off screen
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await expect(page.locator('.scene[data-scene="farm"]')).toBeHidden();
    await scrollToSection(page, '#end', 0.3);
    expect(await visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('.scene[data-scene="moon"]')).toBeHidden();
    await expect(page.locator('.scene[data-scene="farm"]')).toBeHidden();
  });

  test('the farm pushes in and dissolves into the stars, and comes back', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#credits', -0.4);
    expect(await visibleScenes(page)).toEqual(['farm', 'end']);
    const farm = await pose(page, 'farm');
    expect(farm.scale).toBeGreaterThan(1.02);
    expect(farm.scale).toBeLessThan(1.22);
    expect(Math.abs(farm.rotate)).toBeLessThan(0.01);
    await scrollToSection(page, '#credits', 0.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    await expect(page.locator('.scene[data-scene="farm"]')).toBeHidden();
    await scrollToSection(page, '[data-work="end-1"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['farm']);
    await expect(page.locator('.scene[data-scene="end"]')).toBeHidden();
    expect((await pose(page, 'farm')).scale).toBeCloseTo(1, 3);
  });

  test('the stars are three drifting layers that move only while they are shown', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    const layers = page.locator('.scene[data-scene="end"] .starfield i');
    await expect(layers).toHaveCount(3);
    for (const l of await layers.all())
      await expect(l).toHaveCSS('background-image', /^url\("data:image\/png/);
    const at = () =>
      layers.evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).transform).join('|'),
      );
    // at the hero: nothing moves
    const top = await at();
    await page.waitForTimeout(700);
    expect(await at()).toBe(top);
    await scrollToSection(page, '#credits', 0.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    const shown = await at();
    await page.waitForTimeout(1500);
    // every layer has moved, not just one
    const later = (await at()).split('|');
    shown
      .split('|')
      .forEach((v, i) => expect(later[i], `layer ${i}`).not.toBe(v));
    // back above the End they stand still again
    await scrollToSection(page, '.rank', -0.3);
    expect(await visibleScenes(page)).toEqual(['nether']);
    const hidden = await at();
    await page.waitForTimeout(700);
    expect(await at()).toBe(hidden);
  });

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [844, 390],
  ] as const)
    test(`the stars cover a ${width}×${height} screen at both ends of their drift`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/');
      await ready(page);
      await scrollToSection(page, '#credits', 0.3);
      expect(await visibleScenes(page)).toEqual(['end']);
      // each layer drifts this far sideways and upwards from where the stylesheet puts it
      const gaps = await page
        .locator('.scene[data-scene="end"] .starfield i')
        .evaluateAll(
          (els, drift) =>
            els.map((el) => {
              const m = new DOMMatrix(getComputedStyle(el).transform);
              const r = el.getBoundingClientRect();
              const [left, right, top, bottom] = [
                r.left - m.e,
                r.right - m.e,
                r.top - m.f,
                r.bottom - m.f,
              ];
              return {
                left: left + drift.x <= 0,
                right: right - drift.x >= window.innerWidth,
                top: top <= 0,
                bottom: bottom - drift.y >= window.innerHeight,
              };
            }),
          STAR_DRIFT,
        );
      expect(gaps).toHaveLength(3);
      for (const g of gaps)
        expect(g).toEqual({ left: true, right: true, top: true, bottom: true });
    });

  test('credits list every full and trial member and link to the roster', async ({
    page,
    request,
  }) => {
    const data = await (
      await request.get('https://mc-ctec.org/static-data/member.json')
    ).json();
    expect(data.member.length).toBeGreaterThan(0);
    expect(data.trial.length).toBeGreaterThan(0);
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#credits', 0.3);
    await expect(
      page.locator('#credits [data-names="member"] span'),
    ).toHaveCount(data.member.length);
    await expect(
      page.locator('#credits [data-names="trial"] span'),
    ).toHaveCount(data.trial.length);
    await expect(
      page.locator('#credits [data-names="member"] span').first(),
    ).toHaveText(data.member[0].name);
    const roles = page.locator('#credits .roles a');
    await expect(roles).toHaveCount(18);
    await expect(roles.first()).toHaveAttribute(
      'href',
      'https://github.com/mc-cloud-town/Carpet-CTEC-Addition',
    );
    for (const a of await roles.all()) {
      const name = (await a.textContent())!.trim();
      await expect(a).toHaveAttribute(
        'href',
        `https://github.com/mc-cloud-town/${name}`,
      );
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
    }
    await expect(page.locator('#credits .roles dt')).toHaveText([
      '遊戲核心',
      '伺服器管理',
      '基礎設施',
      '社群工具',
    ]);
    await expect(page.locator('#credits a.more')).toHaveAttribute(
      'href',
      '/member/',
    );
    // the last line of the credits is reachable, still over the stars
    await page.locator('#credits .fin').scrollIntoViewIfNeeded();
    await expect(page.locator('#credits .fin')).toHaveText('還沒結束。');
    await expect.poll(() => visibleScenes(page)).toEqual(['end']);
  });

  test('duplicate uuids in the member data do not drop or repeat names', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    const same = '00000000-0000-0000-0000-000000000000';
    await page.route(/member\.json/, (r) =>
      r.fulfill({
        json: {
          member: [
            { uuid: same, name: 'first_one' },
            { uuid: same, name: 'second_one' },
            { uuid: 'a', name: 'third_one' },
          ],
          trial: [{ uuid: same, name: 'trial_one' }],
        },
        headers: { 'access-control-allow-origin': '*' },
      }),
    );
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#credits', 0.3);
    await expect(
      page.locator('#credits [data-names="member"] span'),
    ).toHaveText(['first_one', 'second_one', 'third_one']);
    await expect(page.locator('#credits [data-names="trial"] span')).toHaveText(
      ['trial_one'],
    );
    expect(errors.filter((e) => /same key/.test(e))).toEqual([]);
  });

  test('when the member request fails the tools stay and the member lists are hidden', async ({
    page,
  }) => {
    await page.route(/member\.json/, (r) => r.abort());
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#credits', 0.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    await expect(page.locator('#credits .roles')).toBeVisible();
    await expect(page.locator('#credits .roles a')).toHaveCount(18);
    await expect(page.locator('#credits [data-names]')).toHaveCount(0);
    // no heading is left behind for a list that is not there
    await expect(page.locator('#credits h2')).toHaveCount(1);
    await expect(page.locator('#credits a.more')).toBeVisible();
    await expect(page.locator('#credits .fin')).toHaveText('還沒結束。');
  });

  test('a slow member request: the page works meanwhile, and the names arrive without moving the scenes', async ({
    page,
  }) => {
    let release = () => {};
    const held = new Promise<void>((done) => {
      release = done;
    });
    await page.route(/member\.json/, async (r) => {
      await held;
      await r.fulfill({
        json: {
          member: Array.from({ length: 120 }, (_, i) => ({
            uuid: `m${i}`,
            name: `member_${i}`,
          })),
          trial: Array.from({ length: 30 }, (_, i) => ({
            uuid: `t${i}`,
            name: `trial_${i}`,
          })),
        },
        headers: { 'access-control-allow-origin': '*' },
      });
    });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#credits', 0.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    await expect(page.locator('#credits .roles')).toBeVisible();
    await expect(page.locator('#credits [data-names]')).toHaveCount(0);
    const before = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    release();
    await expect(
      page.locator('#credits [data-names="member"] span'),
    ).toHaveCount(120);
    await expect(
      page.locator('#credits [data-names="trial"] span'),
    ).toHaveCount(30);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeGreaterThan(before);
    // everything was measured again: each scene is still where its section is
    for (const [sel, off, scene] of [...STOPS].reverse()) {
      await scrollToSection(page, sel, off);
      expect(await visibleScenes(page), sel).toEqual([scene]);
    }
    await page.locator('#credits .fin').scrollIntoViewIfNeeded();
    await expect.poll(() => visibleScenes(page)).toEqual(['end']);
  });

  test('the day theme turns dark in the End and light again after it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { theme: 'light' });
    await ready(page);
    const look = () =>
      page.evaluate(() => {
        const dim = getComputedStyle(document.querySelector('.dim')!);
        return {
          bg: dim.backgroundColor,
          fg: dim.color,
          veil: dim.getPropertyValue('--v').trim(),
          accent: dim.getPropertyValue('--accent').trim(),
          bar: getComputedStyle(document.querySelector('.dim-bar')!).color,
        };
      });
    const LIGHT = {
      bg: 'rgb(238, 242, 245)',
      fg: 'rgb(15, 20, 24)',
      veil: '238, 242, 245',
      accent: '#0b6fb5',
      bar: 'rgb(15, 20, 24)',
    };
    const DARK = {
      bg: 'rgb(6, 8, 11)',
      fg: 'rgb(242, 244, 246)',
      veil: '6, 8, 11',
      accent: '#cdb0ff',
      bar: 'rgb(242, 244, 246)',
    };
    await scrollToSection(page, '#overworld');
    expect(await look()).toEqual(LIGHT);
    for (const [sel, off] of STOPS) {
      await scrollToSection(page, sel, off);
      await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
      expect(await look(), sel).toEqual(DARK);
    }
    // the theme itself has not changed
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    // the dimension name stands on the dark photograph without its strip of paper
    await scrollToSection(page, '#end', 0.1);
    await expect(page.locator('#end .vt')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
    // leaving upward: the nether in its day colours, then the overworld
    await scrollToSection(page, '.rank', -0.3);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    expect(await look()).toEqual({ ...LIGHT, accent: '#c2330f' });
    await scrollToSection(page, '#overworld');
    expect(await look()).toEqual(LIGHT);
  });

  for (const theme of ['dark', 'light'] as const)
    test(`the page moves on to the End as its opening takes over, and each section keeps its own accent (${theme})`, async ({
      page,
    }) => {
      const NETHER =
        theme === 'dark' ? 'rgb(255, 106, 69)' : 'rgb(194, 51, 15)';
      const VIOLET = 'rgb(205, 176, 255)';
      await page.setViewportSize({ width: 1440, height: 900 });
      await openPage(page, '/', { theme });
      await ready(page);
      const state = () =>
        page.evaluate(() => {
          const h2 = document
            .querySelector('.rank h2')!
            .getBoundingClientRect();
          const tag = document
            .querySelector('#end .tag')!
            .getBoundingClientRect();
          return {
            // how much of the rank statement is on screen, and how far down the tag line of the End is
            rank:
              (Math.min(h2.bottom, innerHeight) - Math.max(h2.top, 0)) /
              h2.height,
            tag: tag.top / innerHeight,
          };
        });
      const html = page.locator('html');
      const em = page.locator('.rank h2 em');
      const tag = page.locator('#end .tag .acc');
      const stillNether = async (step: string) => {
        await scrollToSection(page, '#end', -0.62);
        // most of the statement is still readable and the tag line of the End has barely come in at the bottom
        const s = await state();
        expect(s.rank, step).toBeGreaterThan(0.5);
        expect(s.tag, step).toBeGreaterThan(0.75);
        await expect(html, step).toHaveAttribute('data-dim', 'nether');
        await expect(em, step).toHaveCSS('color', NETHER);
      };
      const nowEnd = async (step: string) => {
        await scrollToSection(page, '#end', -0.4);
        // the tag line is well inside the screen and the statement is mostly gone
        const s = await state();
        expect(s.tag, step).toBeLessThan(0.75);
        expect(s.rank, step).toBeLessThan(0.5);
        expect(s.rank, step).toBeGreaterThan(0);
        await expect(html, step).toHaveAttribute('data-dim', 'end');
        await expect(tag, step).toHaveCSS('color', VIOLET);
        // what is left of the nether statement keeps the nether colour (the night one: the page is dark here)
        await expect(em, step).toHaveCSS('color', 'rgb(255, 106, 69)');
      };
      await stillNether('down');
      await nowEnd('down');
      await scrollToSection(page, '#end', 0.3);
      await expect(html).toHaveAttribute('data-dim', 'end');
      await nowEnd('up');
      await stillNether('up');
    });

  test('in the night theme the End accent is the pale violet', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#end', 0.1);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await expect(page.locator('#end .tag .acc')).toHaveCSS(
      'color',
      'rgb(205, 176, 255)',
    );
    await expect(page.locator('#end .tag span').nth(1)).toHaveText('THE END');
    await scrollToSection(page, '#credits', 0.3);
    await expect(page.locator('#credits h2').first()).toHaveCSS(
      'color',
      'rgb(205, 176, 255)',
    );
  });

  for (const [name, width, height] of [
    ['a phone', 390, 844],
    ['a phone on its side', 844, 390],
  ] as const)
    test(`on ${name} in the day theme nothing above changes height when the page goes dark for the End`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/', { theme: 'light' });
      await ready(page);
      // the openings carry the dimension name in the flow of the text here, on its strip of paper
      const heights = () =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('.open')].map(
            (el) => el.offsetHeight,
          ),
        );
      const before = await heights();
      expect(before).toHaveLength(3);
      await scrollToSection(page, '#end', 0.3);
      await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
      expect(await heights()).toEqual(before);
      // and the page is where it was sent: the opening of the End starts 0.3 screens above the top
      await expect
        .poll(() =>
          page.evaluate(() =>
            Math.abs(
              document.querySelector('#end')!.getBoundingClientRect().top +
                0.3 * innerHeight,
            ),
          ),
        )
        .toBeLessThan(1);
    });

  for (const [name, width, height] of [
    ['a phone', 390, 844],
    ['a phone on its side', 844, 390],
    ['a tablet on its side', 1024, 768],
  ] as const)
    test(`on ${name} in the day theme the End and the credits fit`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/', { theme: 'light' });
      await ready(page);
      await scrollToSection(page, '#end', 0);
      expect(await visibleScenes(page)).toEqual(['hall']);
      await expectTextFits(page, { within: '#end' });
      for (const i of [0, 1]) {
        await scrollToSection(page, `[data-work="end-${i}"]`, 0.2);
        await expect(page.locator(`[data-work="end-${i}"] h3`)).toBeVisible();
        await expectTextFits(page, { within: `[data-work="end-${i}"]` });
      }
      // the credits open a little way down the screen, so nothing of them is passing under the bar yet
      await scrollToSection(page, '#credits', -0.15);
      expect(await visibleScenes(page)).toEqual(['end']);
      await expect(page.locator('#credits .roles a').first()).toBeInViewport();
      await expectTextFits(page, { within: '#credits' });
      await expectTapTargets(page);
      // further down the list scrolls under the bar by design, so only the width is checked:
      // every repository and every name stays inside the screen
      await expect(
        page.locator('#credits [data-names="member"] span').first(),
      ).toBeAttached();
      const outside = await page.evaluate(() =>
        [
          ...document.querySelectorAll(
            '#credits .roles a, #credits .roles dt, #credits .names span, #credits .fin',
          ),
        ]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.left < -1 || r.right > window.innerWidth + 1;
          })
          .map((el) => el.textContent),
      );
      expect(outside).toEqual([]);
      await page.locator('#credits a.more').scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      await expect(page.locator('#credits a.more')).toBeInViewport();
      await expectTapTargets(page);
      await expectNoHorizontalScroll(page);
    });

  test('switching language inside the End keeps the fall, the builds and the credits working', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await walkTheLedger(page);
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await setLanguage(page, 'en');
    await expect(page.locator('[data-work="end-0"] h3')).toHaveText(
      'Moon Palace',
    );
    await page.waitForTimeout(800);
    expect(await visibleScenes(page)).toEqual(['moon']);
    for (const [sel, off, scene] of STOPS) {
      await scrollToSection(page, sel, off);
      expect(await visibleScenes(page), `en ${sel}`).toEqual([scene]);
      if (sel.startsWith('[data-work'))
        await lit(page, `${sel} .work > div > *`);
    }
    await expect(page.locator('#credits h2').first()).toHaveText(
      'OPEN-SOURCE TOOLS',
    );
    await expect(page.locator('#credits .roles dt').first()).toHaveText(
      'Game core',
    );
    await expect(page.locator('#credits a.more')).toContainText(
      'Full member roster',
    );
    await expect(page.locator('#credits .fin')).toHaveText('Not over yet.');
    await scrollToSection(page, '#credits', -0.15);
    await expectTextFits(page, { within: '#credits' });
    // the statement of the opening lights up in the new language
    const sayHeight = await page
      .locator('#end .say')
      .evaluate((el) => el.getBoundingClientRect().height / innerHeight);
    await scrollToSection(page, '#end .say', sayHeight - 0.33);
    expect(await visibleScenes(page)).toEqual(['hall']);
    const lines = page.locator('#end .say span');
    expect(await lines.count()).toBe(2);
    await expect(lines.first()).toHaveText('After the End');
    for (const line of await lines.all())
      await expect(line).toHaveCSS('opacity', '1');
    await expect(page.locator('#end p.body')).toHaveCSS('opacity', '1');
    await expect(page.locator('#end .vt')).toHaveText('THE END');
    // the fall still runs, and the way back out still works
    await scrollToSection(page, '#end', -0.4);
    expect(await visibleScenes(page)).toEqual(['nether', 'hall']);
    expect((await pose(page, 'nether')).rotate).toBeGreaterThan(4);
    await scrollToSection(page, '.rank', -0.3);
    expect(await visibleScenes(page)).toEqual(['nether']);
    // a second switch, from above the End
    await setLanguage(page, 'zh_CN');
    await expect(page.locator('[data-work="end-0"] h3')).toHaveText('月宫');
    for (const [sel, off, scene] of STOPS) {
      await scrollToSection(page, sel, off);
      expect(await visibleScenes(page), `zh_CN ${sel}`).toEqual([scene]);
    }
    // and what follows the End was measured again as well: the respawn is where its section is
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('#respawn h2')).toHaveText(
      '下一个里程碑，等你一起盖。',
    );
    await expectNoMissingKeys(page);
  });

  test('reduced motion: the End scenes switch without the fall and the stars stand still', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    // Without Lenis the site's own smooth scrolling would carry the page there, and from the top of the page
    // that long native scroll is sometimes cut short (seen for the nether sections too). Jump instead.
    const jumpTo = (sel: string, off: number) =>
      page.evaluate(
        ([s, o]) => {
          const el = document.querySelector(s as string)!;
          window.scrollTo({
            top:
              el.getBoundingClientRect().top +
              window.scrollY +
              (o as number) * window.innerHeight,
            behavior: 'instant',
          });
        },
        [sel, off] as const,
      );
    for (const [sel, off, scene] of STOPS) {
      await jumpTo(sel, off);
      await expect
        .poll(() => visibleScenes(page), { message: sel })
        .toEqual([scene]);
    }
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    const layers = page.locator('.scene[data-scene="end"] .starfield i');
    await expect(layers).toHaveCount(3);
    for (const l of await layers.all())
      await expect(l).toHaveCSS('background-image', /^url\("data:image\/png/);
    const at = () =>
      layers.evaluateAll((els) =>
        els.map((el) => getComputedStyle(el).transform).join('|'),
      );
    const still = await at();
    await page.waitForTimeout(700);
    expect(await at()).toBe(still);
    await expect(page.locator('#credits .roles')).toBeVisible();
    const lines = page.locator('#end .say span');
    expect(await lines.count()).toBe(2);
    for (const line of await lines.all())
      await expect(line).toHaveCSS('opacity', '1');
    // back up, with nothing left turned
    await jumpTo('#end', 0.3);
    await expect.poll(() => visibleScenes(page)).toEqual(['hall']);
    expect(Math.abs((await pose(page, 'hall')).rotate)).toBeLessThan(0.01);
  });
});

test.describe('home: the rail', () => {
  test('the rail and the bar say which dimension the reader is in, and the line fills with the page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    const rail = page.locator('.rail');
    await expect(rail).toBeVisible();
    expect(
      await rail
        .locator('a')
        .evaluateAll((els) => els.map((a) => a.getAttribute('href'))),
    ).toEqual(['#overworld', '#nether', '#end']);
    const fill = () =>
      rail
        .locator('b')
        .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).d);
    expect(await fill()).toBeLessThan(0.02);
    await expect(rail.locator('a.on')).toHaveAttribute('data-d', 'overworld');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'overworld',
    );
    await scrollToSection(page, '#nether');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'nether',
    );
    await expect(page.locator('.dim-bar nav a.on')).toHaveCount(1);
    await expect(rail.locator('a.on')).toHaveAttribute('data-d', 'nether');
    await expect(rail.locator('a.on')).toHaveCount(1);
    // the mark of the current stop is filled with the accent of its dimension
    await expect
      .poll(() =>
        rail
          .locator('a.on')
          .evaluate((el) => getComputedStyle(el, '::before').backgroundColor),
      )
      .toBe('rgb(255, 106, 69)');
    const mid = await fill();
    expect(mid).toBeGreaterThan(0.15);
    expect(mid).toBeLessThan(0.8);
    await scrollToSection(page, '#credits', 0.3);
    await expect(rail.locator('a.on')).toHaveAttribute('data-d', 'end');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'end',
    );
    expect(await fill()).toBeGreaterThan(mid);
    // and back
    await scrollToSection(page, '#overworld');
    await expect(rail.locator('a.on')).toHaveAttribute('data-d', 'overworld');
    expect(await fill()).toBeLessThan(mid);
  });

  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [1024, 768],
  ] as const)
    test(`at ${width}×${height} the rail is ${width > 860 && height > 480 ? 'there, with stops big enough to tap' : 'put away'}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/');
      await ready(page);
      const rail = page.locator('.rail');
      await expect(rail).toHaveCount(1);
      if (width > 860 && height > 480) {
        await expect(rail).toBeVisible();
        await expectTapTargets(page);
        const stops = await rail
          .locator('a')
          .evaluateAll((els) =>
            els.map((a) => a.getBoundingClientRect().width),
          );
        expect(stops).toEqual([44, 44, 44]);
      } else await expect(rail).toBeHidden();
      await expectNoHorizontalScroll(page);
    });
});

/** Opacity of the white-out, 0 while it is hidden. */
const flashState = (page: Page) =>
  page.locator('.flash').evaluate((el) => {
    const s = getComputedStyle(el);
    return s.visibility === 'hidden' ? 0 : +s.opacity;
  });
/** Without smooth scrolling the site's own `scroll-behavior` would carry the page there: jump instead. */
const jumpTo = (page: Page, sel: string, off = 0) =>
  page.evaluate(
    ([s, o]) => {
      const el = document.querySelector(s as string)!;
      window.scrollTo({
        top:
          el.getBoundingClientRect().top +
          window.scrollY +
          (o as number) * window.innerHeight,
        behavior: 'instant',
      });
    },
    [sel, off] as const,
  );

test.describe('home: respawn', () => {
  test('the page ends on day one with the join call', async ({ page }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
    await expect(page.locator('#respawn h2')).toHaveText(
      '下一個里程碑，等你一起蓋。',
    );
    await expect(page.locator('#respawn a.btn')).toHaveAttribute(
      'href',
      /discord\.gg/,
    );
    await expect(page.locator('#respawn .depts li')).toHaveCount(3);
    // each department leads straight to where it takes applications
    const actions = page.locator('#respawn .depts li a');
    await expect(actions).toHaveCount(3);
    await expect(actions.nth(0)).toHaveAttribute(
      'href',
      /discord\.com\/channels\//,
    );
    await expect(actions.nth(1)).toHaveAttribute('href', /forms\.gle\//);
    await expect(actions.nth(2)).toHaveAttribute('href', /forms\.gle\//);
    for (const a of await actions.all()) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
    }
    await expect(page.locator('#respawn .dim-foot')).toBeVisible();
    await expect(page.locator('.dim-foot')).toHaveCount(1);
    await expectNoMissingKeys(page);
  });

  test('the wake: the stars white out, day one comes up under the white, and it all undoes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    // before it starts: the stars, no white
    await scrollToSection(page, '#respawn', -1.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    expect(await flashState(page)).toBe(0);
    // partway in: the white is rising over the stars
    await scrollToSection(page, '#respawn', -0.7);
    expect(await visibleScenes(page)).toEqual(['end']);
    const rising = await flashState(page);
    expect(rising).toBeGreaterThan(0.1);
    expect(rising).toBeLessThan(0.9);
    // the middle: nothing but white
    await scrollToSection(page, '#respawn', -0.5);
    expect(await flashState(page)).toBeGreaterThan(0.98);
    // partway out: day one under the clearing white
    await scrollToSection(page, '#respawn', -0.3);
    expect(await visibleScenes(page)).toEqual(['day1']);
    const clearing = await flashState(page);
    expect(clearing).toBeGreaterThan(0.1);
    expect(clearing).toBeLessThan(0.9);
    // landed
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    expect(await flashState(page)).toBe(0);
    const scale = (scene: string) =>
      page
        .locator(`.scene[data-scene="${scene}"] .zoom`)
        .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    expect(await scale('day1')).toBeCloseTo(1, 2);
    // and back: the white again, then the stars, with day one switched off
    await scrollToSection(page, '#respawn', -0.5);
    expect(await flashState(page)).toBeGreaterThan(0.98);
    await scrollToSection(page, '#respawn', -1.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    expect(await flashState(page)).toBe(0);
    await expect(page.locator('.scene[data-scene="day1"]')).toBeHidden();
    expect(await scale('end')).toBeCloseTo(1, 2);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
  });

  test('the mascot rises with the title and keeps floating; the bar marks the respawn and the rail is full', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    const rail = page.locator('.rail');
    await scrollToSection(page, '#respawn', 0);
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'respawn',
    );
    // the rail has no stop for the respawn: none is marked, and the line is full
    await expect(rail.locator('a')).toHaveCount(3);
    await expect(rail.locator('a.on')).toHaveCount(0);
    expect(
      await rail
        .locator('b')
        .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).d),
    ).toBeGreaterThan(0.95);
    const pal = page.locator('#respawn .pal');
    await expect(pal).toHaveCSS('opacity', '1');
    const at = () =>
      pal.evaluate((el) => {
        // the floating is on these two properties; the transform belongs to the rise
        const c = getComputedStyle(el);
        return `${c.translate} ${c.rotate}`;
      });
    const first = await at();
    await page.waitForTimeout(600);
    expect(await at()).not.toBe(first);
  });

  for (const [name, width, height, theme] of [
    ['a phone by day', 390, 844, 'light'],
    ['a phone on its side', 844, 390, 'dark'],
    ['a tablet on its side by day', 1024, 768, 'light'],
    ['a desktop', 1440, 900, 'dark'],
  ] as const)
    test(`on ${name} the respawn fits, down to the footer`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/', { theme });
      await ready(page);
      await scrollToSection(page, '#respawn', 0);
      expect(await visibleScenes(page)).toEqual(['day1']);
      await expect(page.locator('#respawn h2')).toHaveCSS('opacity', '1');
      await expectTextFits(page, { within: '#respawn' });
      // The footer is the shell's own (13px links, as on the inner pages): the type floors are checked for
      // what this section adds, and the sizes to tap for every link in it.
      const floors = await page.evaluate(() =>
        [...document.querySelectorAll('#respawn [data-t]')]
          .filter((el) => !el.closest('.dim-foot'))
          .map((el) => ({
            size: parseFloat(getComputedStyle(el).fontSize),
            floor: el.getAttribute('data-t') === 'note' ? 11 : 14,
          })),
      );
      expect(floors.length).toBe(12);
      for (const f of floors) expect(f.size).toBeGreaterThanOrEqual(f.floor);
      // the rail is for wide, tall screens only
      const rail = page.locator('.rail');
      await expect(rail).toHaveCount(1);
      if (width > 860 && height > 480) await expect(rail).toBeVisible();
      else await expect(rail).toBeHidden();
      // the very end of the page
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      await page.waitForTimeout(1500);
      expect(await visibleScenes(page)).toEqual(['day1']);
      await expect(page.locator('#respawn .dim-foot')).toBeInViewport();
      await expect(
        page.locator('#respawn .depts li a').last(),
      ).toBeInViewport();
      await expectTextFits(page, { within: '#respawn .depts' });
      await expectTextFits(page, { within: '#respawn .dim-foot' });
      // The footer is the shell's own (13px links, as on the inner pages), so only the sizes to tap are checked here.
      const small = await page.evaluate(() =>
        window.innerWidth > 1024
          ? []
          : [...document.querySelectorAll('#respawn a')]
              .map((a) => a.getBoundingClientRect())
              .filter((r) => r.width < 43.5 || r.height < 43.5)
              .map((r) => `${Math.round(r.width)}x${Math.round(r.height)}`),
      );
      expect(small).toEqual([]);
      expect(await page.locator('#respawn a').count()).toBe(9);
      await expectNoHorizontalScroll(page);
      // by day the page is light again after the End
      if (theme === 'light')
        await expect(page.locator('.dim')).toHaveCSS(
          'background-color',
          'rgb(238, 242, 245)',
        );
    });

  for (const locale of ['zh_TW', 'zh_CN', 'en'] as const)
    for (const [width, height] of [
      [1440, 900],
      [1070, 640],
    ] as const)
      test(`each department's link stands under its description, which has the width of the column (${locale}, ${width}×${height})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        await openPage(page, '/', { locale });
        await ready(page);
        await scrollToSection(page, '#respawn', 0.2);
        await expect(page.locator('#respawn .depts')).toHaveCSS('opacity', '1');
        const rows = await page
          .locator('#respawn .depts li')
          .evaluateAll((els) =>
            els.map((li) => {
              const box = (sel: string) =>
                li.querySelector(sel)!.getBoundingClientRect();
              const [name, text, link] = [box('b'), box('span'), box('a')];
              const span = li.querySelector('span')!;
              const lines = Math.round(
                text.height / parseFloat(getComputedStyle(span).lineHeight),
              );
              return {
                nameRight: name.right,
                textLeft: text.left,
                textWidth: text.width,
                textBottom: text.bottom,
                linkLeft: link.left,
                linkTop: link.top,
                lines,
                perLine: span.textContent!.length / lines,
              };
            }),
          );
        expect(rows).toHaveLength(3);
        for (const r of rows) {
          // name | description, and the link on a line of its own beneath the description, flush with it
          expect(r.textLeft).toBeGreaterThan(r.nameRight);
          expect(r.linkTop).toBeGreaterThanOrEqual(r.textBottom);
          expect(r.linkTop - r.textBottom).toBeLessThan(28);
          expect(Math.abs(r.linkLeft - r.textLeft)).toBeLessThanOrEqual(1);
          expect(r.textWidth).toBeGreaterThanOrEqual(320);
          expect(r.lines).toBeLessThanOrEqual(2);
          // a comfortable measure: Chinese never wraps after a handful of characters
          if (locale !== 'en' && r.lines > 1)
            expect(r.perLine).toBeGreaterThanOrEqual(14);
        }
        await expectTextFits(page, { within: '#respawn .depts' });
      });

  /** The mascot and the department list, as boxes on the screen. */
  const mascotAndList = async (page: Page) => {
    const [list, mascot] = await Promise.all([
      page.locator('#respawn .depts').boundingBox(),
      page.locator('#respawn .pal').boundingBox(),
    ]);
    return { list: list!, mascot: mascot! };
  };

  // 1101px is the narrowest screen with the mascot: the width at which the bar, too, leaves its narrow layout
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [1280, 720],
    [1101, 700],
  ] as const)
    test(`at ${width}×${height} the mascot stands beside the departments, centred on them`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      // the longest copy
      await openPage(page, '/', { locale: 'en' });
      await ready(page);
      await scrollToSection(page, '#respawn', 0.25);
      const pal = page.locator('#respawn .pal');
      await expect(pal).toBeVisible();
      await expect(pal).toHaveCSS('opacity', '1');
      // let its rise finish: from here on it only floats a few pixels around its place
      await page.waitForTimeout(1700);
      const { list, mascot } = await mascotAndList(page);
      expect(mascot.width).toBeGreaterThanOrEqual(300);
      expect(list.width).toBeGreaterThanOrEqual(590);
      // a column of its own to the right of the list, one gutter away
      const gutter = await page
        .locator('#respawn')
        .evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
      const gap = mascot.x - (list.x + list.width);
      expect(gap).toBeGreaterThan(gutter - 16);
      expect(gap).toBeLessThan(gutter + 16);
      expect(mascot.x + mascot.width).toBeLessThanOrEqual(width);
      // centred on the block of the three departments
      expect(
        Math.abs(mascot.y + mascot.height / 2 - (list.y + list.height / 2)),
      ).toBeLessThanOrEqual(16);
      // and clear of what is above and below it
      const [button, foot] = await Promise.all([
        page.locator('#respawn a.btn').boundingBox(),
        page.locator('#respawn .dim-foot img').boundingBox(),
      ]);
      const clear = (b: {
        x: number;
        y: number;
        width: number;
        height: number;
      }) =>
        b.x + b.width <= mascot.x ||
        b.y + b.height <= mascot.y ||
        b.y >= mascot.y + mascot.height;
      expect(clear(button!)).toBe(true);
      expect(clear(foot!)).toBe(true);
      await expectNoHorizontalScroll(page);
    });

  for (const [width, height] of [
    [1100, 700],
    [1024, 768],
    [844, 390],
    [768, 1024],
    [390, 844],
  ] as const)
    test(`at ${width}×${height} there is no mascot, and the departments have its room`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/', { locale: 'en' });
      await ready(page);
      await scrollToSection(page, '#respawn', 0.25);
      const pal = page.locator('#respawn .pal');
      await expect(pal).toHaveCount(1);
      await expect(pal).toBeHidden();
      await expect(pal).toHaveCSS('display', 'none');
      // not fetched either
      expect(
        await pal.evaluate((el: HTMLImageElement) => [
          el.loading,
          el.naturalWidth,
        ]),
      ).toEqual(['lazy', 0]);
      // the list is as wide as the column allows, up to its own measure
      const m = await page.locator('#respawn').evaluate((el) => {
        const c = getComputedStyle(el);
        return {
          column:
            el.clientWidth -
            parseFloat(c.paddingLeft) -
            parseFloat(c.paddingRight),
          list: el.querySelector('.depts')!.getBoundingClientRect().width,
        };
      });
      // up to 860px the text has the whole width; above, it stays on the veiled side of the picture (62% of the screen)
      const room = width <= 860 ? m.column : Math.min(m.column, 0.62 * width);
      expect(m.list).toBeGreaterThanOrEqual(Math.min(720, room) - 1);
      // more than it has beside the mascot (54% of the screen)
      if (width > 860 && width < 1161)
        expect(m.list).toBeGreaterThan(0.54 * width + 40);
      await scrollToSection(page, '#respawn .depts', -0.4);
      await expectTextFits(page, { within: '#respawn .depts' });
      await expectNoHorizontalScroll(page);
    });

  test('by day the words of the respawn stand on paper: a wide veil under the list, and paper under the footer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { theme: 'light', locale: 'en' });
    await ready(page);
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect.poll(() => visibleScenes(page)).toEqual(['day1']);
    // how much paper lies over the picture at a point of the screen: the veil's own colour stops, read from its gradient
    const veil = page.locator('.scene[data-scene="day1"] .veil');
    await expect(veil).toHaveClass(/veil--wide/);
    const stops = await veil.evaluate((el) =>
      [
        ...getComputedStyle(el).backgroundImage.matchAll(
          /rgba?\(([^)]+)\) (\d+)%/g,
        ),
      ].map((m) => [Number(m[1].split(',')[3] ?? 1), Number(m[2])]),
    );
    // at least 90% paper up to 56% of the width
    expect(stops.slice(0, 2)).toEqual([
      [0.97, 0],
      [0.92, 56],
    ]);
    // the longest description ends inside that
    const ends = await page
      .locator('#respawn .depts li > span')
      .evaluateAll((els) =>
        els.map((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return Math.max(...[...range.getClientRects()].map((r) => r.right));
        }),
      );
    expect(ends).toHaveLength(3);
    for (const right of ends) expect(right / 1440).toBeLessThan(0.58);
    // the footer has its own paper, from edge to edge
    const foot = page.locator('#respawn .dim-foot');
    await expect(foot).toHaveCSS('background-image', /linear-gradient\(0deg/);
    const box = (await foot.boundingBox())!;
    expect(box.x).toBeLessThanOrEqual(0);
    expect(box.x + box.width).toBeGreaterThanOrEqual(1440);
    await expectTextFits(page, { within: '#respawn .dim-foot' });
    await expectNoHorizontalScroll(page);
    // by night there is no band: the veil of the scene is dark enough
    await page.locator('.dim-bar [data-action="theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(foot).toHaveCSS('background-image', 'none');
  });

  test('on a phone a department stacks: name, description, link', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/', { locale: 'en' });
    await ready(page);
    await scrollToSection(page, '#respawn .depts', -0.3);
    const rows = await page.locator('#respawn .depts li').evaluateAll((els) =>
      els.map((li) =>
        ['b', 'span', 'a'].map((sel) => {
          const r = li.querySelector(sel)!.getBoundingClientRect();
          return { left: Math.round(r.left), top: r.top, bottom: r.bottom };
        }),
      ),
    );
    expect(rows).toHaveLength(3);
    for (const [name, text, link] of rows) {
      expect(text.top).toBeGreaterThanOrEqual(name.bottom - 1);
      expect(link.top).toBeGreaterThanOrEqual(text.bottom - 1);
      expect(text.left).toBe(name.left);
      expect(link.left).toBe(name.left);
    }
    await expectTextFits(page, { within: '#respawn .depts' });
    await expectNoHorizontalScroll(page);
  });

  test('switching language inside the respawn keeps the wake, the departments and the footer working', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await setLanguage(page, 'en');
    await expect(page.locator('#respawn h2')).toHaveText(
      'The next milestone is waiting for you.',
    );
    await page.waitForTimeout(800);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('#respawn .depts li b')).toHaveText([
      'Redstone',
      'Building',
      'Logistics',
    ]);
    await expect(page.locator('#respawn .depts li a').first()).toContainText(
      'Submission channel',
    );
    await expect(page.locator('#respawn h2')).toHaveCSS('opacity', '1');
    await expect(page.locator('#respawn .depts')).toHaveCSS('opacity', '1');
    await expect(page.locator('#respawn .pal')).toHaveCSS('opacity', '1');
    await scrollToSection(page, '#respawn', 0);
    await expectTextFits(page, { within: '#respawn' });
    // the wake was measured again: its middle is still nothing but white, and it still undoes
    await scrollToSection(page, '#respawn', -0.5);
    expect(await flashState(page)).toBeGreaterThan(0.98);
    await scrollToSection(page, '#respawn', -1.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    expect(await flashState(page)).toBe(0);
    await setLanguage(page, 'zh_CN');
    await expect(page.locator('#respawn h2')).toHaveText(
      '下一个里程碑，等你一起盖。',
    );
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
    await expectNoMissingKeys(page);
  });
});

test.describe('home: the language list over the film', () => {
  test('by day it is paper over the overworld and dark inside the End, and choosing from it re-measures the page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { theme: 'light' });
    await ready(page);
    const trigger = page.locator('.dim-bar [data-action="language"]');
    const list = page.locator('.dim-bar .lang-list');
    await scrollToSection(page, '#overworld', 0);
    await trigger.click();
    await expect(list).toHaveCSS('opacity', '1');
    await expect(list).toHaveCSS('background-color', 'rgb(238, 242, 245)');
    await expect(list.locator('[aria-selected="true"]')).toHaveCSS(
      'color',
      'rgb(11, 111, 181)',
    );
    await page.keyboard.press('Escape');
    await expect(list).toHaveCSS('visibility', 'hidden');
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    const y = await page.evaluate(() => Math.round(window.scrollY));
    await trigger.click();
    await expect(list).toHaveCSS('opacity', '1');
    await expect(list).toHaveCSS('background-color', 'rgb(6, 8, 11)');
    await expect(list.locator('[aria-selected="true"]')).toHaveCSS(
      'color',
      'rgb(205, 176, 255)',
    );
    await expect(list.locator('[aria-selected="false"]').first()).toHaveCSS(
      'color',
      'rgb(242, 244, 246)',
    );
    // open, it has moved neither the page nor the scene
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(y);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await list.locator('[data-value="en"]').click();
    await expect(page.locator('[data-work="end-0"] h3')).toHaveText(
      'Moon Palace',
    );
    await expect(list).toHaveCSS('visibility', 'hidden');
    // measured again in the new language: every scene is where its section is
    await scrollToSection(page, '[data-work="end-1"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['farm']);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
  });
});

test.describe('home: jumping to a section', () => {
  /** Pictures of the nether ledger that are on screen. */
  const shownPictures = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-ledger]')]
        .filter((i) => +getComputedStyle(i).opacity > 0.5)
        .map((i) => i.dataset.ledger),
    );
  const historyLength = (page: Page) =>
    page.evaluate(() => window.history.length);

  test('to the next dimension: the page travels there through the portal, with no cover', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#overworld', 0);
    const entries = await historyLength(page);
    await record(page);
    await page.locator('.dim-bar nav a[data-d="nether"]').click();
    await landedOn(page, '#nether');
    const frames = await recorded(page);
    // it moved over many frames, always forwards, for between 1.2 and 2.2 seconds
    const moving = frames.filter((f, i) => i > 0 && f.y !== frames[i - 1].y);
    expect(moving.length).toBeGreaterThan(20);
    frames.forEach((f, i) =>
      expect(f.y, `frame ${i}`).toBeGreaterThanOrEqual(frames[i - 1]?.y ?? 0),
    );
    const took = moving.at(-1)!.t - moving[0].t;
    expect(took).toBeGreaterThan(1000);
    expect(took).toBeLessThan(2500);
    // never covered: the reader rides the transition of this boundary, the portal
    expect(Math.max(...frames.map((f) => f.cover))).toBe(0);
    expect(Math.max(...frames.map((f) => f.portal))).toBeGreaterThan(0.5);
    const seen = frames.map((f) => f.scenes.join('+'));
    expect(seen).toContain('w3');
    expect(seen.at(-1)).toBe('nether');
    // arrived
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'nether',
    );
    await expect(page.locator('#nether [data-heading]')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('#nether');
    expect(await historyLength(page)).toBe(entries);
    expect(await shownPictures(page)).toEqual(['0']);
    // and the way back is a travel too
    await record(page);
    await page.locator('.rail a[data-d="overworld"]').click();
    await landedOn(page, '#overworld');
    const back = await recorded(page);
    expect(
      back.filter((f, i) => i > 0 && f.y !== back[i - 1].y).length,
    ).toBeGreaterThan(20);
    expect(Math.max(...back.map((f) => f.cover))).toBe(0);
    expect(await visibleScenes(page)).toEqual(['town']);
    expect(new URL(page.url()).hash).toBe('#overworld');
    expect(await historyLength(page)).toBe(entries);
  });

  test('farther away: the page cuts under a cover, and lands with everything in place', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    const entries = await historyLength(page);
    const cover = page.locator('.dim-cover');
    await expect(cover).toHaveCSS('visibility', 'hidden');
    await expect(cover).toHaveCSS('opacity', '0');

    // hero → respawn, from the button in the hero
    await record(page);
    await page.locator('.hero a.btn').click();
    await landedOn(page, '#respawn');
    let frames = await recorded(page);
    // opacity only: 280ms in, 520ms out
    expect(await coverRuns(page)).toEqual(['opacity:280', 'opacity:520']);
    const start = frames[0].y;
    expect(start).toBe(0);
    // the cover is whole before the page moves, and before the dimension changes
    const moved = frames.findIndex((f) => f.y !== start);
    expect(moved).toBeGreaterThan(0);
    expect(await coverAtLanding(page)).toBe(1);
    expect(frames[moved].cover).toBe(1);
    const changed = frames.findIndex((f) => f.dim !== 'overworld');
    expect(changed).toBeGreaterThan(0);
    expect(frames[changed].cover).toBe(1);
    // one cut: the page is only ever at the start or at the target
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    // no transition of the page in between is ever seen: neither the portal nor the white-out
    expect(Math.max(...frames.map((f) => f.portal * (1 - f.cover)))).toBe(0);
    expect(Math.max(...frames.map((f) => f.flash * (1 - f.cover)))).toBe(0);
    // it lifts over about half a second, onto day one
    const lifting = frames.filter((f) => f.cover > 0 && f.cover < 1 && f.y);
    expect(lifting.length).toBeGreaterThan(5);
    for (const f of lifting) expect(f.scenes).toEqual(['day1']);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'respawn',
    );
    await expect(page.locator('#respawn h2')).toBeFocused();
    await expect(page.locator('#respawn h2')).toHaveCSS('opacity', '1');
    expect(new URL(page.url()).hash).toBe('#respawn');

    // respawn → nether: over the End and the whole pinned ledger, onto the opening
    await record(page);
    await page.locator('.dim-bar nav a[data-d="nether"]').click();
    await landedOn(page, '#nether');
    frames = await recorded(page);
    expect(await coverAtLanding(page)).toBe(1);
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    expect(await visibleScenes(page)).toEqual(['nether']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'nether');
    await expect(page.locator('#nether [data-heading]')).toBeFocused();
    // not inside the pin: the stage is still below, on its first facility
    expect(await topOf(page, '.ledger-stage')).toBeGreaterThan(900);
    expect(await shownPictures(page)).toEqual(['0']);
    await expect(page.locator('.ledger-now h3')).toHaveText('地獄大廳');
    await expect(page.locator('#nether p.body')).toHaveCSS('opacity', '1');

    // nether → respawn again, then all the way back to the overworld
    await page.locator('.dim-bar nav a[data-d="respawn"]').click();
    await landedOn(page, '#respawn');
    expect(await visibleScenes(page)).toEqual(['day1']);
    await record(page);
    await page.locator('.dim-bar nav a[data-d="overworld"]').click();
    await landedOn(page, '#overworld');
    frames = await recorded(page);
    expect(await coverRuns(page)).toEqual(['opacity:280', 'opacity:520']);
    expect(await coverAtLanding(page)).toBe(1);
    expect(new Set(frames.map((f) => f.y)).size).toBe(2);
    expect(await visibleScenes(page)).toEqual(['town']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
    await expect(page.locator('.dim-bar nav a.on')).toHaveAttribute(
      'data-d',
      'overworld',
    );
    await expect(page.locator('#overworld [data-heading]')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('#overworld');
    // one entry, however many sections were visited
    expect(await historyLength(page)).toBe(entries);
    // the page is the reader's again
    await page.mouse.move(720, 450);
    const y = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(y);
  });

  test('the cover takes the tone of where it leads: night for the End, even by day', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { theme: 'light' });
    await ready(page);
    const tones = (frames: Frame[]) => [
      ...new Set(frames.filter((f) => f.cover > 0).map((f) => f.tone)),
    ];
    // hero → the End: two dimensions away
    await record(page);
    await page.locator('.dim-bar nav a[data-d="end"]').click();
    await landedOn(page, '#end');
    let frames = await recorded(page);
    expect(await coverAtLanding(page)).toBe(1);
    expect(tones(frames)).toEqual(['rgb(6, 8, 11)']);
    expect(await visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    // the End → the top of the page, by the logo: the paper of the day theme
    await record(page);
    await page.locator('.dim-bar .logo').click();
    await landedOn(page, '.hero');
    frames = await recorded(page);
    expect(await coverAtLanding(page)).toBe(1);
    expect(tones(frames)).toEqual(['rgb(238, 242, 245)']);
    expect(await visibleScenes(page)).toEqual(['spawn']);
    await expect(page.locator('.hero h1')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('');
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('from the sheet on a phone: it closes into the cover or into the travel, and the page is free again', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, '/');
    await ready(page);
    const menu = page.locator('.dim-bar [data-action="menu"]');
    const sheet = page.locator('.dim-sheet');
    const sheetOpacity = () =>
      sheet.evaluate((el) => +getComputedStyle(el).opacity);
    const open = async () => {
      await menu.click();
      await expect(sheet).toHaveCSS('opacity', '1');
      await expect(sheet.locator('a').last()).toHaveCSS('opacity', '1');
    };
    const free = async () => {
      await expect(sheet).toHaveCSS('visibility', 'hidden');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      expect(
        await page.evaluate(() => [
          getComputedStyle(document.body).overflowY,
          getComputedStyle(document.documentElement).overflowY,
          document.querySelector('main')!.inert,
        ]),
      ).toEqual(['visible', 'visible', false]);
      const y = await page.evaluate(() => window.scrollY);
      await page.mouse.move(195, 500);
      await page.mouse.wheel(0, 240);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(y);
      // let the smooth scroll run out before the test moves the page itself
      await page.waitForTimeout(1500);
    };

    // far: hero → the End. The sheet stays whole until the cover is over it, and is gone before the cover lifts.
    await open();
    await record(page);
    await sheet.locator('a[data-d="end"]').click();
    await landedOn(page, '#end');
    const cut = await recorded(page);
    const moved = cut.findIndex((f) => f.y !== cut[0].y);
    expect(moved).toBeGreaterThan(0);
    expect(await coverAtLanding(page)).toBe(1);
    cut
      .slice(0, moved)
      .forEach((f, i) =>
        expect(
          f.sheet === 1 || f.cover === 1,
          `before the cut, frame ${i}`,
        ).toBe(true),
      );
    const lifting = cut.slice(moved).filter((f) => f.cover < 1);
    expect(lifting.length).toBeGreaterThan(5);
    for (const f of lifting) {
      expect(f.sheet).toBe(0);
      expect(f.scenes).toEqual(['hall']);
    }
    expect(new Set(cut.map((f) => f.y)).size).toBe(2);
    expect(await sheetOpacity()).toBe(0);
    expect(await visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
    await expect(page.locator('#end [data-heading]')).toBeFocused();
    await free();

    // near: back at the top, to the overworld. The sheet closes while the page is already on its way.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'overworld');
    await open();
    await record(page);
    await sheet.locator('a[data-d="overworld"]').click();
    await landedOn(page, '#overworld');
    const frames = await recorded(page);
    expect(Math.max(...frames.map((f) => f.cover))).toBe(0);
    expect(
      frames.filter((f, i) => i > 0 && f.y !== frames[i - 1].y).length,
    ).toBeGreaterThan(20);
    expect(await visibleScenes(page)).toEqual(['town']);
    await expect(page.locator('#overworld [data-heading]')).toBeFocused();
    await free();
  });

  test('reduced motion: no travel, an instant jump behind a fade of at most 120ms', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await jumpTo(page, '#overworld');
    await expect.poll(() => visibleScenes(page)).toEqual(['town']);
    for (const [d, scene, sel] of [
      ['nether', 'nether', '#nether'], // the next dimension
      ['respawn', 'day1', '#respawn'], // two away
      ['overworld', 'town', '#overworld'], // three away
    ] as const) {
      await record(page);
      await page.locator(`.dim-bar nav a[data-d="${d}"]`).click();
      await landedOn(page, sel);
      const frames = await recorded(page);
      // every fade of the cover is short
      const fades = (await coverRuns(page)).map((r) => Number(r.split(':')[1]));
      expect(fades.length, d).toBeGreaterThan(0);
      expect(
        (await coverRuns(page)).every((r) => r.startsWith('opacity:')),
        d,
      ).toBe(true);
      expect(Math.max(...fades), d).toBeLessThanOrEqual(120);
      // covered, and the page is only ever at the start or at the target
      expect(await coverAtLanding(page), d).toBe(1);
      expect(new Set(frames.map((f) => f.y)).size, d).toBe(2);
      await expect.poll(() => visibleScenes(page), d).toEqual([scene]);
      await expect(page.locator('html')).toHaveAttribute('data-dim', d);
      await expect(page.locator(`${sel} [data-heading]`)).toBeFocused();
      expect(new URL(page.url()).hash).toBe(sel);
    }
    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains('lenis'),
      ),
    ).toBe(false);
  });
});

test.describe('home: arriving, leaving and robustness', () => {
  for (const [hash, scene, dim] of [
    ['#nether', 'nether', 'nether'],
    ['#end', 'hall', 'end'],
    ['#respawn', 'day1', 'respawn'],
  ] as const)
    test(`arriving with ${hash}: when the loader lifts the page is already there`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      // every frame from the first: is the loader still whole, and where is the target?
      await page.addInitScript((id) => {
        const w = window as unknown as {
          __seen: { loader: number; top: number; scenes: string }[];
        };
        w.__seen = [];
        const tick = () => {
          const loader = document.querySelector('.loader');
          const target = document.querySelector(id);
          if (document.querySelector('.dim--home') && target) {
            const s = loader && getComputedStyle(loader);
            w.__seen.push({
              loader: !s || s.visibility === 'hidden' ? 0 : +s.opacity,
              top: Math.round(target.getBoundingClientRect().top),
              scenes: [...document.querySelectorAll<HTMLElement>('.scene')]
                .filter((el) => {
                  const c = getComputedStyle(el);
                  return c.visibility !== 'hidden' && +c.opacity > 0.5;
                })
                .map((el) => el.dataset.scene)
                .join('+'),
            });
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, hash);
      await openPage(page, `/${hash}`);
      await ready(page);
      await expect(page.locator('.loader')).toBeHidden();
      await landedOn(page, hash);
      const seen = await page.evaluate(
        () =>
          (
            window as unknown as {
              __seen: { loader: number; top: number; scenes: string }[];
            }
          ).__seen,
      );
      const lifting = seen.filter((f) => f.loader < 0.99);
      expect(lifting.length).toBeGreaterThan(5);
      expect(seen.length - lifting.length).toBeGreaterThan(5);
      for (const f of lifting) {
        expect(Math.abs(f.top)).toBeLessThanOrEqual(1);
        expect(f.scenes).toBe(scene);
      }
      await expect(page.locator('html')).toHaveAttribute('data-dim', dim);
      expect(await visibleScenes(page)).toEqual([scene]);
      // the pin was measured before the landing
      await expect(page.locator('.pin-spacer')).toHaveCount(1);
      if (hash === '#nether')
        expect(await topOf(page, '.ledger-stage')).toBeGreaterThan(900);
      expect(new URL(page.url()).hash).toBe(hash);
    });

  test('arriving with #respawn stays on the respawn when the names arrive late and the credits grow', async ({
    page,
  }) => {
    let release = () => {};
    const held = new Promise<void>((done) => {
      release = done;
    });
    await page.route(/member\.json/, async (r) => {
      await held;
      await r.fulfill({
        json: {
          member: Array.from({ length: 160 }, (_, i) => ({
            uuid: `m${i}`,
            name: `member_${i}`,
          })),
          trial: Array.from({ length: 40 }, (_, i) => ({
            uuid: `t${i}`,
            name: `trial_${i}`,
          })),
        },
        headers: { 'access-control-allow-origin': '*' },
      });
    });
    await openPage(page, '/#respawn');
    await ready(page);
    await landedOn(page, '#respawn');
    const before = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    release();
    await expect(
      page.locator('#credits [data-names="member"] span'),
    ).toHaveCount(160);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
    ).toBeGreaterThan(before);
    await landedOn(page, '#respawn');
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'respawn');
  });

  test('arriving with a hash under reduced motion lands there too', async ({
    page,
  }) => {
    await openPage(page, '/#end', { reducedMotion: true });
    await ready(page);
    await landedOn(page, '#end');
    await expect.poll(() => visibleScenes(page)).toEqual(['hall']);
    await expect(page.locator('html')).toHaveAttribute('data-dim', 'end');
  });

  test('resizing mid-scroll keeps the scene in step with the section', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(1200);
    await scrollToSection(page, '[data-work="end-0"]', 0.2);
    expect(await visibleScenes(page)).toEqual(['moon']);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1200);
    await scrollToSection(page, '#credits', 0.3);
    expect(await visibleScenes(page)).toEqual(['end']);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1200);
    await scrollToSection(page, '#respawn', 0);
    expect(await visibleScenes(page)).toEqual(['day1']);
    await expect(page.locator('.pin-spacer')).toHaveCount(1);
  });

  test('leaving for a legacy page cleans up, and coming back rebuilds', async ({
    page,
  }) => {
    await openPage(page, '/');
    await ready(page);
    await scrollToSection(page, '#nether');
    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains('lenis'),
      ),
    ).toBe(true);
    await page.goto('/join/');
    await expect(page.locator('[data-shell="legacy"]')).toBeVisible();
    expect(
      await page.evaluate(() =>
        document.documentElement.hasAttribute('data-dim'),
      ),
    ).toBe(false);
    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains('lenis'),
      ),
    ).toBe(false);
    await expect(page.locator('.dim-cover')).toHaveCount(0);
    await page.goBack();
    await ready(page);
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    await scrollToSection(page, '#overworld');
    expect(await visibleScenes(page)).toEqual(['town']);
  });

  test('leaving for an inner page without a reload takes the smooth scroll and the pin away, and coming back rebuilds them', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/member/');
    await page.locator('.person').first().waitFor();
    const state = () =>
      page.evaluate(() => ({
        lenis: [...document.documentElement.classList].filter((c) =>
          c.startsWith('lenis'),
        ),
        spacers: document.querySelectorAll('.pin-spacer').length,
        covers: document.querySelectorAll('.dim-cover').length,
      }));
    expect(await state()).toEqual({ lenis: [], spacers: 0, covers: 1 });
    await page.evaluate(() => {
      (window as unknown as { __same: boolean }).__same = true;
    });
    // in-app links: the document is never reloaded
    const sameDocument = () =>
      page.evaluate(() =>
        Boolean((window as unknown as { __same?: boolean }).__same),
      );
    await page.locator('.head .crumb a').nth(1).click();
    await ready(page);
    await landedOn(page, '#end');
    expect(await sameDocument()).toBe(true);
    expect(await visibleScenes(page)).toEqual(['hall']);
    const home = await state();
    expect(home.lenis).toContain('lenis');
    expect(home.spacers).toBe(1);
    await page.goBack();
    await page.locator('.person').first().waitFor();
    expect(await sameDocument()).toBe(true);
    await expect.poll(state).toEqual({ lenis: [], spacers: 0, covers: 1 });
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    // the inner page scrolls natively again
    await page.mouse.move(720, 450);
    await page.mouse.wheel(0, 400);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    await page.goForward();
    await ready(page);
    await scrollToSection(page, '#overworld');
    expect(await visibleScenes(page)).toEqual(['town']);
    expect((await state()).spacers).toBe(1);
  });

  test('with reduced motion nothing is scrubbed, every section is readable and scenes still change', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    expect(
      await page.evaluate(() =>
        document.documentElement.classList.contains('lenis'),
      ),
    ).toBe(false);
    for (const [sel, scene] of [
      ['#overworld', 'town'],
      ['[data-work="overworld-1"]', 'w2'],
      ['#nether', 'nether'],
      ['[data-work="end-0"]', 'moon'],
      ['#respawn', 'day1'],
    ] as const) {
      await jumpTo(page, sel, 0.1);
      await expect
        .poll(() => visibleScenes(page), { message: sel })
        .toEqual([scene]);
    }
    // the respawn: nothing waits for an animation, the white-out never shows, the mascot stands still
    for (const sel of ['#respawn h2', '#respawn .depts', '#respawn .pal'])
      await expect(page.locator(sel)).toHaveCSS('opacity', '1');
    expect(await flashState(page)).toBe(0);
    const pal = page.locator('#respawn .pal');
    const at = () =>
      pal.evaluate((el) => {
        // the floating is on these two properties; the transform belongs to the rise
        const c = getComputedStyle(el);
        return `${c.translate} ${c.rotate}`;
      });
    const still = await at();
    await page.waitForTimeout(600);
    expect(await at()).toBe(still);
    await jumpTo(page, '#respawn', -0.5);
    await page.waitForTimeout(300);
    expect(await flashState(page)).toBe(0);
    await jumpTo(page, '#overworld', 0.1);
    await expect.poll(() => visibleScenes(page)).toEqual(['town']);
    const lines = page.locator('#overworld .say span');
    expect(await lines.count()).toBe(3);
    for (const span of await lines.all())
      await expect(span).toHaveCSS('opacity', '1');
    await expect(page.locator('.ledger-stage')).not.toHaveCSS(
      'position',
      'fixed',
    );
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    // the rail still says where the reader is
    await jumpTo(page, '#nether', 0.1);
    await expect(page.locator('.rail a.on')).toHaveAttribute(
      'data-d',
      'nether',
    );
  });
});
