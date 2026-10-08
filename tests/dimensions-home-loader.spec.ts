import { expect, test } from '@playwright/test';
import { expectNoMissingKeys, openPage } from './helpers/dimensions';
import {
  type LoaderFrame,
  loaderFrames,
  ready,
  watchLoader,
} from './helpers/home';

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

  const number = (f: LoaderFrame) => Number(f.pct.replace('%', ''));

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
    await watchLoader(page);
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toBeHidden();
    const frames = await loaderFrames(page);
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
    await watchLoader(page);
    await openPage(page, '/');
    await page
      .locator('.dim[data-ready="true"]')
      .waitFor({ timeout: LOADER_TIMEOUT_MS + 5000 });
    await expect(page.locator('.loader')).toBeHidden();
    await expect(page.locator('.hero h1')).toBeVisible();
    const frames = await loaderFrames(page);
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
    await watchLoader(page);
    await openPage(page, '/', { locale: 'en' });
    await page
      .locator('.dim[data-ready="true"]')
      .waitFor({ timeout: LOADER_TIMEOUT_MS + 5000 });
    const labels = [...new Set((await loaderFrames(page)).map((f) => f.label))];
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
    await watchLoader(page);
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const frames = await loaderFrames(page);
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
