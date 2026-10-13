import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

/**
 * The hero's video without YouTube. No test reaches it: the cover (the video's own still) is served from a file
 * of this repository, the player's script is a stand-in that records what the page asks of it, and whatever else
 * would go to YouTube is refused.
 */

/** The still the hero stands on: the video's own cover, kept here so that the hero is read on its real picture. */
const COVER_FILE = path.resolve('tests/fixtures/hero-cover.jpg');
/** Where the cover is asked for. */
export const COVER_URL = /img\.youtube\.com\/vi\/[\w-]+\/maxresdefault\.jpg/;
/** Where the player's script is asked for. */
export const API_URL = /youtube\.com\/iframe_api/;
/** Anything of YouTube's. */
const YOUTUBE =
  /youtube\.com|youtube-nocookie\.com|ytimg\.com|googlevideo\.com/;

export const VIDEO = { id: 'FCtztiDl_rE', start: 9 };
/** What the player is asked for: the approved demo's variables. */
export const PLAYER_VARS = {
  autoplay: 1,
  controls: 0,
  mute: 1,
  loop: 1,
  playlist: VIDEO.id,
  playsinline: 1,
  fs: 0,
  iv_load_policy: 3,
  modestbranding: 1,
  rel: 0,
  disablekb: 1,
  start: VIDEO.start,
};

/** One player the page has made, as the stand-in recorded it. */
export interface StubPlayer {
  /** the domain the player was asked to come from */
  host: string | undefined;
  videoId: string;
  playerVars: Record<string, unknown>;
  /** the frame stood in the document when the player was made, and stands there now */
  connected: boolean;
  destroyed: boolean;
  /** what the page called on it, in order */
  calls: string[];
}

/**
 * The stand-in for YouTube's script. `new YT.Player(element, options)` puts a frame in the element's place, as
 * the real one does, and writes itself down on `window.__yt`. It reports "ready" by itself; it plays only when
 * the test says so (`playing`), and then reports state 1 like the real one. How long the video is and how far it
 * has played are what the test last said (`videoClock`); 0 and 0 until then, as for a video not yet known.
 */
const STUB = `(() => {
  const log = (window.__yt = window.__yt || { players: [], live: [], loads: 0 });
  log.loads++;
  // asked for a second time in the same document, the real script does nothing: nobody is told it is ready again
  if (window.YT) return;
  class Player {
    constructor(el, opts) {
      const host = typeof el === 'string' ? document.getElementById(el) : el;
      const frame = document.createElement('iframe');
      frame.id = host.id || 'yt-stub-' + log.players.length;
      frame.setAttribute('data-stub', '');
      frame.setAttribute('allow', 'autoplay; encrypted-media');
      host.replaceWith(frame);
      this.frame = frame;
      this.opts = opts;
      this.state = -1;
      this.record = {
        host: opts.host,
        videoId: opts.videoId,
        playerVars: { ...opts.playerVars },
        connected: frame.isConnected,
        destroyed: false,
        calls: [],
      };
      log.players.push(this.record);
      log.live.push(this);
      setTimeout(() => {
        if (!this.record.destroyed) opts.events?.onReady?.({ target: this });
      }, 0);
    }
    playVideo() {
      this.record.calls.push('playVideo');
    }
    pauseVideo() {
      this.record.calls.push('pauseVideo');
      if (this.state === 1) this.emit(2);
    }
    mute() {
      this.record.calls.push('mute');
    }
    unloadModule(name) {
      this.record.calls.push('unloadModule:' + name);
    }
    getIframe() {
      return this.frame;
    }
    getPlayerState() {
      return this.state;
    }
    getDuration() {
      return log.duration ?? 0;
    }
    getCurrentTime() {
      return log.time ?? 0;
    }
    destroy() {
      this.record.calls.push('destroy');
      this.record.destroyed = true;
      this.record.connected = false;
      this.frame.remove();
    }
    emit(state) {
      this.state = state;
      this.opts.events?.onStateChange?.({ data: state, target: this });
    }
  }
  window.YT = { Player, PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } };
  window.onYouTubeIframeAPIReady?.();
})();`;

const stubbed = new WeakSet<Page>();

/**
 * Keep the page off YouTube. Called by `openPage` for every page it opens; a test that goes to the home page by
 * itself, or wants something else than the default, calls it first (the first call for a page stands).
 *   cover   'file': the still is served from this repository; 'blocked': it is refused at once; or a handler of
 *           the test's own, which is given the way to serve it and the way to refuse it (to do either later)
 *   player  'stub': the stand-in; 'blocked': the script never comes
 */
export const stubVideo = async (
  page: Page,
  {
    cover = 'file',
    player = 'stub',
  }: {
    cover?:
      | 'file'
      | 'blocked'
      | ((fulfil: () => Promise<void>, refuse: () => Promise<void>) => void);
    player?: 'stub' | 'blocked';
  } = {},
) => {
  if (stubbed.has(page)) return;
  stubbed.add(page);
  // (the route registered last is asked first: the two particular ones come after the general one)
  await page.route(YOUTUBE, (route) =>
    // (a link of the page that leads to YouTube is the test's own business: only what the page loads is refused)
    route.request().isNavigationRequest() &&
    route.request().frame() === page.mainFrame()
      ? route.fallback()
      : route.abort(),
  );
  await page.route(COVER_URL, (route) => {
    const fulfil = () =>
      route.fulfill({
        contentType: 'image/jpeg',
        body: fs.readFileSync(COVER_FILE),
      });
    if (cover === 'blocked') return route.abort();
    if (cover === 'file') return fulfil();
    return cover(fulfil, () => route.abort());
  });
  await page.route(API_URL, (route) =>
    player === 'blocked'
      ? route.abort()
      : route.fulfill({ contentType: 'text/javascript', body: STUB }),
  );
};

/** The players the page has made so far. */
export const players = (page: Page): Promise<StubPlayer[]> =>
  page.evaluate(
    () =>
      (window as unknown as { __yt?: { players: StubPlayer[] } }).__yt
        ?.players ?? [],
  );

/** The last player says it is playing (state 1), as YouTube's does once the picture moves. */
export const playing = (page: Page) =>
  page.evaluate(() => {
    const live = (
      window as unknown as { __yt: { live: { emit(state: number): void }[] } }
    ).__yt.live;
    live[live.length - 1].emit(1);
  });

/** Opacity of the cover, as it is drawn. */
export const coverOpacity = (page: Page) =>
  page
    .locator('.vid .vid-cover')
    .evaluate((el) => +getComputedStyle(el).opacity);

/** Say how long the video is and how far it has played, in seconds: what the player answers from now on. */
export const videoClock = (page: Page, duration: number, time: number) =>
  page.evaluate(
    ([d, t]) => {
      const log = window as unknown as {
        __yt: { duration: number; time: number };
      };
      log.__yt.duration = d;
      log.__yt.time = t;
    },
    [duration, time],
  );

/** The last player reports a state: 0 ended, 1 playing, 2 paused, 3 buffering, -1 not started. */
export const playerState = (page: Page, state: number) =>
  page.evaluate((st) => {
    const live = (
      window as unknown as { __yt: { live: { emit(state: number): void }[] } }
    ).__yt.live;
    live[live.length - 1].emit(st);
  }, state);
