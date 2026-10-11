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
import {
  ARRIVAL_S,
  COVER_BUDGET_MS,
  DISSOLVE_S,
  LAP_LEAD_S,
  SETTLE_MS,
} from '../src/constants/heroVideo';

/** The component's own times (src/constants/heroVideo.ts), in milliseconds. */
const DISSOLVE_MS = DISSOLVE_S * 1000;
const LAP_LEAD_MS = LAP_LEAD_S * 1000;
/** How long the hero's arrival lasts from the hand-over. */
const ARRIVAL_MS = ARRIVAL_S * 1000;
/** Same as LOADER_TIMEOUT_MS in src/components/dimensions/home/Loader.tsx. */
const LOADER_TIMEOUT_MS = 6000;

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
  /** the loader marked the picture as there whole when it lifted */
  whole: boolean;
  /** the picture's address */
  src: string;
  /** how much of the spawn scene's layer shows: 0 while it is switched off */
  scene: number;
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
          whole: (cover as HTMLElement).dataset.whole !== undefined,
          src: cover.getAttribute('src') ?? '',
          scene: (() => {
            const c = getComputedStyle(cover.closest('.scene')!);
            return c.visibility === 'hidden' ? 0 : +c.opacity;
          })(),
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
    // a cover that takes its time, inside its budget: the loader is up meanwhile
    await stubVideo(page, {
      cover: (fulfil) => void setTimeout(() => void fulfil(), 1200),
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
    // (the cover was held for 1.2 s: it is not in before that)
    expect(frames.find((f) => f.in)!.t).toBeGreaterThan(1100);
    for (const f of waiting) {
      expect(f.ready).toBe(false);
      expect(f.loader).toBe(1);
    }
    const handed = frames.filter((f) => f.ready);
    expect(handed.length).toBeGreaterThan(0);
    for (const f of handed) expect(f.in).toBe(true);
    for (const f of frames) expect(f.cover).toBe(1);
    // under the loader, before the page is handed over: the one player is there already
    expect(
      frames.filter((f) => f.players === 1 && !f.ready && f.loader === 1)
        .length,
    ).toBeGreaterThan(3);
    expect(Math.max(...frames.map((f) => f.players))).toBe(1);
    expect(await visibleScenes(page)).toEqual(['spawn']);
  });

  /** From the first frame: when the page's script took over, when the cover's address changed, and to what. */
  const watchFallback = (page: Page) =>
    page.addInitScript(() => {
      const w = window as unknown as {
        __fallback: { liveAt?: number; at?: number; src?: string };
      };
      w.__fallback = {};
      const arm = () => {
        const img = document.querySelector('.vid .vid-cover');
        if (!img) return void requestAnimationFrame(arm);
        new MutationObserver(() => {
          w.__fallback.at ??= performance.now();
          w.__fallback.src = img.getAttribute('src') ?? '';
        }).observe(img, { attributes: true, attributeFilter: ['src'] });
        const live = () => {
          if (!document.documentElement.hasAttribute('data-live'))
            return void requestAnimationFrame(live);
          w.__fallback.liveAt = performance.now();
        };
        live();
      };
      arm();
    });
  const fallback = (page: Page) =>
    page.evaluate(
      () =>
        (
          window as unknown as {
            __fallback: { liveAt?: number; at?: number; src?: string };
          }
        ).__fallback,
    );
  /** The picture the hero stands on, as it is at this moment. */
  const coverNow = (page: Page) =>
    page.locator('.vid .vid-cover').evaluate((img: HTMLImageElement) => ({
      in: img.complete && img.naturalWidth > 0,
      opacity: +getComputedStyle(img).opacity,
      src: img.currentSrc,
    }));

  test("YouTube refused (cover and player): the loader lifts on the site's own picture, not on bare ground", async ({
    page,
  }) => {
    await stubVideo(page, { cover: 'blocked', player: 'blocked' });
    await watchCover(page);
    await watchFallback(page);
    await openPage(page, '/');
    await ready(page);
    const cover = await coverNow(page);
    expect(cover.src).toMatch(/\/assets\/members\/CTEC_Members\.webp$/);
    expect(cover.in).toBe(true);
    expect(cover.opacity).toBe(1);
    // the page was not handed over before that picture was in: the loader waited for it in the cover's place
    const frames = await coverFrames(page);
    const handed = frames.filter((f) => f.ready);
    expect(handed.length).toBeGreaterThan(0);
    for (const f of handed) expect(f.in).toBe(true);
    // refused is known at once: the local picture is asked for without waiting out the budget
    const seen = await fallback(page);
    expect(seen.src).toBe('/assets/members/CTEC_Members.webp');
    expect(seen.at! - seen.liveAt!).toBeLessThan(COVER_BUDGET_MS - 500);
    // and it stays: nothing plays
    await page.waitForTimeout(1500);
    expect((await coverNow(page)).opacity).toBe(1);
    // a cover that was refused is not asked for again: away and back, the picture is still the site's own
    await scrollToSection(page, '#overworld', 0);
    await jumpTo(page, '.hero');
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    expect((await coverNow(page)).src).toMatch(/CTEC_Members\.webp$/);
    await expect(page.locator('.vid .vid-cover')).toHaveAttribute(
      'data-cover',
      'local',
    );
    await expect(page.locator('.vid iframe')).toHaveCount(0);
  });

  test('a cover that never answers gets its budget, then the local picture; the loader does not wait out its six seconds', async ({
    page,
  }) => {
    await stubVideo(page, {
      cover: () => {
        // never answered
      },
    });
    await watchCover(page);
    await watchFallback(page);
    await openPage(page, '/');
    await ready(page);
    const seen = await fallback(page);
    expect(seen.src).toBe('/assets/members/CTEC_Members.webp');
    // about two seconds after the page's script took over
    // (the budget runs from the first effect of the page, the mark is set a moment after it)
    expect(seen.at! - seen.liveAt!).toBeGreaterThan(COVER_BUDGET_MS - 700);
    expect(seen.at! - seen.liveAt!).toBeLessThan(COVER_BUDGET_MS + 1200);
    const cover = await coverNow(page);
    expect(cover.src).toMatch(/CTEC_Members\.webp$/);
    expect(cover.in).toBe(true);
    const frames = await coverFrames(page);
    const handed = frames.filter((f) => f.ready);
    for (const f of handed) expect(f.in).toBe(true);
    // The picture is in soon after, long before the loader's own timeout: it is no longer what the loader waits
    // for. (When the loader then lifts is the fonts' affair as well, which this test does not hold.)
    const inAt = frames.find((f) => f.in)!.t;
    expect(inAt - seen.liveAt!).toBeLessThan(COVER_BUDGET_MS + 1500);
    expect(COVER_BUDGET_MS + 1500).toBeLessThan(LOADER_TIMEOUT_MS - 2000);
    // the player is still tried, and if it plays the local picture gives way to it as the cover would
    await arrived(page);
    await sayPlaying(page);
    await expect
      .poll(() => coverOpacity(page), { timeout: 12_000 })
      .toBeLessThan(0.001);
  });

  /** The site's own picture is held back: it comes when the returned function is called. */
  const holdLocal = async (page: Page) => {
    const held: (() => Promise<void>)[] = [];
    let open = false;
    await page.route('**/assets/members/CTEC_Members.webp', (route) => {
      if (open) return route.continue();
      held.push(() => route.continue());
    });
    return async () => {
      open = true;
      await Promise.all(held.map((go) => go().catch(() => {})));
    };
  };
  /** Open the home page, and do `then` a moment after the page's script has taken over. */
  const openAnd = async (page: Page, after: number, then: () => unknown) => {
    const opening = openPage(page, '/');
    await page.locator('html[data-live]').waitFor({ state: 'attached' });
    await page.waitForTimeout(after);
    await then();
    await opening;
  };
  /** From the handover on, the hero stands on the site's own picture, whole, in every frame. */
  const expectLiftedOnLocal = async (page: Page) => {
    const frames = await coverFrames(page);
    const handed = frames.filter((f) => f.ready);
    expect(handed.length).toBeGreaterThan(10);
    const bare = handed.filter(
      (f) => !f.in || !f.whole || f.cover !== 1 || !/CTEC_Members/.test(f.src),
    );
    expect(
      bare.length,
      `frames after the handover without the picture whole: ${JSON.stringify(bare[0])}`,
    ).toBe(0);
  };

  test("the cover fails a second after the script took over, the site's own picture is slow: the loader waits for it", async ({
    page,
  }) => {
    let refuse = () => Promise.resolve();
    await stubVideo(page, {
      cover: (_fulfil, no) => void (refuse = no),
      player: 'blocked',
    });
    const release = await holdLocal(page);
    await watchCover(page);
    await openAnd(page, 800, () => {
      void refuse();
      setTimeout(() => void release(), 3000);
    });
    await ready(page);
    await page.waitForTimeout(600);
    await expectLiftedOnLocal(page);
    // the loader was up while the picture was on its way: more than three seconds after the script took over
    const frames = await coverFrames(page);
    expect(
      frames.filter((f) => !f.ready && f.loader === 1).length,
    ).toBeGreaterThan(60);
  });

  test("the cover stalls past its budget, the site's own picture is slow: the loader waits for it", async ({
    page,
  }) => {
    await stubVideo(page, {
      cover: () => {
        // never answered
      },
      player: 'blocked',
    });
    const release = await holdLocal(page);
    await watchCover(page);
    // (the budget is two seconds: the picture comes a second and a half after it is asked for)
    await openAnd(page, COVER_BUDGET_MS + 1500, () => release());
    await ready(page);
    await page.waitForTimeout(600);
    await expectLiftedOnLocal(page);
  });

  test("neither picture comes: the loader lifts at its timeout, and the site's own picture eases in when it does come", async ({
    page,
  }) => {
    test.slow();
    await stubVideo(page, {
      cover: () => {
        // never answered
      },
      player: 'blocked',
    });
    const release = await holdLocal(page);
    await watchCover(page);
    await openPage(page, '/');
    await page
      .locator('.dim[data-ready="true"]')
      .waitFor({ timeout: LOADER_TIMEOUT_MS + 6000 });
    await expect(page.locator('.loader')).toHaveCount(0);
    // the hero is on its ground, and the picture is not marked as whole
    const before = await coverFrames(page);
    const handed = before.filter((f) => f.ready);
    expect(handed.length).toBeGreaterThan(10);
    for (const f of handed) expect(f.in).toBe(false);
    const from = await now(page);
    await release();
    await expect
      .poll(async () => (await coverNow(page)).in, { timeout: 10_000 })
      .toBe(true);
    await expect.poll(() => coverOpacity(page)).toBe(1);
    const after = (await coverFrames(page)).filter((f) => f.t >= from);
    // from the first frame it can be drawn in, it rises: never a frame in which it is simply there
    const drawn = after.filter((f) => f.in);
    expect(drawn[0].cover).toBeLessThan(0.2);
    const rising = drawn.map((f) => f.cover);
    expect(new Set(rising.filter((o) => o > 0 && o < 1)).size).toBeGreaterThan(
      4,
    );
    rising.forEach((o, i) =>
      expect(o, `frame ${i}`).toBeGreaterThanOrEqual(rising[i - 1] ?? 0),
    );
    for (const f of after) expect(f.whole).toBe(false);
  });

  /** YouTube's cover is held back, however often it is asked for, until `release` is called; then it comes. */
  const heldCover = () => {
    const held: (() => Promise<void>)[] = [];
    let open = false;
    return {
      handler: (fulfil: () => Promise<void>) => {
        if (open) return void fulfil().catch(() => {});
        held.push(fulfil);
      },
      release: () => {
        open = true;
        held.forEach((go) => void go().catch(() => {}));
      },
    };
  };
  /** No frame in which one still takes the place of another before the reader's eyes. */
  const expectNoVisibleSwap = async (page: Page) => {
    const frames = (await coverFrames(page)).filter((f) => f.ready);
    const swaps = frames.filter((f, i) => i > 0 && f.src !== frames[i - 1].src);
    for (const f of swaps)
      expect(
        f.scene === 0 || f.cover === 0,
        `the picture changed in sight: ${JSON.stringify(f)}`,
      ).toBe(true);
    return swaps.length;
  };

  test("a cover that is only slow: the loader lifts on the site's own picture, and YouTube's cover takes over once the video is showing", async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 1440, height: 900 });
    // the cover comes a second and a half after its budget has run out
    const cover = heldCover();
    await stubVideo(page, { cover: cover.handler });
    await watchCover(page);
    await openAnd(page, COVER_BUDGET_MS + 1500, cover.release);
    await ready(page);
    // lifted on the local picture, whole
    const lifted = await coverNow(page);
    expect(lifted.src).toMatch(/CTEC_Members\.webp$/);
    expect(lifted.in).toBe(true);
    await arrived(page);
    // the cover has come by now, and the local picture is still what stands there: nothing changes in sight
    await page.waitForTimeout(1500);
    expect((await coverNow(page)).src).toMatch(/CTEC_Members\.webp$/);
    expect(await coverOpacity(page)).toBe(1);
    // the video takes over; under it, the cover becomes YouTube's
    await sayPlaying(page);
    await expect
      .poll(() => coverOpacity(page), { timeout: 12_000 })
      .toBeLessThan(0.001);
    await expect
      .poll(async () => (await coverNow(page)).src)
      .toMatch(COVER_URL);
    await expect(page.locator('.vid .vid-cover')).toHaveAttribute(
      'data-cover',
      'youtube',
    );
    // away and back: the still the reader returns to is YouTube's cover, and it stays
    await scrollToSection(page, '#overworld', 0);
    await expect.poll(() => coverOpacity(page)).toBe(1);
    await jumpTo(page, '.hero');
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    const back = await coverNow(page);
    expect(back.src).toMatch(COVER_URL);
    expect(back.in).toBe(true);
    expect(back.opacity).toBe(1);
    expect(await expectNoVisibleSwap(page)).toBe(1);
  });

  test("a slow cover and no video: the site's own picture stays while it is looked at, and gives way to the cover behind the reader's back", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const cover = heldCover();
    await stubVideo(page, { cover: cover.handler, player: 'blocked' });
    await watchCover(page);
    await openAnd(page, COVER_BUDGET_MS + 1500, cover.release);
    await arrived(page);
    await page.waitForTimeout(2500);
    // the cover came long ago; the picture in front of the reader has not been changed for it
    const there = await coverNow(page);
    expect(there.src).toMatch(/CTEC_Members\.webp$/);
    expect(there.opacity).toBe(1);
    // the reader moves on: the scene is off, and now it is YouTube's
    await scrollToSection(page, '#overworld', 0);
    await expect(page.locator('.scene[data-scene="spawn"]')).toBeHidden();
    await expect
      .poll(async () => (await coverNow(page)).src)
      .toMatch(COVER_URL);
    await jumpTo(page, '.hero');
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    const back = await coverNow(page);
    expect(back.src).toMatch(COVER_URL);
    expect(back.in).toBe(true);
    expect(back.opacity).toBe(1);
    expect(await expectNoVisibleSwap(page)).toBe(1);
  });

  test("YouTube's cover in time: it stays the hero's picture, the local one never takes its place", async ({
    page,
  }) => {
    await watchFallback(page);
    await openPage(page, '/');
    await arrived(page);
    await page.waitForTimeout(COVER_BUDGET_MS + 500);
    // (the address of the cover never changed)
    expect((await fallback(page)).src).toBeUndefined();
    const cover = await coverNow(page);
    expect(cover.src).toMatch(COVER_URL);
    expect(cover.in).toBe(true);
  });

  test("exactly one player, with the demo's settings, in a frame that takes neither the pointer nor the focus", async ({
    page,
  }) => {
    await openPage(page, '/');
    await arrived(page);
    const all = await players(page);
    expect(all).toHaveLength(1);
    expect(all[0].videoId).toBe(VIDEO.id);
    expect(all[0].host).toBe('https://www.youtube-nocookie.com');
    await expect(page.locator('.vid .vid-cover')).toHaveAttribute(
      'referrerpolicy',
      'no-referrer',
    );
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
    // The loader is up for two seconds at the least (its map builds, finishes and holds), and the player plays
    // under it all that time. (The cover takes a moment, inside its budget: this is not about the local picture.)
    await stubVideo(page, {
      cover: (fulfil) => void setTimeout(() => void fulfil(), 800),
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
        }, 0);
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
    // on YouTube's own cover throughout
    for (const f of frames) expect(f.src).toMatch(COVER_URL);
    // the settle was over before the arrival was: by itself it would have begun the dissolve in the middle of it
    expect(at + SETTLE_MS).toBeLessThan(handed + ARRIVAL_MS - 300);
    // Not before the arrival has played out, and then at once: a beat of its own. (The arrival begins when the
    // page has been built, which follows the hand-over by as long as the build takes: up to a second and more
    // when the machine is busy. So the end of the arrival is no earlier than this, and not much later.)
    expect(first.t).toBeGreaterThan(handed + ARRIVAL_MS - 100);
    expect(first.t).toBeLessThan(handed + ARRIVAL_MS + 2000);
    // by then the camera has long settled
    expect(frames.find((f) => f.t >= first.t)!.cam).toBe(1);
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

  test('a return to a remembered place below the hero: no player until the hero is shown', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, '/');
    await arrived(page);
    await expect.poll(async () => (await players(page)).length).toBe(1);
    // read on to the End, long enough for the place to be written down, and load the page again
    await scrollToSection(page, '#end', 0.2);
    expect(await visibleScenes(page)).toEqual(['hall']);
    await page.waitForTimeout(400);
    const asked = apiRequests(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    await expect.poll(() => visibleScenes(page)).toEqual(['hall']);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(900);
    await page.waitForTimeout(1500);
    // (a new document: what the stand-in wrote down before is gone with the old one)
    expect(asked).toEqual([]);
    expect(await players(page)).toEqual([]);
    await expect(page.locator('.vid iframe')).toHaveCount(0);
    await jumpTo(page, '.hero');
    await expect.poll(() => visibleScenes(page)).toEqual(['spawn']);
    await expect.poll(async () => (await players(page)).length).toBe(1);
    expect(asked).toHaveLength(1);
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
