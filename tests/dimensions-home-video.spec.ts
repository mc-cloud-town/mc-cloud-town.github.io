// tests/dimensions-home-video.spec.ts
// The hero's background is the anniversary video: its own still (the cover) first, the player under it, and the
// moving picture once the player has settled. No test reaches YouTube (helpers/video.ts).
import { expect, test, type Page } from '@playwright/test';
import {
  expectNoHorizontalScroll,
  openPage,
  setLanguage,
} from './helpers/dimensions';
import {
  arrived,
  jumpTo,
  ready,
  scrollToSection,
  visibleScenes,
} from './helpers/home';
import {
  API_URL,
  COVER_URL,
  coverOpacity,
  PLAYER_VARS,
  players,
  playerState,
  stubVideo,
  videoClock,
  VIDEO,
} from './helpers/video';

/** Same as SETTLE_MS and DISSOLVE_S in src/components/dimensions/home/HeroVideo.tsx. */
const SETTLE_MS = 4200;
const DISSOLVE_MS = 1800;
/** How long before the video's end the cover begins to come back (LAP_LEAD_S there). */
const LAP_LEAD_MS = 2300;
/** How long the hero's arrival lasts from the hand-over: the camera's move, its longest part (HomePage.tsx). */
const ARRIVAL_MS = 3100;

/** Count the requests for the player's script. */
const apiRequests = (page: Page) => {
  const seen: string[] = [];
  page.on('request', (r) => {
    if (API_URL.test(r.url())) seen.push(r.url());
  });
  return seen;
};

/** One frame of the cover, as `watchCover` records it. */
interface CoverFrame {
  t: number;
  cover: number;
  /** scale of the hero's camera: 1 once the arrival has played out */
  cam: number;
  ready: boolean;
  loader: number;
  /** the cover has come and can be drawn */
  in: boolean;
  /** how many players the page has made */
  players: number;
}
/** Record the cover on every frame from the very first one; `__playingAt` is set by `sayPlaying`. */
const watchCover = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __cover: CoverFrame[] };
    w.__cover = [];
    const tick = (t: number) => {
      const cover = document.querySelector('.vid .vid-cover');
      const cam = document.querySelector('.scene.is-first .cam');
      const loader = document.querySelector('.loader');
      if (cover && cam) {
        const l = loader && getComputedStyle(loader);
        w.__cover.push({
          t,
          cover: +getComputedStyle(cover).opacity,
          cam: new DOMMatrix(getComputedStyle(cam).transform).a,
          ready:
            document.querySelector<HTMLElement>('.dim--home')?.dataset.ready ===
            'true',
          loader: !l || l.visibility === 'hidden' ? 0 : +l.opacity,
          in:
            (cover as HTMLImageElement).complete &&
            (cover as HTMLImageElement).naturalWidth > 0,
          players:
            (window as unknown as { __yt?: { players: unknown[] } }).__yt
              ?.players.length ?? 0,
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
/** The page's own clock. */
const now = (page: Page) => page.evaluate(() => performance.now());
const coverFrames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __cover: CoverFrame[] }).__cover);
/** The player says it is playing; returns the moment, on the page's clock. */
const sayPlaying = async (page: Page) => {
  await expect.poll(async () => (await players(page)).length).toBe(1);
  return page.evaluate(() => {
    const at = performance.now();
    const live = (
      window as unknown as { __yt: { live: { emit(state: number): void }[] } }
    ).__yt.live;
    live[live.length - 1].emit(1);
    return at;
  });
};

test.describe('home: the hero is the anniversary video', () => {
  test('the served page carries the cover as its first picture, and no player', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text();
    const first = html.slice(
      html.indexOf('data-scene="spawn"'),
      html.indexOf('data-scene="town"'),
    );
    expect(first.length).toBeGreaterThan(0);
    expect(first).toContain('class="vid"');
    expect(first).toMatch(
      new RegExp(
        `<img[^>]+class="vid-cover"[^>]+src="https://img\\.youtube\\.com/vi/${VIDEO.id}/maxresdefault\\.jpg"`,
      ),
    );
    expect(first).not.toContain('<iframe');
    // the group photograph is no longer the picture of the spawn
    expect(first).not.toContain('CTEC_Members');
  });

  test('the loader waits for the cover and lifts on it whole; the player is made at once, under the loader', async ({
    page,
  }) => {
    // a cover that takes its time: the loader is up for a good while
    await stubVideo(page, {
      cover: (fulfil) => void setTimeout(() => void fulfil(), 4500),
    });
    await watchCover(page);
    await openPage(page, '/');
    await ready(page);
    // at the hand-over the cover is in, whole, and marked as the loader marks what it waited for
    const cover = await page
      .locator('.vid .vid-cover')
      .evaluate((img: HTMLImageElement) => ({
        in: img.complete && img.naturalWidth > 0,
        opacity: +getComputedStyle(img).opacity,
        src: img.currentSrc,
      }));
    expect(cover.in).toBe(true);
    expect(cover.opacity).toBe(1);
    expect(cover.src).toMatch(COVER_URL);
    const frames = await coverFrames(page);
    // the page was not handed over before the cover was in, and from then on the cover is whole
    const waiting = frames.filter((f) => !f.in);
    expect(waiting.length).toBeGreaterThan(30);
    for (const f of waiting) {
      expect(f.ready).toBe(false);
      expect(f.loader).toBe(1);
    }
    const handed = frames.filter((f) => f.ready);
    expect(handed.length).toBeGreaterThan(0);
    for (const f of handed) expect(f.in).toBe(true);
    for (const f of frames) expect(f.cover).toBe(1);
    // under the loader, the cover still on its way: the one player is there already
    expect(waiting.filter((f) => f.players === 1).length).toBeGreaterThan(3);
    expect(Math.max(...frames.map((f) => f.players))).toBe(1);
    expect(await visibleScenes(page)).toEqual(['spawn']);
  });

  test("exactly one player, with the demo's settings, in a frame that takes neither the pointer nor the focus", async ({
    page,
  }) => {
    await openPage(page, '/');
    await arrived(page);
    const all = await players(page);
    expect(all).toHaveLength(1);
    expect(all[0].videoId).toBe(VIDEO.id);
    expect(all[0].playerVars).toEqual(PLAYER_VARS);
    expect(all[0].connected).toBe(true);
    const frame = page.locator('.vid iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute('tabindex', '-1');
    await expect(frame).toHaveAttribute('aria-hidden', 'true');
    expect((await frame.getAttribute('title'))?.length).toBeGreaterThan(0);
    await expect(frame).toHaveCSS('pointer-events', 'none');
    // (not by making a part of the page inert: that is how the page says it is held, and it is not)
    await expect(page.locator('.world [inert], .world[inert]')).toHaveCount(0);
    // under the cover in the box, the veil above both
    const order = await page
      .locator('.scene.is-first .cam')
      .evaluate((cam) =>
        [...cam.children].map((el) => el.className.split(' ')[0]),
      );
    expect(order).toEqual(['vid', 'veil']);
    expect(
      await page
        .locator('.vid')
        .evaluate((el) => [...el.children].map((c) => c.className)),
    ).toEqual(['vid-player', 'vid-cover']);
    // the keyboard never lands in it: Tab goes through the whole hero and beyond
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() => document.activeElement?.tagName),
        `Tab ${i + 1}`,
      ).not.toBe('IFRAME');
    }
    // and a click in the middle of the picture goes to the page, not to the frame
    const hit = await page.evaluate(() => {
      const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      return el?.tagName;
    });
    expect(hit).not.toBe('IFRAME');
  });

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [844, 390],
  ] as const)
    test(`at ${width}×${height} the box reaches beyond the screen on every side, and changes nothing of the layout`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openPage(page, '/');
      await arrived(page);
      const box = await page.locator('.vid').evaluate((el) => {
        const r = el.getBoundingClientRect();
        const inner = [
          el.querySelector('.vid-cover')!,
          el.querySelector('iframe')!,
        ].map((c) => {
          const b = c.getBoundingClientRect();
          return [b.left, b.top, b.width, b.height].map(Math.round);
        });
        return {
          left: r.left,
          top: r.top,
          right: innerWidth - r.right,
          bottom: innerHeight - r.bottom,
          ratio: r.width / r.height,
          own: [r.left, r.top, r.width, r.height].map(Math.round),
          inner,
        };
      });
      // at least a tenth of the screen's height is cut off above and below, where the player keeps its own bars
      expect(box.top).toBeLessThan(-height * 0.1);
      expect(box.bottom).toBeLessThan(-height * 0.1);
      expect(box.left).toBeLessThan(-width * 0.1);
      expect(box.right).toBeLessThan(-width * 0.1);
      expect(box.ratio).toBeCloseTo(16 / 9, 2);
      // the still and the moving picture are the same box
      for (const b of box.inner) expect(b).toEqual(box.own);
      await expectNoHorizontalScroll(page);
      expect(
        await page.evaluate(() => [
          document.documentElement.scrollWidth,
          document.documentElement.clientWidth,
        ]),
      ).toEqual([width, width]);
    });

  test('the cover stays whole until the player has played for its settle time, then dissolves over frames', async ({
    page,
  }) => {
    test.slow();
    await watchCover(page);
    await openPage(page, '/');
    await arrived(page);
    // long after the arrival: the dissolve is timed by the player alone here
    await page.waitForTimeout(600);
    expect(await coverOpacity(page)).toBe(1);
    const at = await sayPlaying(page);
    await expect
      .poll(() => coverOpacity(page), { timeout: 12_000 })
      .toBeLessThan(0.001);
    const frames = (await coverFrames(page)).filter((f) => f.t >= at);
    const first = frames.find((f) => f.cover < 1)!;
    const gone = frames.find((f) => f.cover === 0)!;
    // whole through the settle: the player's own buttons are under it all that time
    for (const f of frames.filter((f) => f.t < at + SETTLE_MS - 50))
      expect(f.cover, `at ${Math.round(f.t - at)}ms`).toBe(1);
    expect(first.t - at).toBeGreaterThan(SETTLE_MS - 50);
    expect(first.t - at).toBeLessThan(SETTLE_MS + 500);
    // then it goes in its own time, evenly, never back
    expect(gone.t - first.t).toBeGreaterThan(DISSOLVE_MS - 300);
    expect(gone.t - first.t).toBeLessThan(DISSOLVE_MS + 500);
    const going = frames.filter((f) => f.t >= first.t && f.t <= gone.t);
    expect(new Set(going.map((f) => f.cover)).size).toBeGreaterThan(20);
    going.forEach((f, i) =>
      expect(f.cover, `frame ${i}`).toBeLessThanOrEqual(
        going[i - 1]?.cover ?? 1,
      ),
    );
    // the cover is still in the page (it is the picture under a player that stops), only clear
    await expect(page.locator('.vid .vid-cover')).toHaveCount(1);
    await page.waitForTimeout(500);
    expect(await coverOpacity(page)).toBe(0);
  });

  test('a player that never comes: the cover simply stays, and nothing is reported', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      // (a request that fails is the browser's own line, not the page's: the refused script, a rate-limited API)
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text()))
        errors.push(m.text());
    });
    await stubVideo(page, { player: 'blocked' });
    const asked = apiRequests(page);
    await openPage(page, '/');
    await arrived(page);
    expect(asked.length).toBe(1);
    await page.waitForTimeout(SETTLE_MS + DISSOLVE_MS + 500);
    expect(await coverOpacity(page)).toBe(1);
    await expect(page.locator('.vid iframe')).toHaveCount(0);
    expect(await players(page)).toEqual([]);
    expect(errors).toEqual([]);
    // and the page goes on as ever
    await scrollToSection(page, '#overworld', 0);
    expect(await visibleScenes(page)).toEqual(['town']);
  });

  test('it plays only while it is seen: paused when the spawn scene has gone or the tab is hidden, playing again on return', async ({
    page,
  }) => {
    await openPage(page, '/');
    await arrived(page);
    await sayPlaying(page);
    const calls = async () => (await players(page))[0].calls;
    expect(await calls()).not.toContain('pauseVideo');
    // on to the Overworld: the spawn scene is switched off, and the player with it
    await scrollToSection(page, '#overworld', 0);
    expect(await visibleScenes(page)).toEqual(['town']);
    await expect.poll(calls).toContain('pauseVideo');
    const paused = (await calls()).length;
    // partway back the scene is showing again
    await scrollToSection(page, '#overworld', -0.6);
    await expect
      .poll(async () => (await calls()).slice(paused))
      .toContain('playVideo');
    await jumpTo(page, '.hero');
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    expect((await calls()).at(-1)).toBe('playVideo');
    // the tab is put away, and taken out again
    const hide = (hidden: boolean) =>
      page.evaluate((h) => {
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => h,
        });
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => (h ? 'hidden' : 'visible'),
        });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
    await hide(true);
    await expect.poll(async () => (await calls()).at(-1)).toBe('pauseVideo');
    await hide(false);
    await expect.poll(async () => (await calls()).at(-1)).toBe('playVideo');
    // one player all along
    expect(await players(page)).toHaveLength(1);
  });

  test('reduced motion: the cover, and no player', async ({ page }) => {
    const asked = apiRequests(page);
    await openPage(page, '/', { reducedMotion: true });
    await ready(page);
    await page.waitForTimeout(1500);
    expect(asked).toEqual([]);
    expect(await players(page)).toEqual([]);
    await expect(page.locator('.vid iframe')).toHaveCount(0);
    expect(await coverOpacity(page)).toBe(1);
    expect(
      await page
        .locator('.vid .vid-cover')
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    ).toBe(true);
  });

  test('a reader who saves data gets the cover, and no player', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        get: () => ({ saveData: true }),
      }),
    );
    const asked = apiRequests(page);
    await openPage(page, '/');
    await arrived(page);
    await page.waitForTimeout(1000);
    expect(asked).toEqual([]);
    expect(await players(page)).toEqual([]);
    expect(await coverOpacity(page)).toBe(1);
  });

  test('a crawler gets the cover, and no player', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    const asked = apiRequests(page);
    await openPage(page, '/');
    await arrived(page);
    await page.waitForTimeout(1000);
    expect(asked).toEqual([]);
    expect(await players(page)).toEqual([]);
    expect(await coverOpacity(page)).toBe(1);
    await context.close();
  });

  test('another language does not make another player', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await arrived(page);
    await sayPlaying(page);
    await setLanguage(page, 'en');
    await expect(page.locator('.hero .lead')).toContainText(/[a-z]{4}/);
    await setLanguage(page, 'zh_CN');
    await page.waitForTimeout(800);
    const all = await players(page);
    expect(all).toHaveLength(1);
    expect(all[0].destroyed).toBe(false);
    expect(all[0].calls).not.toContain('destroy');
    await expect(page.locator('.vid iframe')).toHaveCount(1);
    expect(
      (await page.locator('.vid iframe').getAttribute('title'))?.length,
    ).toBeGreaterThan(0);
  });

  test('leaving the page destroys the player; coming back builds it again', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await arrived(page);
    await sayPlaying(page);
    await page.locator('.dim-bar nav a[href="/member/"]').click();
    await page.locator('.person').first().waitFor();
    await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
    let all = await players(page);
    expect(all).toHaveLength(1);
    expect(all[0].destroyed).toBe(true);
    expect(all[0].calls.at(-1)).toBe('destroy');
    await expect(page.locator('iframe[data-stub]')).toHaveCount(0);
    // the link home: a new visit, at the top
    await page.locator('.head .crumb a').first().click();
    await ready(page);
    await expect.poll(async () => (await players(page)).length).toBe(2);
    all = await players(page);
    expect(all[1].destroyed).toBe(false);
    expect(all[1].connected).toBe(true);
    expect(all[1].playerVars).toEqual(PLAYER_VARS);
    await expect(page.locator('.vid iframe')).toHaveCount(1);
    expect(await coverOpacity(page)).toBe(1);
  });

  test('a player that was playing long before the loader lifted: the dissolve still waits for the arrival to finish', async ({
    page,
  }) => {
    test.slow();
    // the loader is held up by a slow cover, and the player plays under it all that time
    await stubVideo(page, {
      cover: (fulfil) => void setTimeout(() => void fulfil(), 4500),
    });
    await watchCover(page);
    // it says so by itself, the moment it is ready: under the loader, whatever the pace of this test
    await page.addInitScript(() => {
      const w = window as unknown as {
        __yt?: { live: { emit(state: number): void }[] };
        __playingAt?: number;
      };
      const wait = () => {
        const player = w.__yt?.live[0];
        if (!player) return void setTimeout(wait, 20);
        setTimeout(() => {
          w.__playingAt = performance.now();
          player.emit(1);
        }, 300);
      };
      wait();
    });
    await openPage(page, '/');
    await ready(page);
    const at = await page.evaluate(
      () => (window as unknown as { __playingAt: number }).__playingAt,
    );
    await expect
      .poll(() => coverOpacity(page), { timeout: 15_000 })
      .toBeLessThan(0.001);
    const frames = await coverFrames(page);
    const handed = frames.find((f) => f.ready)!.t;
    const first = frames.find((f) => f.cover < 1)!;
    expect(at).toBeLessThan(handed - 1000);
    // the settle was over before the arrival was: by itself it would have begun the dissolve in the middle of it
    expect(at + SETTLE_MS).toBeLessThan(handed + ARRIVAL_MS - 300);
    // not before the arrival has played out, and then at once: a beat of its own
    expect(first.t).toBeGreaterThan(handed + ARRIVAL_MS - 100);
    expect(first.t).toBeLessThan(handed + ARRIVAL_MS + 700);
    for (const f of frames.filter((f) => f.t < first.t))
      expect(f.cover).toBe(1);
    const gone = frames.find((f) => f.cover === 0)!;
    expect(gone.t - first.t).toBeGreaterThan(DISSOLVE_MS - 300);
    expect(gone.t - first.t).toBeLessThan(DISSOLVE_MS + 500);
  });

  test("away and back: the cover is over the player again before the hero shows, and stays through the player's settle", async ({
    page,
  }) => {
    test.slow();
    await openPage(page, '/');
    await arrived(page);
    await sayPlaying(page);
    await expect
      .poll(() => coverOpacity(page), { timeout: 12_000 })
      .toBeLessThan(0.001);
    // on to the Overworld: the scene is off, the player paused, and the cover whole again where nobody sees it
    await scrollToSection(page, '#overworld', 0);
    await expect(page.locator('.scene[data-scene="spawn"]')).toBeHidden();
    await expect.poll(() => coverOpacity(page)).toBe(1);
    // back: every frame in which the hero's scene shows at all has the cover whole
    await page.evaluate(() => {
      const w = window as unknown as { __back: [number, number][] };
      w.__back = [];
      const tick = () => {
        const scene = getComputedStyle(
          document.querySelector('.scene[data-scene="spawn"]')!,
        );
        w.__back.push([
          scene.visibility === 'hidden' ? 0 : +scene.opacity,
          +getComputedStyle(document.querySelector('.vid .vid-cover')!).opacity,
        ]);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await jumpTo(page, '.hero');
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    await expect
      .poll(async () => (await players(page))[0].calls.at(-1))
      .toBe('playVideo');
    // the player takes a moment, then plays, and shows its buttons again: the cover is over them for the settle
    await page.waitForTimeout(400);
    const at = Date.now();
    await playerState(page, 1);
    await page.waitForTimeout(SETTLE_MS - 600);
    const seen = await page.evaluate(
      () => (window as unknown as { __back: [number, number][] }).__back,
    );
    expect(seen.filter(([scene]) => scene > 0).length).toBeGreaterThan(30);
    for (const [scene, cover] of seen)
      if (scene > 0) expect(cover, `scene at ${scene}`).toBe(1);
    // and then it dissolves once more
    await expect
      .poll(() => coverOpacity(page), { timeout: 12_000 })
      .toBeLessThan(0.001);
    expect(Date.now() - at).toBeGreaterThan(SETTLE_MS + DISSOLVE_MS - 400);
  });

  test('the end of the video: the cover comes back over frames before it, stays through the restart, and dissolves again', async ({
    page,
  }) => {
    test.slow();
    await watchCover(page);
    await openPage(page, '/');
    await arrived(page);
    // twelve seconds of the video are left
    await expect.poll(async () => (await players(page)).length).toBe(1);
    await videoClock(page, 40, 28);
    const at = await sayPlaying(page);
    const left = 12_000;
    await expect
      .poll(() => coverOpacity(page), { timeout: 12_000 })
      .toBeLessThan(0.001);
    // before the end it is whole again (at the end the player shows a black frame, then its buttons)
    await page.waitForTimeout(at + left - 200 - (await now(page)));
    expect(await coverOpacity(page)).toBe(1);
    const frames = (await coverFrames(page)).filter((f) => f.t >= at);
    const clear = frames.find((f) => f.cover === 0)!;
    const returning = frames.filter(
      (f) => f.t > clear.t && f.cover > 0 && f.cover < 1,
    );
    expect(returning[0].t - at).toBeGreaterThan(left - LAP_LEAD_MS - 150);
    expect(returning[0].t - at).toBeLessThan(left - LAP_LEAD_MS + 500);
    expect(new Set(returning.map((f) => f.cover)).size).toBeGreaterThan(20);
    returning.forEach((f, i) =>
      expect(f.cover, `frame ${i}`).toBeGreaterThanOrEqual(
        returning[i - 1]?.cover ?? 0,
      ),
    );
    // the video ends and starts over: the cover does not move until the player has settled again
    await playerState(page, 0);
    await playerState(page, -1);
    await playerState(page, 3);
    await videoClock(page, 40, 0);
    const again = await sayPlaying(page);
    await page.waitForTimeout(SETTLE_MS - 500);
    expect(await coverOpacity(page)).toBe(1);
    await expect
      .poll(() => coverOpacity(page), { timeout: 12_000 })
      .toBeLessThan(0.001);
    const first = (await coverFrames(page)).find(
      (f) => f.t > again && f.cover < 1,
    )!;
    expect(first.t - again).toBeGreaterThan(SETTLE_MS - 50);
    expect(first.t - again).toBeLessThan(SETTLE_MS + 500);
    // a player that stalls in the middle and plays on is no reason for the cover to come back
    await videoClock(page, 40, 8);
    await playerState(page, 3);
    await playerState(page, 1);
    await page.waitForTimeout(1200);
    expect(await coverOpacity(page)).toBe(0);
  });

  test('arriving at #end: no player until the hero is shown', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const asked = apiRequests(page);
    await openPage(page, '/#end');
    await ready(page);
    await expect.poll(() => visibleScenes(page)).toEqual(['hall']);
    await page.waitForTimeout(1500);
    // the reader cannot see the hero: nothing was asked of YouTube but the cover
    expect(asked).toEqual([]);
    expect(await players(page)).toEqual([]);
    await expect(page.locator('.vid iframe')).toHaveCount(0);
    // up to the top: now it is made, once
    await jumpTo(page, '.hero');
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    await expect.poll(async () => (await players(page)).length).toBe(1);
    expect(asked).toHaveLength(1);
    expect((await players(page))[0].calls).not.toContain('pauseVideo');
    expect(await coverOpacity(page)).toBe(1);
  });
});
