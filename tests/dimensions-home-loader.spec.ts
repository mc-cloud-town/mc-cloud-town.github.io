import { expect, test, type Page } from '@playwright/test';
import { expectNoMissingKeys, openPage } from './helpers/dimensions';
import {
  type LoaderFrame,
  arrived,
  afterLoaderFrames,
  expectFullRun,
  loaderFrames,
  mapLifting,
  ready,
  watchLoader,
} from './helpers/home';
import { stubVideo } from './helpers/video';
import {
  MAP_FRONTIER,
  MAP_GROUND,
  MAP_SIZE,
  MAP_TONES,
  MAP_RUN_S,
  drawMap,
  planMap,
  plannedRun,
} from '../src/lib/dimensions/loaderMap';

/** Same as LOADER_TIMEOUT_MS in src/components/dimensions/home/Loader.tsx. */
const LOADER_TIMEOUT_MS = 6000;
/** Every script file of the page (the inline ones in the HTML are not files). */
const PAGE_SCRIPT = /\/_next\/static\/.*\.js(\?|$)/;

/** What is on top at the middle of the title: the loader, or the page. */
const overTitle = (page: Page) =>
  page.evaluate(() => {
    const r = document.querySelector('.hero h1')!.getBoundingClientRect();
    const top = document.elementFromPoint(
      r.left + r.width / 2,
      r.top + r.height / 2,
    );
    return top?.closest('.loader') ? 'loader' : 'page';
  });

/** Every statement, body, figure and caption of the page can be read: there, shown, and with words in it. */
const expectReadableWithoutScript = async (page: Page) => {
  await expect(page.locator('.hero h1')).toBeVisible();
  expect(await overTitle(page)).toBe('page');
  await expect(page.locator('.hero-meta span')).toBeVisible();
  await expect(page.locator('.hero-copy .lead')).toBeVisible();
  for (const id of ['overworld', 'nether', 'end']) {
    const lines = page.locator(`#${id} .say span`);
    expect(await lines.count(), `${id}: lines`).toBeGreaterThan(0);
    await lines.first().scrollIntoViewIfNeeded();
    for (const line of await lines.all()) {
      await expect(line, id).toBeVisible();
      await expect(line, id).toHaveCSS('opacity', '1');
      expect((await line.textContent())!.trim().length).toBeGreaterThan(0);
    }
    const body = page.locator(`#${id} p.body`);
    await expect(body, id).toBeVisible();
    await expect(body, id).toHaveCSS('opacity', '1');
  }
  // the figures: none stands empty over its caption
  const figures = page.locator('#overworld .stats b');
  expect(await figures.count()).toBe(4);
  let shown = 0;
  for (const b of await figures.all())
    if (await b.isVisible()) {
      shown++;
      expect((await b.textContent())!.trim()).toMatch(/^[\d,]+$/);
    }
  expect(shown).toBeGreaterThanOrEqual(3);
  await expect(page.locator('#overworld a.more')).toBeVisible();
  // the captions of the builds, the rank and the last section
  const captions = page.locator('.work h3');
  expect(await captions.count()).toBe(5);
  for (const h of await captions.all()) {
    await h.scrollIntoViewIfNeeded();
    await expect(h).toBeVisible();
    await expect(h).toHaveCSS('opacity', '1');
  }
  for (const sel of [
    '.rank h3',
    '#credits .roles',
    '#respawn h2',
    '#respawn .depts',
  ]) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await expect(page.locator(sel), sel).toBeVisible();
    await expect(page.locator(sel), sel).toHaveCSS('opacity', '1');
  }
};

/** One frame of the fail-safe test. */
interface SafeFrame {
  t: number;
  live: boolean;
  name: string;
  o: number;
  ready: boolean;
}

test.describe('home: never stuck behind the loader', () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ] as const)
    test(`with scripts off at ${width}×${height} there is no loader, and the whole page can be read`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width, height },
      });
      const page = await context.newPage();
      await stubVideo(page);
      await page.goto('/', { waitUntil: 'load' });
      // it is in the served page, and hidden at once
      await expect(page.locator('.loader')).toHaveCount(1);
      await expect(page.locator('.loader')).toBeHidden();
      await expectReadableWithoutScript(page);
      // the first picture is the served page's own
      expect(
        await page
          .locator('.scene.is-first img')
          .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth),
      ).toBeGreaterThan(0);
      const [scroll, inner] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        window.innerWidth,
      ]);
      expect(scroll).toBeLessThanOrEqual(inner);
      await context.close();
    });

  /** The rows of the ledger's list that can be read: shown, inside the screen's width, and not cut off by the stage. */
  const facilities = (page: Page) =>
    page.evaluate(() => {
      const stage = document
        .querySelector('#ledger .ledger-stage')!
        .getBoundingClientRect();
      return [
        ...document.querySelectorAll<HTMLElement>('#ledger .ledger-list li'),
      ]
        .filter((li) => {
          const r = li.getBoundingClientRect();
          const c = getComputedStyle(li);
          return (
            r.width > 0 &&
            r.height > 0 &&
            c.visibility !== 'hidden' &&
            +c.opacity > 0.5 &&
            r.left >= 0 &&
            r.right <= window.innerWidth &&
            r.top >= stage.top - 1 &&
            r.bottom <= stage.bottom + 1
          );
        })
        .map((li) => (li.lastElementChild?.textContent ?? '').trim());
    });

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [844, 390],
  ] as const)
    test(`with scripts off at ${width}×${height} all six Nether facilities can be read`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width, height },
      });
      const page = await context.newPage();
      await stubVideo(page);
      await page.goto('/', { waitUntil: 'load' });
      // what is served is the stage, and nothing will ever step through it
      await expect(page.locator('html')).not.toHaveAttribute('data-live');
      await expect(page.locator('#ledger .ledger-stage')).toHaveCount(1);
      await expect(page.locator('#ledger .ledger-list li')).toHaveCount(6);
      await page.locator('#ledger .ledger-stage').scrollIntoViewIfNeeded();
      for (const li of await page.locator('#ledger .ledger-list li').all())
        await expect(li).toBeVisible();
      const names = await facilities(page);
      expect(names).toHaveLength(6);
      expect(new Set(names).size).toBe(6);
      for (const name of names) expect(name.length).toBeGreaterThan(0);
      // the one the stage itself shows is the first of them, and it is not cut off either
      await expect(page.locator('#ledger .ledger-now h3')).toBeVisible();
      expect(names[0]).toBe(
        (await page.locator('#ledger .ledger-now h3').textContent())!.trim(),
      );
      expect(
        await page.evaluate(() => {
          const stage = document
            .querySelector('#ledger .ledger-stage')!
            .getBoundingClientRect();
          const now = document
            .querySelector('#ledger .ledger-now')!
            .getBoundingClientRect();
          return now.top >= stage.top - 1 && now.bottom <= stage.bottom + 1;
        }),
      ).toBe(true);
      const [scroll, inner] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        window.innerWidth,
      ]);
      expect(scroll).toBeLessThanOrEqual(inner);
      await context.close();
    });

  for (const [width, height] of [
    [390, 844],
    [844, 390],
  ] as const)
    test(`with scripts on at ${width}×${height} the pinned stage is as it was: one screen, one facility, no list`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/');
      await ready(page);
      await expect(page.locator('html')).toHaveAttribute('data-live', /.*/);
      await expect(page.locator('#ledger .ledger-list li')).toHaveCount(6);
      await expect(page.locator('#ledger .ledger-list')).toBeHidden();
      await expect(page.locator('#ledger .ledger-list')).toHaveCSS(
        'display',
        'none',
      );
      await expect(page.locator('#ledger .ledger-stage')).toHaveCSS(
        'overflow',
        'hidden',
      );
      expect(
        await page
          .locator('#ledger .ledger-stage')
          .evaluate((el) => Math.round(el.getBoundingClientRect().height)),
      ).toBe(height);
    });

  test('when the script of the page never arrives the loader gives way by itself after about ten seconds, with a fade', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(PAGE_SCRIPT, (r) => r.abort());
    await page.addInitScript(() => {
      const w = window as unknown as { __fade: number[]; __t0?: number };
      w.__fade = [0, 0, 0];
      const tick = () => {
        const el = document.querySelector('.loader');
        if (el) {
          w.__t0 ??= performance.now();
          const c = getComputedStyle(el);
          const o = c.visibility === 'hidden' ? 0 : +c.opacity;
          // when it was last whole, when it was first gone, and how many frames lay between
          if (o === 1) w.__fade = [performance.now() - w.__t0, 0, 0];
          else if (o > 0) w.__fade[2]++;
          else if (!w.__fade[1]) w.__fade[1] = performance.now() - w.__t0;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await stubVideo(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.loader')).toBeVisible();
    expect(await overTitle(page)).toBe('loader');
    await page.waitForTimeout(6500);
    // well past the page's own timeout, and still whole: the fail-safe is later than anything the script does
    await expect(page.locator('.loader')).toHaveCSS('opacity', '1');
    await expect(page.locator('.loader')).toBeHidden({ timeout: 8000 });
    const [whole, gone, between] = await page.evaluate(
      () => (window as unknown as { __fade: number[] }).__fade,
    );
    expect(whole).toBeGreaterThan(9000);
    expect(gone).toBeLessThan(12_000);
    expect(between, 'frames of the fade').toBeGreaterThan(5);
    await expectReadableWithoutScript(page);
  });

  test('with script the fail-safe is called off at once: a loader that waits its full six seconds lifts in its own way', async ({
    page,
  }) => {
    await stubVideo(page, {
      cover: () => {
        // never answered
      },
    });
    // (nor is the site's own picture, which would stand in for the cover after its budget: nothing comes)
    await page.route('**/CTEC_Members.webp', () => {});
    await page.addInitScript(() => {
      const w = window as unknown as { __safe: SafeFrame[] };
      w.__safe = [];
      const tick = (t: number) => {
        const el = document.querySelector('.loader');
        const home = document.querySelector<HTMLElement>('.dim--home');
        if (el && home) {
          const c = getComputedStyle(el);
          w.__safe.push({
            t,
            live: document.documentElement.hasAttribute('data-live'),
            name: c.animationName,
            o: c.visibility === 'hidden' ? 0 : +c.opacity,
            ready: home.dataset.ready === 'true',
          });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await openPage(page, '/');
    await page
      .locator('.dim[data-ready="true"]')
      .waitFor({ timeout: LOADER_TIMEOUT_MS + 5000 });
    await expect(page.locator('.loader')).toBeHidden();
    const frames = await page.evaluate(
      () => (window as unknown as { __safe: SafeFrame[] }).__safe,
    );
    const live = frames.filter((f) => f.live);
    const before = frames.filter((f) => !f.live);
    // the served page carries the fail-safe; the script calls it off within the first moments
    expect(before.length).toBeGreaterThan(0);
    for (const f of before)
      expect(f.name).toBe('loader-failsafe, loader-failsafe-gone');
    expect(live.length).toBeGreaterThan(200);
    expect(live[0].t - frames[0].t).toBeLessThan(3000);
    for (const f of live) expect(f.name).toBe('none');
    // whole for the full wait, and the lift begins only when the page is handed over
    const waiting = live.filter((f) => !f.ready);
    expect(waiting.at(-1)!.t - frames[0].t).toBeGreaterThan(5000);
    for (const f of waiting) expect(f.o).toBe(1);
    // with script the statements are dimmed until they are scrolled through, as before
    await expect(page.locator('#overworld .say span').first()).toHaveCSS(
      'opacity',
      '0.16',
    );
  });

  test('a script that arrives after the fail-safe does not bring the loader back, and the page still works', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(PAGE_SCRIPT, async (r) => {
      await new Promise((done) => setTimeout(done, 11_500));
      await r.continue().catch(() => {});
    });
    await page.addInitScript(() => {
      const w = window as unknown as { __back: number; __gone: boolean };
      w.__back = 0;
      w.__gone = false;
      const tick = () => {
        const el = document.querySelector('.loader');
        const c = el && getComputedStyle(el);
        const o = !c || c.visibility === 'hidden' ? 0 : +c.opacity;
        if (el && o === 0) w.__gone = true;
        // frames in which it shows again after it had gone
        else if (w.__gone && o > 0) w.__back++;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await stubVideo(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.loader')).toBeVisible();
    await expect(page.locator('.loader')).toBeHidden({ timeout: 14_000 });
    await page.locator('.dim[data-ready="true"]').waitFor({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    expect(
      await page.evaluate(
        () => (window as unknown as { __back: number }).__back,
      ),
    ).toBe(0);
    expect(await overTitle(page)).toBe('page');
    // the page is built all the same: the scene changes with the scroll
    await page.evaluate(() => {
      const el = document.querySelector('#overworld')!;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY + 300,
        behavior: 'instant',
      });
    });
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>('.scene')]
            .filter((s) => {
              const c = getComputedStyle(s);
              return c.visibility !== 'hidden' && +c.opacity > 0.5;
            })
            .map((s) => s.dataset.scene),
        ),
      )
      .toEqual(['town']);
  });
});

test.describe('home: loader', () => {
  test('the served HTML already has the loader over the whole screen, before any script of the page has run', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // the script of the page never arrives: what is seen is the served HTML and its styles
    await page.route(PAGE_SCRIPT, (r) => r.abort());
    await stubVideo(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loader = page.locator('.loader');
    await expect(loader).toBeVisible();
    await expect(loader).toHaveCSS('opacity', '1');
    const box = (await loader.boundingBox())!;
    expect(box.x).toBeLessThanOrEqual(0);
    expect(box.y).toBeLessThanOrEqual(0);
    expect(box.width).toBeGreaterThanOrEqual(1440);
    expect(box.height).toBeGreaterThanOrEqual(900);
    await expect(loader).toHaveCSS('background-color', 'rgb(6, 8, 11)');
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
    await stubVideo(page, {
      cover: () => {
        stalled++; // never answered
      },
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
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // the served page before any script of it has run (with scripts off there is no loader at all)
    await page.route(PAGE_SCRIPT, (r) => r.abort());
    await stubVideo(page);
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
    // …but none of it is shown: the served page is the loader's ground, and says nothing of a loading that may
    // not happen (the script shows the map if there turns out to be something to wait for)
    for (const part of ['.loader-in', '.loader .pct', '.loader canvas'])
      await expect(page.locator(part)).toBeHidden();
    await expect(page.locator('.loader-in')).toHaveCSS('opacity', '0');
    await expect(page.locator('.loader .pct')).toHaveCSS(
      'font-family',
      /JetBrains Mono/,
    );
    // no picture of any kind in the loader
    await expect(page.locator('.loader img')).toHaveCount(0);
  });

  /** The finished square: done inside to the last chunk, the frontier colour on the ring, the first grey around it. */
  const finished = (f: LoaderFrame) =>
    f.centre === DONE &&
    f.inner === DONE &&
    f.last === DONE &&
    f.ring === FRONTIER &&
    f.border === FIRST_GREY &&
    f.corner === FIRST_GREY &&
    f.colours === 3;
  /** The frames in which the map is shown and the page is not handed over yet. */
  const shownFrames = (frames: LoaderFrame[]) =>
    frames.filter((f) => f.block > 0 && !f.ready);
  /** No font is waited for: every request for one is refused at once. */
  const fontsAtOnce = (page: Page) =>
    page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

  test('what is drawn goes with the number over its whole range: every point of it changes the map, the last fifth as much as the first, and the finished square is there at 1 and not before', () => {
    // the drawing itself, on a canvas of this test's own: every chunk as it was last filled
    const draw = (p: number, plan: ReturnType<typeof planMap>, at?: number) => {
      const grid: string[][] = Array.from({ length: MAP_SIZE }, () =>
        Array.from({ length: MAP_SIZE }, () => ''),
      );
      const ctx = {
        fillStyle: '',
        fillRect(x: number, y: number, w: number, h: number) {
          for (let j = y; j < y + h; j++)
            for (let i = x; i < x + w; i++) grid[j][i] = this.fillStyle;
        },
      };
      drawMap(ctx as unknown as CanvasRenderingContext2D, p, plan, at);
      const all = grid.flat();
      const square = grid.slice(2, 19).flatMap((row) => row.slice(2, 19));
      const tone = (name: string) => all.filter((c) => c === name).length;
      return {
        all,
        grid,
        /** how far along each chunk is: the place of its colour among the stages */
        stages: all.map((c) => Math.max(0, MAP_TONES.indexOf(c))),
        /** chunks of the square (17 × 17, the ring included) that have been started, and that are done */
        started: square.filter((c) => c !== MAP_GROUND).length,
        done: tone(MAP_TONES[5]),
        finished:
          tone(MAP_TONES[5]) === 15 * 15 &&
          tone(MAP_FRONTIER) === 17 * 17 - 15 * 15 &&
          tone(MAP_TONES[1]) === 21 * 21 - 17 * 17,
      };
    };
    const differ = (a: string[], b: string[]) =>
      a.filter((c, i) => c !== b[i]).length;
    const n = MAP_SIZE * MAP_SIZE;
    // the chunks' lateness is random: the earliest, the latest, and a fixed mixture of both
    const lots = [
      Array.from({ length: n }, () => 0),
      Array.from({ length: n }, () => 1),
      Array.from({ length: n }, (_, i) => ((i * 7919) % 101) / 100),
    ];
    for (const late of lots) {
      const plan = planMap(late);
      // 225 chunks with five stages, 64 of the ring with four, 152 of the border with one
      expect(plan.changes).toBe(225 * 5 + 64 * 4 + 152);
      // nothing at 0; half of the square under way at half, its centre done and its ring not reached
      expect(draw(0, plan).started).toBe(0);
      const half = draw(0.5, plan);
      expect(half.started).toBeGreaterThan(289 * 0.3);
      expect(half.started).toBeLessThan(289 * 0.8);
      expect(half.grid[10][10]).toBe(MAP_TONES[5]);
      expect(half.grid[10][18]).not.toBe(MAP_FRONTIER);
      // every point of the percentage changes the map, by about as many chunks anywhere from 0 to 100; it only
      // ever goes forward; and the finished square is there at 100 and at nothing less
      const perTenth = Array.from({ length: 10 }, () => 0);
      let before = draw(0, plan);
      for (let pct = 1; pct <= 100; pct++) {
        const now = draw(pct / 100, plan);
        const changed = differ(now.all, before.all);
        expect(changed, `${pct - 1}% → ${pct}%`).toBeGreaterThanOrEqual(3);
        expect(changed, `${pct - 1}% → ${pct}%`).toBeLessThanOrEqual(17);
        expect(
          now.stages.filter((k, i) => k < before.stages[i]),
          'it only goes forward',
        ).toEqual([]);
        expect(now.finished, `${pct}%`).toBe(pct === 100);
        perTenth[Math.floor((pct - 1) / 10)] += now.stages.reduce(
          (sum, k, i) => sum + k - before.stages[i],
          0,
        );
        before = now;
      }
      // the stage changes, tenth by tenth: even, the last two not fewer than the others
      for (const count of perTenth) {
        expect(count).toBeGreaterThanOrEqual(150);
        expect(count).toBeLessThanOrEqual(157);
      }
      expect(perTenth.reduce((a, b) => a + b)).toBe(plan.changes);
      expect(draw(0.999, plan).finished).toBe(false);
      // the ring closes last, towards its corners: open at 98%, the border long laid by then
      const ring = (p: number) =>
        draw(p, plan).all.filter((c) => c === MAP_FRONTIER && true).length;
      expect(draw(0.98, plan).grid[0][0]).toBe(MAP_TONES[1]);
      expect(draw(0.8, plan).done).toBeLessThan(225 * 0.85);
      expect(draw(0.98, plan).done + ring(0.98)).toBeLessThan(289);
      expect(draw(1, plan).grid[2][2]).toBe(MAP_FRONTIER);

      // at work while the number rests: over three seconds at one figure the picture changes about twelve times
      // a second, a chunk or two at a time, never showing more than the number allows, and not at all at 100%
      for (const p of [0.08, 0.5, 0.85, 0.97]) {
        const still = draw(p, plan);
        let changes = 0;
        let longest = 0;
        let rest = 0;
        let wrong = 0;
        let most = 0;
        let last = draw(p, plan, 0);
        for (let at = 16; at <= 3000; at += 16) {
          const now = draw(p, plan, at);
          const changed = differ(now.all, last.all);
          most = Math.max(most, changed);
          // never ahead of the number, never more than a stage behind it; a finished chunk stays finished,
          // and one that has started does not go back to the ground
          wrong += now.stages.filter(
            (k, i) =>
              k > still.stages[i] ||
              k < still.stages[i] - 1 ||
              (still.all[i] === MAP_TONES[5] && now.all[i] !== MAP_TONES[5]) ||
              (still.stages[i] >= 1 && k < 1),
          ).length;
          rest = changed ? 0 : rest + 16;
          longest = Math.max(longest, rest);
          changes += changed;
          last = now;
        }
        expect(changes / 3, `changes a second at ${p}`).toBeGreaterThanOrEqual(
          8,
        );
        expect(changes / 3, `changes a second at ${p}`).toBeLessThanOrEqual(15);
        expect(longest, `longest rest at ${p}`).toBeLessThanOrEqual(250);
        expect(wrong, `chunks drawn out of their bounds at ${p}`).toBe(0);
        expect(most, `chunks changed in one frame at ${p}`).toBeLessThanOrEqual(
          2,
        );
      }
      const done = draw(1, plan);
      for (let at = 0; at <= 1000; at += 16)
        expect(differ(draw(1, plan, at).all, done.all)).toBe(0);
    }
  });

  test('while the number rests in the eighties for seconds the map is never still for 300 ms, and the finished square is not there before 100%', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await fontsAtOnce(page);
    // the first visit: only to learn the addresses of six of the scenes' pictures
    let hold = false;
    await stubVideo(page, {
      cover: (fulfil) => {
        // (on the second visit: never answered)
        if (!hold) void fulfil();
      },
    });
    await openPage(page, '/');
    await ready(page);
    const six = await page.evaluate(() =>
      ['w1', 'w2', 'w3', 'hall', 'moon', 'farm'].map(
        (id) =>
          document
            .querySelector(`.scene[data-scene="${id}"] img`)!
            .getAttribute('src')!,
      ),
    );
    expect(six.every((src) => src.length > 0)).toBe(true);
    // the second: a return to the top of a visit that remembers those six pictures (homePlace.ts). The loader
    // waits for them and for the hero's picture, seven of a kind, and the hero's never comes: six sevenths
    await page.addInitScript((pictures) => {
      if (window.location.pathname !== '/') return;
      window.history.replaceState({ __ctecHomeVisit: 'k1' }, '');
      window.sessionStorage.setItem(
        'ctec-home-place:k1',
        JSON.stringify({ section: 0, into: 0, height: 900, pictures }),
      );
    }, six);
    hold = true;
    // (nor does the site's own picture, which would stand in for the cover after its budget)
    await page.route('**/CTEC_Members.webp', () => {});
    // (and the six come a second and a half on, when the map is up: missing when it appeared, so counted; and
    // how long the rest lasts is then the loader's own time, not the network's)
    const picture = await (
      await page.request.get(new URL(six[0], page.url()).href)
    ).body();
    await page.route('**/survivalProgress/*.webp', (r) =>
      setTimeout(
        () => void r.fulfill({ contentType: 'image/webp', body: picture }),
        1500,
      ),
    );
    await watchLoader(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.dim[data-ready="true"]')
      .waitFor({ timeout: LOADER_TIMEOUT_MS + 8000 });
    const frames = await loaderFrames(page);
    const shown = expectFullRun(frames);
    const resting = shown.filter((f) => number(f) >= 80 && number(f) < 88);
    expect(resting.at(-1)!.t - resting[0].t, 'the rest').toBeGreaterThan(3000);
    // the number itself ticks now and then, without getting ahead: six sevenths, and a small drift
    expect(Math.max(...resting.map(number))).toBeLessThanOrEqual(87);
    expect(new Set(resting.map(number)).size).toBeGreaterThanOrEqual(2);
    // the picture changes all the time: no 300 ms of the rest without a change
    let since = resting[0].t;
    let longest = 0;
    let changes = 0;
    resting.forEach((f, i) => {
      if (i === 0) return;
      if (f.picture !== resting[i - 1].picture) {
        changes++;
        since = f.t;
      }
      longest = Math.max(longest, f.t - since);
    });
    expect(longest, 'the longest the map was still').toBeLessThan(300);
    expect(
      changes / ((resting.at(-1)!.t - resting[0].t) / 1000),
      'changes a second',
    ).toBeGreaterThan(5);
    // and it never looks done: the ring is not closed, the last chunk inside it not done, until 100%
    for (const f of resting) expect(finished(f)).toBe(false);
    for (const f of frames.filter((f) => f.pct !== '100%'))
      expect(finished(f)).toBe(false);
    expect(finished(shown.find((f) => f.pct === '100%')!)).toBe(true);
  });

  test('the map is the number: it starts at 0, at half it is half built, and the finished square is there at 100% and only then', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // a first picture that takes its time (inside the cover's own budget): there is something to build up to
    await stubVideo(page, {
      cover: (fulfil) => void setTimeout(() => void fulfil(), 1500),
    });
    await watchLoader(page);
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toBeHidden();
    const frames = await loaderFrames(page);
    expect(frames.length).toBeGreaterThan(40);
    // before anything is drawn: one colour
    expect(frames[0].colours).toBe(1);
    expect(number(frames[0])).toBe(0);
    // it is played in full: from nothing, whatever is in by then, to the whole, without a jump
    const shown = expectFullRun(frames);
    expect(shown[0].started).toBeLessThanOrEqual(12);
    // partway several stages are on the map at once
    expect(Math.max(...shown.map((f) => f.colours))).toBeGreaterThanOrEqual(5);
    // the finished square: at 100%, and in no frame that says less
    const full = frames.filter((f) => f.pct === '100%');
    expect(full.length).toBeGreaterThan(5);
    for (const f of full) expect(finished(f), 'finished at 100%').toBe(true);
    for (const f of frames.filter((f) => f.pct !== '100%'))
      expect(finished(f), `not finished at ${f.pct}`).toBe(false);
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
    const lifting = mapLifting(frames);
    expect(lifting.length).toBeGreaterThan(5);
    for (const f of lifting) expect(f.pct).toBe('100%');
    for (const f of frames.filter((f) => f.ready)) expect(f.pct).toBe('100%');
    const held = frames.filter((f) => f.pct === '100%' && f.block === 1);
    expect(held.length).toBeGreaterThan(2);
    // one line under it, from the first frame to the last: there is no second phase
    expect([...new Set(frames.map((f) => f.label))]).toEqual(['正在建置地形']);
  });

  test('the number is what has come: with the hero’s picture held back and nothing else missing it stays next to nothing, the map hardly begun, until the picture comes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // the fonts are in when the map appears (they are not counted): the picture is all that is missing
    await fontsAtOnce(page);
    await stubVideo(page, {
      // it comes once the loader has been up for a good second (inside the cover's own budget of two)
      cover: (fulfil) => void afterLoaderFrames(page, 80, fulfil),
    });
    await watchLoader(page);
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toBeHidden();
    const frames = await loaderFrames(page);
    const waiting = frames.filter((f) => !f.cover);
    const after = frames.filter((f) => f.cover);
    expect(waiting.length).toBeGreaterThanOrEqual(80);
    expect(after.length).toBeGreaterThan(10);
    const run = expectFullRun(frames);
    // held back by what has not come: well under the planned run from half a second on
    for (const f of waiting.filter((f) => f.t - run[0].t > 500))
      expect(number(f)).toBeLessThan(
        plannedRun((f.t - run[0].t) / 1000) * 100 - 5,
      );
    // while the picture is held back nothing of what is missing has come: the number is a slow drift of a small
    // part of it, so that it does not look frozen, and nowhere near what the picture is worth (all of it)
    const values = waiting.filter((f) => f.block > 0).map(number);
    expect(Math.max(...values)).toBeGreaterThan(1);
    expect(Math.max(...values)).toBeLessThanOrEqual(12);
    expect(new Set(values).size).toBeGreaterThan(2);
    // and the map says the same: hardly begun, nothing of it done
    for (const f of waiting) {
      expect(f.ready).toBe(false);
      expect(f.ring).not.toBe(FRONTIER);
      expect(f.last).not.toBe(DONE);
      expect(f.started).toBeLessThan(289 * 0.3);
      expect(finished(f)).toBe(false);
    }
    // then it catches up to 100% without a jump, the square finished with it and not before,
    // and then the page is handed over
    const full = after.find((f) => f.pct === '100%')!;
    expect(full.t - after[0].t).toBeLessThan(MAP_RUN_S * 1000);
    expect(finished(full)).toBe(true);
    for (const f of frames.filter((f) => f.pct !== '100%'))
      expect(finished(f)).toBe(false);
    const handed = frames.find((f) => f.ready)!;
    expect(handed.t - after[0].t).toBeLessThan(MAP_RUN_S * 1000 + 1000);
    expect(handed.pct).toBe('100%');
  });

  test('with the first scene stalled the number stays next to nothing, drifting a little, and at the timeout the map still runs up to 100% before the loader lifts', async ({
    page,
  }) => {
    await fontsAtOnce(page);
    await stubVideo(page, {
      cover: () => {
        // never answered
      },
    });
    // (nor is the site's own picture, which would stand in for the cover after its budget: nothing comes)
    await page.route('**/CTEC_Members.webp', () => {});
    await watchLoader(page);
    await openPage(page, '/');
    await page
      .locator('.dim[data-ready="true"]')
      .waitFor({ timeout: LOADER_TIMEOUT_MS + 5000 });
    await expect(page.locator('.loader')).toBeHidden();
    await expect(page.locator('.hero h1')).toBeVisible();
    const frames = await loaderFrames(page);
    expect([...new Set(frames.map((f) => f.label))]).toEqual(['正在建置地形']);
    const shown = expectFullRun(frames);
    // for the whole of the wait the picture, all that is missing, has not come: a small drift, never standing
    // still for good, never claiming it
    const waiting = shown.filter(
      (f) => f.t - shown[0].t < LOADER_TIMEOUT_MS - 1000,
    );
    expect(waiting.length).toBeGreaterThan(200);
    expect(Math.max(...waiting.map(number))).toBeLessThanOrEqual(12);
    expect(new Set(waiting.map(number)).size).toBeGreaterThan(4);
    for (const f of waiting) expect(finished(f)).toBe(false);
    // the wait is given up: the map is not taken away as it stands, it runs up to the whole first
    const full = shown.find((f) => f.pct === '100%')!;
    expect(full.t - frames.find((f) => f.live)!.t).toBeGreaterThan(
      LOADER_TIMEOUT_MS - 200,
    );
    expect(finished(full)).toBe(true);
    for (const f of mapLifting(frames)) expect(f.pct).toBe('100%');
  });

  test('in English the line under the map is in English', async ({ page }) => {
    await stubVideo(page, {
      cover: (fulfil) => void setTimeout(() => void fulfil(), 1500),
    });
    await watchLoader(page);
    await openPage(page, '/', { locale: 'en' });
    await ready(page);
    const shown = shownFrames(await loaderFrames(page));
    expect(shown.length).toBeGreaterThan(10);
    // (the served HTML is in the default language until the reader's own is known; it is not shown then)
    expect([...new Set(shown.map((f) => f.label))]).toEqual([
      'Building terrain',
    ]);
    await expectNoMissingKeys(page);
  });

  test('reduced motion: nothing builds up, the map that is shown is the finished one, and the loader goes', async ({
    page,
  }) => {
    await stubVideo(page, {
      cover: (fulfil) => void setTimeout(() => void fulfil(), 1200),
    });
    await watchLoader(page);
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const frames = await loaderFrames(page);
    const shown = frames.filter((f) => f.block > 0);
    expect(shown.length).toBeGreaterThan(3);
    // never a part of a map: finished in every frame it is shown in
    for (const f of shown) {
      expect(f.pct).toBe('100%');
      expect(finished(f)).toBe(true);
    }
    for (const f of frames.filter((f) => !f.cover)) expect(f.ready).toBe(false);
    await expect(page.locator('.hero h1')).toBeVisible();
  });
});

test.describe('home: no loading is shown when there is nothing to wait for', () => {
  /** Nothing of the page is slow: no font is waited for (every request for one is refused at once). */
  const fontsAtOnce = (page: Page) =>
    page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());

  test('everything in at once: no map and no percentage in any frame from the first paint, the ground lifts straight onto the hero’s arrival', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await fontsAtOnce(page);
    await watchLoader(page);
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const frames = await loaderFrames(page);
    const served = frames.filter((f) => !f.live);
    const waiting = frames.filter((f) => f.live && !f.ready);
    const after = frames.filter((f) => f.ready);
    expect(served.length).toBeGreaterThan(2);
    expect(after.length).toBeGreaterThan(10);
    // the map and the percentage: never shown, never drawn
    for (const f of frames) {
      expect(f.block).toBe(0);
      expect(f.colours).toBe(1);
    }
    // the ground is whole over the hero until the page is handed over…
    for (const f of [...served, ...waiting]) expect(f.ground).toBe(1);
    // …which is soon after the script took over (the old loader took two seconds at the least)
    expect(after[0].t - served.at(-1)!.t).toBeLessThan(1000);
    // then it lifts, over many frames, onto the arrival: the camera comes in from its start while the ground goes
    const ground = after.map((f) => f.ground);
    ground.forEach((o, i) =>
      expect(o, `frame ${i}`).toBeLessThanOrEqual(ground[i - 1] ?? 1),
    );
    expect(new Set(ground.filter((o) => o > 0 && o < 1)).size).toBeGreaterThan(
      8,
    );
    expect(after[0].cam).toBeGreaterThan(1.25);
    expect(new Set(after.map((f) => f.cam.toFixed(3))).size).toBeGreaterThan(8);
    expect(after.at(-1)!.cam).toBeLessThan(after[0].cam - 0.05);
    await arrived(page);
    await expect(page.locator('.hero h1')).toBeVisible();
    // the picture it lifted on was in, and is marked as whole
    await expect(page.locator('.scene.is-first img.vid-cover')).toHaveAttribute(
      'data-cover',
      'youtube',
    );
  });

  test('reduced motion, everything in at once: no map, and the ground goes in a brief fade', async ({
    page,
  }) => {
    await fontsAtOnce(page);
    await watchLoader(page);
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const frames = await loaderFrames(page);
    expect(frames.length).toBeGreaterThan(3);
    for (const f of frames) expect(f.block).toBe(0);
    for (const f of frames.filter((f) => !f.ready)) expect(f.ground).toBe(1);
    const live = frames.find((f) => f.live)!;
    const handed = frames.find((f) => f.ready)!;
    expect(handed.t - live.t).toBeLessThan(1000);
    // gone within a quarter of a second of the handover
    expect(frames.at(-1)!.t - handed.t).toBeLessThan(400);
    await expect(page.locator('.hero h1')).toBeVisible();
  });

  test('everything is in a moment after the map appeared: the map still plays its planned run in full, two seconds from 0 to 100% at an even pace, and then lifts in its own way', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await fontsAtOnce(page);
    const mapShown = async () => {
      for (;;) {
        const shown = await page
          .evaluate(() =>
            (window as unknown as { __loader?: LoaderFrame[] }).__loader?.some(
              (f) => f.block > 0,
            ),
          )
          .catch(() => false);
        // (and a third of a second more)
        if (shown) return new Promise((done) => setTimeout(done, 300));
        await new Promise((done) => setTimeout(done, 15));
      }
    };
    await stubVideo(page, {
      cover: (fulfil) => void mapShown().then(fulfil),
    });
    await watchLoader(page);
    await openPage(page, '/');
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const frames = await loaderFrames(page);
    const first = frames.find((f) => f.block > 0)!;
    expect(first).toBeDefined();
    // once shown it is played in full: the planned run, not cut short by everything being in already
    const run = expectFullRun(frames);
    const building = run.filter((f) => !f.ready);
    for (const f of building) {
      const planned = plannedRun((f.t - run[0].t) / 1000) * 100;
      const said = Number(f.pct.replace('%', ''));
      // (never ahead of the plan by more than the frame it was read in, never far behind it)
      expect(said, `at ${Math.round(f.t - run[0].t)} ms`).toBeLessThanOrEqual(
        planned + 2,
      );
      // (for its first third of a second and more nothing had come, and it was held back: it has caught up soon after)
      expect(
        said,
        `at ${Math.round(f.t - run[0].t)} ms`,
      ).toBeGreaterThanOrEqual(planned - (f.t - run[0].t < 1400 ? 32 : 6));
    }
    // an even pace: each fifth of the range takes its share of the two seconds, the last no less than the first
    const reached = (pct: number) =>
      building.find((f) => Number(f.pct.replace('%', '')) >= pct)!.t - run[0].t;
    for (const pct of [20, 40, 60, 80, 100]) {
      const took = reached(pct) - (pct > 20 ? reached(pct - 20) : 0);
      expect(took, `${pct - 20}% → ${pct}%`).toBeGreaterThan(
        pct > 60 ? 280 : 120,
      );
      // (the first of them includes the wait for what had not come yet)
      if (pct > 40) expect(took, `${pct - 20}% → ${pct}%`).toBeLessThan(720);
    }
    expect(reached(100)).toBeGreaterThan(MAP_RUN_S * 1000 - 100);
    expect(reached(100)).toBeLessThan(MAP_RUN_S * 1000 + 400);
    const handed = frames.find((f) => f.ready)!;
    expect(handed.t - first.t).toBeLessThan(MAP_RUN_S * 1000 + 1500);
    const shown = frames.filter((f) => f.block > 0 && !f.ready);
    expect(shown.at(-1)!.pct).toBe('100%');
    expect(shown.at(-1)!.block).toBe(1);
    // and the lift is the map's own: it opens over several frames before the ground goes
    const lifting = mapLifting(frames);
    expect(
      new Set(lifting.map((f) => f.block).filter((o) => o > 0)).size,
    ).toBeGreaterThan(4);
    for (const f of lifting) expect(f.pct).toBe('100%');
  });
});

/** The pictures of the scenes, by the end of their address: the first one (the cover of the hero's video), and the fourteen others. */
const SPAWN_PICTURE = 'maxresdefault.jpg';
const OTHER_PICTURES = [
  'CTEC_Building.webp',
  ...[40, 33, 17, 4, 10, 12, 38, 49, 51, 21, 14, 6, 2].map(
    (n) => `/survivalProgress/p${n}.webp`,
  ),
];

/** What `watchPictures` has seen. */
interface PictureLog {
  /** when the page was handed over (`data-ready`), on the page's own clock */
  readyAt: number | null;
  /** the scroll position at that moment */
  readyY: number;
  /** when each picture was asked for, by address */
  asked: Record<string, number>;
  /** the pictures of the scenes on screen that were decoded at the first frame the page was handed over */
  decodedAtReady: string[];
  /** the scenes on screen at that frame */
  scenesAtReady: string[];
}

/** From the first frame: when the page is handed over, and when each picture is asked for (the browser's own record). */
const watchPictures = (page: Page) =>
  page.addInitScript(() => {
    const log: PictureLog = {
      readyAt: null,
      readyY: 0,
      asked: {},
      decodedAtReady: [],
      scenesAtReady: [],
    };
    (window as unknown as { __pictures: PictureLog }).__pictures = log;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (/\.(webp|jpg)$/.test(e.name)) log.asked[e.name] ??= e.startTime;
    }).observe({ type: 'resource', buffered: true });
    const tick = () => {
      const home = document.querySelector<HTMLElement>('.dim--home');
      if (home?.dataset.ready !== 'true') return requestAnimationFrame(tick);
      log.readyAt = performance.now();
      log.readyY = window.scrollY;
      const scenes = [
        ...document.querySelectorAll<HTMLElement>('.scene'),
      ].filter((s) => {
        const c = getComputedStyle(s);
        return c.visibility !== 'hidden' && +c.opacity > 0.5;
      });
      log.scenesAtReady = scenes.map((s) => s.dataset.scene!);
      log.decodedAtReady = scenes.flatMap((s) =>
        [...s.querySelectorAll('img')]
          .filter(
            (i) =>
              +getComputedStyle(i).opacity > 0.5 &&
              i.complete &&
              i.naturalWidth > 0,
          )
          .map((i) => i.currentSrc),
      );
    };
    requestAnimationFrame(tick);
  });
const pictures = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __pictures: PictureLog }).__pictures,
  );
/** When the picture whose address ends like this was asked for; undefined if it never was. */
const askedAt = (log: PictureLog, end: string) =>
  Object.entries(log.asked).find(([url]) => url.endsWith(end))?.[1];

/** The page as `watchHandover` sees it. */
interface Handover {
  /** on the page's own clock */
  t: number;
  /** how far `#end` is from the head of the screen */
  top: number;
  scenes: string[];
  dim: string | undefined;
  /** opacity of the hall's picture (0 while its scene is hidden), and whether the loader marked it whole */
  picture: number;
  whole: boolean;
  /** opacity of the loader, and of the block that holds its map */
  loader: number;
  map: number;
}
/**
 * From the first frame: the page at the very moment it is handed over (`data-ready`: an observer is told before
 * anything else runs, and before any frame), and in every frame from then on.
 */
const watchHandover = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as {
      __handover: Handover[];
      __after: Handover[];
    };
    w.__handover = [];
    w.__after = [];
    const see = (): Handover => {
      const shown = (sel: string) => {
        const el = document.querySelector(sel);
        const c = el && getComputedStyle(el);
        return !c || c.visibility === 'hidden' ? 0 : +c.opacity;
      };
      return {
        t: performance.now(),
        top: Math.round(
          document.querySelector('#end')!.getBoundingClientRect().top,
        ),
        scenes: [...document.querySelectorAll<HTMLElement>('.scene')]
          .filter((s) => {
            const c = getComputedStyle(s);
            return c.visibility !== 'hidden' && +c.opacity > 0.5;
          })
          .map((s) => s.dataset.scene!),
        dim: document.documentElement.dataset.dim,
        picture: shown('.scene[data-scene="hall"] img'),
        whole:
          document.querySelector<HTMLElement>('.scene[data-scene="hall"] img')
            ?.dataset.whole !== undefined,
        loader: shown('.loader'),
        map: shown('.loader-in'),
      };
    };
    const isReady = () =>
      document.querySelector<HTMLElement>('.dim--home')?.dataset.ready ===
      'true';
    const arm = () => {
      const home = document.querySelector('.dim--home');
      if (!home) return requestAnimationFrame(arm);
      new MutationObserver(() => {
        if (isReady()) w.__handover.push(see());
      }).observe(home, { attributes: true, attributeFilter: ['data-ready'] });
    };
    arm();
    const tick = () => {
      if (isReady()) w.__after.push(see());
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
const handoverSeen = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as {
      __handover: Handover[];
      __after: Handover[];
    };
    return { handover: w.__handover, after: w.__after };
  });

test.describe('home: the other pictures wait for the loader', () => {
  test('only the first picture is asked for under the loader; the fourteen others start when it lifts, without a scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // a first picture that takes its time: the loader is up for a good while
    await stubVideo(page, {
      // (inside the cover's own budget, after which the site's own picture would stand in for it)
      cover: (fulfil) => void setTimeout(() => void fulfil(), 1500),
    });
    await watchPictures(page);
    await openPage(page, '/');
    await ready(page);
    // all of them, and the page has not been scrolled
    await expect
      .poll(async () => {
        const log = await pictures(page);
        return OTHER_PICTURES.filter((p) => askedAt(log, p) === undefined);
      })
      .toEqual([]);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const log = await pictures(page);
    expect(log.readyAt).toBeGreaterThan(1500);
    expect(askedAt(log, SPAWN_PICTURE)).toBeLessThan(1500);
    for (const p of OTHER_PICTURES) {
      expect(askedAt(log, p), `${p} waits for the loader`).toBeGreaterThan(
        1500,
      );
      // at the lift: within a moment of the page being handed over (a frame is the grain of this clock)
      expect(
        Math.abs(askedAt(log, p)! - log.readyAt!),
        `${p} starts at the lift`,
      ).toBeLessThan(400);
    }
    // the next scene is the first of them to be asked for
    const order = OTHER_PICTURES.map((p) => askedAt(log, p)!);
    expect(Math.min(...order)).toBe(order[0]);
    // and they arrive: every picture of every scene
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            [
              ...document.querySelectorAll<HTMLImageElement>('.world img'),
            ].filter((i) => i.complete && i.naturalWidth > 0).length,
        ),
      )
      .toBe(15);
  });

  test('arriving at #end, the hall is asked for under the loader and decoded before it lifts; the rest still waits', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // the picture of the place arrived at takes its time: the loader waits for it
    await page.route('**/survivalProgress/p21.webp', async (r) => {
      await new Promise((done) => setTimeout(done, 2500));
      await r.continue();
    });
    await watchPictures(page);
    await watchLoader(page);
    await openPage(page, '/#end');
    await ready(page);
    // (the map of this arrival is played in full as on any other: from 0 to 100% before anything lifts)
    expectFullRun(await loaderFrames(page));
    const log = await pictures(page);
    expect(log.readyAt).toBeGreaterThan(2500);
    expect(log.readyY).toBeGreaterThan(900);
    expect(log.scenesAtReady).toEqual(['hall']);
    expect(log.decodedAtReady.length).toBe(1);
    expect(log.decodedAtReady[0]).toMatch(/\/p21\.webp$/);
    // under the loader: asked for so long before the lift that the loader waited out the whole of its delay
    // (measured against the lift, not against the start of the page: how soon the script starts is the machine's)
    const asked = askedAt(log, '/survivalProgress/p21.webp');
    expect(asked).toBeDefined();
    expect(log.readyAt! - asked!).toBeGreaterThan(2500);
    await expect
      .poll(async () => {
        const now = await pictures(page);
        return OTHER_PICTURES.filter((p) => askedAt(now, p) === undefined);
      })
      .toEqual([]);
    const after = await pictures(page);
    for (const p of OTHER_PICTURES.filter((p) => !p.endsWith('/p21.webp')))
      expect(askedAt(after, p), `${p} waits for the loader`).toBeGreaterThan(
        2500,
      );
  });

  test('arriving at #ledger, the first facility is the picture that is there when the loader lifts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await watchPictures(page);
    await openPage(page, '/#ledger');
    await ready(page);
    const log = await pictures(page);
    expect(log.scenesAtReady).toEqual(['nether']);
    expect(log.decodedAtReady.length).toBe(1);
    expect(log.decodedAtReady[0]).toMatch(/\/p4\.webp$/);
  });

  // The page is handed over (`data-ready`) and the loader starts to lift in one step with the landing: read at
  // the very moment the mark appears, not a frame later, so a frame that happens to fall in between cannot hide
  // (or show) a page that is handed over while it still stands on the first scene.
  for (const reducedMotion of [false, true])
    test(`arriving at #end${reducedMotion ? ' with reduced motion' : ''}, the page is on the hall, picture whole, at the moment it is handed over`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      // the picture comes late: with reduced motion the loader lifts the moment it is in
      await page.route('**/survivalProgress/p21.webp', async (r) => {
        await new Promise((done) => setTimeout(done, 1500));
        await r.continue();
      });
      await watchHandover(page);
      await openPage(page, '/#end', { reducedMotion });
      await ready(page);
      await expect(page.locator('.loader')).toHaveCount(0);
      const { handover, after } = await handoverSeen(page);
      // handed over once: on the section, on its scene, its picture whole, and the loader has not begun to lift
      expect(handover.length).toBe(1);
      expect(Math.abs(handover[0].top)).toBeLessThanOrEqual(1);
      expect(handover[0]).toMatchObject({
        scenes: ['hall'],
        dim: 'end',
        picture: 1,
        whole: true,
        loader: 1,
        map: 1,
      });
      // and no frame after it shows anything else under the lifting loader
      expect(after.length).toBeGreaterThan(3);
      expect(
        after.filter(
          (f) =>
            Math.abs(f.top) > 1 ||
            f.scenes.join() !== 'hall' ||
            f.picture < 1 ||
            f.dim !== 'end',
        ),
      ).toEqual([]);
    });

  test('arriving at #end with a picture that never comes: at the timeout the page is handed over on the hall all the same, and the picture fades in when it does come', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let release = () => {};
    const held = new Promise<void>((done) => (release = done));
    await page.route('**/survivalProgress/p21.webp', async (r) => {
      await held;
      await r.continue();
    });
    await watchHandover(page);
    await openPage(page, '/#end');
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const { handover, after } = await handoverSeen(page);
    // the loader gave up, not the page: it is where the address says, on its scene, in its dimension
    expect(handover.length).toBe(1);
    expect(handover[0].t).toBeGreaterThan(LOADER_TIMEOUT_MS);
    expect(Math.abs(handover[0].top)).toBeLessThanOrEqual(1);
    expect(handover[0]).toMatchObject({
      scenes: ['hall'],
      dim: 'end',
      loader: 1,
      map: 1,
      // the picture is not in: nothing to show, and not marked as whole
      picture: 0,
      whole: false,
    });
    expect(after.length).toBeGreaterThan(3);
    expect(
      after.filter(
        (f) =>
          Math.abs(f.top) > 1 ||
          f.scenes.join() !== 'hall' ||
          f.picture !== 0 ||
          f.whole,
      ),
    ).toEqual([]);
    // it comes at last: it fades in, over frames, and is not marked as one the loader lifted on
    release();
    await expect
      .poll(async () => (await handoverSeen(page)).after.at(-1)!.picture)
      .toBe(1);
    const late = (await handoverSeen(page)).after.slice(after.length);
    const rising = late.map((f) => f.picture).filter((o) => o > 0 && o < 1);
    expect(new Set(rising).size).toBeGreaterThan(3);
    expect(late.map((f) => f.picture)).toEqual(
      [...late.map((f) => f.picture)].sort((a, b) => a - b),
    );
    expect(late.some((f) => f.whole)).toBe(false);
  });

  // The page is built in the step that hands it over, which takes a slow device a good while; the lift is started
  // on the tick after it, so that this while is not taken out of the lift.
  test('on a slow device the lift still plays in full: the loader goes over many frames, in its own time', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    // (the picture of the place takes its time, so the loader shows its map: it is that lift which is measured)
    await page.route('**/survivalProgress/p21.webp', async (r) => {
      await new Promise((done) => setTimeout(done, 1500));
      await r.continue();
    });
    await watchHandover(page);
    await openPage(page, '/#end');
    await ready(page);
    await expect(page.locator('.loader')).toHaveCount(0);
    const { handover, after } = await handoverSeen(page);
    expect(handover.length).toBe(1);
    const gone = after.find((f) => f.loader === 0)!;
    expect(gone).toBeDefined();
    // the map opens for 0.6 s, the cover goes in the 0.9 s that follow, a tenth of a second into each other
    const LIFT_MS = 1400;
    const lasted = gone.t - handover[0].t;
    expect(lasted).toBeGreaterThan(LIFT_MS - 100);
    // (read at four times throttling, from the handover to the first frame without the loader: one long frame
    // anywhere in it is added whole, and the longest task at this throttle, the build, is about 0.8 s)
    expect(lasted).toBeLessThan(LIFT_MS + 1000);
    // and both parts of it are seen on their way
    const lifting = after.filter((f) => f.t <= gone.t);
    const steps = (of: 'map' | 'loader') =>
      new Set(lifting.map((f) => f[of]).filter((o) => o > 0 && o < 1)).size;
    expect(steps('map')).toBeGreaterThan(4);
    expect(steps('loader')).toBeGreaterThan(4);
  });

  test('with scripts off every picture of every scene is still loaded', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await stubVideo(page);
    await page.goto('/', { waitUntil: 'load' });
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLImageElement>('.world img')]
            .filter((i) => i.complete && i.naturalWidth > 0)
            .map((i) => i.currentSrc.split('/').pop())
            .sort(),
        ),
      )
      .toEqual(
        [SPAWN_PICTURE, ...OTHER_PICTURES]
          .map((p) => p.split('/').pop())
          .sort(),
      );
    await context.close();
  });
});
