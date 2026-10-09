import { expect, test, type Page } from '@playwright/test';
import { expectNoMissingKeys, openPage } from './helpers/dimensions';
import {
  type LoaderFrame,
  loaderFrames,
  ready,
  watchLoader,
} from './helpers/home';

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
    await page.route('**/CTEC_Members.webp', () => {
      // never answered
    });
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
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // the served page before any script of it has run (with scripts off there is no loader at all)
    await page.route(PAGE_SCRIPT, (r) => r.abort());
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

/** The pictures of the scenes, by the end of their address: the first one, and the fourteen others. */
const SPAWN_PICTURE = 'CTEC_Members.webp';
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
        if (/\.webp$/.test(e.name)) log.asked[e.name] ??= e.startTime;
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

test.describe('home: the other pictures wait for the loader', () => {
  test('only the first picture is asked for under the loader; the fourteen others start when it lifts, without a scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // a first picture that takes its time: the loader is up for a good while
    await page.route(`**/${SPAWN_PICTURE}`, async (r) => {
      await new Promise((done) => setTimeout(done, 2500));
      await r.continue();
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
    expect(log.readyAt).toBeGreaterThan(2500);
    expect(askedAt(log, SPAWN_PICTURE)).toBeLessThan(2000);
    for (const p of OTHER_PICTURES) {
      expect(askedAt(log, p), `${p} waits for the loader`).toBeGreaterThan(
        2500,
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
    await openPage(page, '/#end');
    await ready(page);
    const log = await pictures(page);
    expect(log.readyAt).toBeGreaterThan(2500);
    expect(log.readyY).toBeGreaterThan(900);
    expect(log.scenesAtReady).toEqual(['hall']);
    expect(log.decodedAtReady.length).toBe(1);
    expect(log.decodedAtReady[0]).toMatch(/\/p21\.webp$/);
    expect(askedAt(log, '/survivalProgress/p21.webp')).toBeLessThan(2000);
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

  test('with scripts off every picture of every scene is still loaded', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
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
