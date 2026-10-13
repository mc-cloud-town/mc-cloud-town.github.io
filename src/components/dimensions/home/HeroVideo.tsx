'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { hashId } from '@/lib/dimensions/navigation';
import { recallHomePlace } from '@/lib/dimensions/homePlace';
import {
  COVER_BUDGET_MS,
  DISSOLVE_S,
  LAP_LEAD_S,
  SETTLE_MS,
} from '@/constants/heroVideo';

const DISSOLVE_EASE = 'power2.inOut';
/**
 * The site's own picture for the hero, used only when YouTube's cover cannot be had (refused, or over its budget).
 * It is the group photograph of the old hero, which is out of date: a frame of the video itself, supplied by the
 * team, should replace it here (put the file under public/assets/homePage/ and name it in this line).
 */
export const LOCAL_COVER = '/assets/members/CTEC_Members.webp';
/** A picture that comes after the page was handed over eases in: as long as anything that arrives late (--t-in). */
const LATE_IN_S = 0.45;

/** The player's state for "the picture is moving" (YT.PlayerState.PLAYING). */
const PLAYING = 1;

/** As much of YouTube's player as is used here. */
interface Player {
  playVideo(): void;
  pauseVideo(): void;
  getDuration(): number;
  getCurrentTime(): number;
  destroy(): void;
}
interface PlayerOptions {
  host: string;
  videoId: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady: () => void;
    onStateChange: (e: { data: number }) => void;
  };
}
interface YouTube {
  Player: new (el: HTMLElement, options: PlayerOptions) => Player;
}

/** The video's own still, as YouTube serves it. */
export const coverOf = (id: string) =>
  `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

/**
 * No player for a crawler (the test of the old site's HeaderVideo), nor for a reader who has asked the browser to
 * save data: they get the cover.
 */
const wantsVideo = () =>
  !/bot|crawl|spider|googlebot/i.test(navigator.userAgent) &&
  !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData;

/**
 * The hero's background: the anniversary video, as in docs/design-demos/dimensions-v3-video.html.
 * One enlarged, centred box (home.css) holds YouTube's player and, over it, the video's own still. The box is
 * larger than the screen, so the player's title bar and controls fall outside it. The still is the first picture
 * of the page: it is in the served markup, the loader waits for it and lifts on it, and with scripts off, with
 * reduced motion, for a crawler, for a reader who saves data, or when the player never comes, it is all there is.
 * Where YouTube's cover itself cannot be had, the site's own picture stands in its place (LOCAL_COVER), asked for
 * only then; the loader waits for that one instead (Loader.tsx), so it lifts on a picture and in good time.
 *
 * The player is made in the browser only, when the hero is first shown: at once (under the loader) for a reader
 * who arrives at the top; for one who arrives further down the page (an address that names a section, a return
 * to where they were), not before they come up to the hero. It plays only while it is seen: it is paused when
 * the spawn scene is switched off (the scene changes do that through the layer's inline visibility, as for the
 * portals) or the tab is hidden, and plays again on return.
 *
 * The cover is over the player whenever the player shows something of its own, and only ever moves as a dissolve:
 *   - from the start until the player has played for SETTLE_MS, and never before the hero's arrival has played
 *     out (`arrived`): the dissolve is a beat of its own, after the arrival, not in the middle of it;
 *   - while the player is paused. It is put back while nobody can see it (the scene is off, or the tab), so a
 *     reader who comes back finds the still, and the picture moves again once the player has settled anew
 *     (told to play again, it shows its buttons for as long as at the start);
 *   - from just before the video's end until the next round has settled (LAP_LEAD_S).
 */
export const HeroVideo = ({
  id,
  start,
  title,
  reduced,
  arrived,
}: {
  id: string;
  start: number;
  /** the frame's accessible name (it is hidden from assistive technology all the same) */
  title: string;
  /** null until the browser has been asked */
  reduced: boolean | null;
  /** the hero's arrival, which follows the loader, has played out */
  arrived: boolean;
}) => {
  const box = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLImageElement>(null);
  const name = useRef(title);
  /** What the player's effect needs of the arrival: whether it is over, and whom to tell when it is. */
  const arrival = useRef({ over: arrived, tell: () => {} });
  /**
   * What the picture's effect and the player's effect need of each other: the cover is clear for the video
   * (`clear`), the picture is awaited after the handover (`late`), clear until it eases in, and a cover that
   * came late may take the local picture's place now that the video is showing (`adopt`).
   */
  const hand = useRef({ clear: false, late: false, adopt: () => {} });

  // the frame is named in the reader's language
  useEffect(() => {
    name.current = title;
    slot.current?.querySelector('iframe')?.setAttribute('title', title);
  }, [title]);

  // Which picture is the hero's first picture: YouTube's cover, or else the site's own. Decided here and nowhere
  // else, whatever the reader's motion, connection or kind, and published on the picture itself (`data-cover`):
  // the loader waits until it is decided, and then for the picture it was decided for (Loader.tsx).
  useEffect(() => {
    const still = cover.current,
      root = still?.closest<HTMLElement>('.dim'),
      scene = still?.closest<HTMLElement>('.scene');
    if (!still || !root) return;
    const state = hand.current;
    const own = coverOf(id);
    let gone = false;
    let timer: number | undefined;
    let easing: gsap.core.Tween | undefined;
    const whole = () => still.complete && still.naturalWidth > 0;
    const decided = () => still.dataset.cover !== 'pending';
    const decide = (as: 'youtube' | 'local') => {
      window.clearTimeout(timer);
      if (as === 'local') still.src = LOCAL_COVER;
      // (after the address: whoever reads the decision finds the picture it is about)
      still.dataset.cover = as;
    };
    // A cover that was only slow is not thrown away for good: it is asked for again behind the local picture,
    // and takes that picture's place the next time the still is not what the reader is looking at (the video is
    // showing, the scene is switched off, the tab is put away, or no picture has come at all yet). Never in
    // sight: one still does not turn into another before the reader's eyes. From then on it stays.
    let late: HTMLImageElement | null = null;
    const unseen = () =>
      document.hidden ||
      state.late ||
      (scene ? getComputedStyle(scene).visibility === 'hidden' : false) ||
      (state.clear && +getComputedStyle(still).opacity === 0);
    const adopt = () => {
      if (gone || !late || still.dataset.cover !== 'local' || !unseen()) return;
      late = null;
      away.disconnect();
      document.removeEventListener('visibilitychange', adopt);
      state.adopt = () => {};
      still.src = own;
      still.dataset.cover = 'youtube';
    };
    const away = new MutationObserver(adopt);
    const askAgain = () => {
      const again = new Image();
      again.referrerPolicy = 'no-referrer';
      again.onload = () =>
        void again
          .decode()
          .catch(() => undefined)
          .then(() => {
            if (gone || again.naturalWidth === 0) return;
            late = again;
            if (scene)
              away.observe(scene, {
                attributes: true,
                attributeFilter: ['style'],
              });
            document.addEventListener('visibilitychange', adopt);
            state.adopt = adopt;
            adopt();
          });
      again.src = own;
    };
    const onLoad = () => {
      if (!decided()) return decide('youtube');
      // A picture that comes after the page was handed over (the loader gave up waiting for it): it eases in, in
      // the time and curve of anything that arrives late on this page. Unless the video is showing by now.
      if (!state.late) return;
      state.late = false;
      if (state.clear) return;
      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      easing = gsap.to(still, {
        opacity: 1,
        duration: reduced ? 0.12 : LATE_IN_S,
        ease: reduced ? 'none' : 'power3.out',
      });
    };
    const onError = () => {
      // (of the local picture: nothing more to try)
      if (!decided()) decide('local');
    };
    // Handed over without its picture: until that comes the picture is clear, so that it has somewhere to ease
    // in from (a picture that is not there yet draws nothing either way).
    const onHandover = () => {
      if (root.dataset.ready !== 'true') return;
      watch.disconnect();
      if (!decided() || whole() || state.clear) return;
      state.late = true;
      gsap.set(still, { opacity: 0 });
    };
    const watch = new MutationObserver(onHandover);
    still.addEventListener('load', onLoad);
    still.addEventListener('error', onError);
    if (!decided()) {
      // came, or was refused, before this script ran: known already
      if (whole()) decide('youtube');
      else if (still.complete) decide('local');
      else
        timer = window.setTimeout(() => {
          if (gone || decided()) return;
          // (the cover may have come in the very last moment)
          if (whole()) return decide('youtube');
          decide('local');
          // over its budget is not refused: it may still come
          askAgain();
        }, COVER_BUDGET_MS);
    }
    watch.observe(root, { attributes: true, attributeFilter: ['data-ready'] });
    onHandover();
    return () => {
      gone = true;
      window.clearTimeout(timer);
      watch.disconnect();
      away.disconnect();
      document.removeEventListener('visibilitychange', adopt);
      state.adopt = () => {};
      easing?.kill();
      still.removeEventListener('load', onLoad);
      still.removeEventListener('error', onError);
    };
  }, [id]);

  useEffect(() => {
    arrival.current.over = arrived;
    arrival.current.tell();
  }, [arrived]);

  useEffect(() => {
    const host = slot.current,
      still = cover.current,
      scene = box.current?.closest<HTMLElement>('.scene'),
      root = box.current?.closest<HTMLElement>('.dim');
    if (reduced !== false || !host || !still || !scene || !root) return;
    if (!wantsVideo()) return;
    // (the same object for as long as the component lives)
    const told = arrival.current;
    const state = hand.current;

    // Where the reader arrives, in the order sectionJumps.ts lands by: until the page is handed over the scene
    // layers say nothing yet (the first one is simply there, under the loader).
    const back = recallHomePlace();
    const hash = hashId(window.location.hash);
    const atTop = back
      ? back.section === 0
      : !(
          hash &&
          hash !== 'top' &&
          root.querySelector(`[id="${CSS.escape(hash)}"]`)
        );

    let gone = false;
    let asked = false;
    let player: Player | null = null;
    let usable = false;
    let seen = false;
    /** Since when the player has been playing, this time round; null while the cover has no reason to go. */
    let playingAt: number | null = null;
    /** The cover going (after the settle), the cover coming back, and the wait for the end of the video. */
    let clearing: gsap.core.Tween | undefined;
    let returning: gsap.core.Tween | undefined;
    let lap: gsap.core.Tween | undefined;

    /** The still becomes the moving picture: once the player's own buttons have gone, and the arrival is over. */
    const plan = () => {
      if (gone || playingAt === null || clearing || !told.over) return;
      returning?.kill();
      returning = undefined;
      clearing = gsap.to(still, {
        opacity: 0,
        duration: DISSOLVE_S,
        ease: DISSOLVE_EASE,
        delay: Math.max(0, playingAt + SETTLE_MS - performance.now()) / 1000,
        onStart: () => {
          state.clear = true;
        },
        onComplete: () => state.adopt(),
      });
    };
    told.tell = plan;
    /** The cover is whole again and waits for the player to play anew. `at once` only where nobody sees it. */
    const recover = (atOnce: boolean) => {
      clearing?.kill();
      returning?.kill();
      clearing = returning = undefined;
      playingAt = null;
      state.clear = false;
      // (a picture that is still awaited stays clear until it comes and eases in)
      if (atOnce) gsap.set(still, { opacity: state.late ? 0 : 1 });
      else
        returning = gsap.to(still, {
          opacity: 1,
          duration: DISSOLVE_S,
          ease: DISSOLVE_EASE,
        });
    };
    /** How much of the video is left, in seconds; null while the player does not know. */
    const left = () => {
      const all = player?.getDuration?.() ?? 0,
        at = player?.getCurrentTime?.() ?? 0;
      return all > 0 ? all - at : null;
    };

    /** The frame is scenery: not for the keyboard, not for assistive technology. */
    const dress = () => {
      const frame = host.querySelector('iframe');
      if (!frame) return;
      frame.setAttribute('tabindex', '-1');
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('title', name.current);
    };
    const create = (YT: YouTube) => {
      if (gone || player) return;
      // the player puts its frame in the place of the element it is given: one of our own making, not React's
      const mount = document.createElement('div');
      host.replaceChildren(mount);
      player = new YT.Player(mount, {
        // the player's own domain without cookies: the video is scenery, nobody is to be followed for it
        host: 'https://www.youtube-nocookie.com',
        videoId: id,
        // the approved demo's settings
        playerVars: {
          autoplay: 1,
          controls: 0,
          mute: 1,
          loop: 1,
          playlist: id,
          playsinline: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          disablekb: 1,
          start,
        },
        events: {
          onReady: () => {
            if (gone) return;
            usable = true;
            dress();
            // it starts by itself (autoplay); not for a reader who has moved on meanwhile
            if (!seen) player?.pauseVideo();
          },
          onStateChange: ({ data }) => {
            if (gone || data !== PLAYING) return;
            // it began to play after the reader had moved on
            if (!seen) return player?.pauseVideo();
            // (every time it plays on, after a stall as well: the end is measured from where the video is now)
            lap?.kill();
            lap = undefined;
            const rest = left();
            if (rest !== null) {
              // too near the end to settle, clear and come back: the cover waits for the next round
              if (
                playingAt === null &&
                rest < SETTLE_MS / 1000 + DISSOLVE_S + LAP_LEAD_S
              )
                return;
              lap = gsap.delayedCall(Math.max(0, rest - LAP_LEAD_S), () =>
                recover(false),
              );
            }
            if (playingAt !== null) return;
            playingAt = performance.now();
            plan();
          },
        },
      });
      dress();
    };
    /** Is the hero's scene on the screen, in a tab that is looked at? */
    const sync = () => {
      const live = root.dataset.ready === 'true';
      const on =
        // (the first scene is shown by the stylesheet; a scene change switches it off and on inline)
        scene.style.visibility !== 'hidden' && scene.style.opacity !== '0';
      const now = (live ? on : atTop) && !document.hidden;
      if (now === seen) return;
      seen = now;
      if (seen && !asked) {
        asked = true;
        // youtube-iframe touches window when it is loaded: in the browser only, never during the export
        // Its `load` is called on the module itself (`default`), not on what `import()` hands out around it:
        // the loader keeps on itself that the script has come, and what is handed out is made anew each time.
        // Asked on a new one, a return to this page asked for YouTube's script again, which answers only once.
        void import('youtube-iframe').then(({ default: loader }) =>
          loader.load((YT: YouTube) => create(YT)),
        );
      }
      if (!seen) {
        // nobody is looking: the still is back at once, and the player rests under it
        lap?.kill();
        lap = undefined;
        recover(true);
      }
      if (!usable) return;
      if (seen) player?.playVideo();
      else player?.pauseVideo();
    };
    const watch = new MutationObserver(sync);
    watch.observe(scene, { attributes: true, attributeFilter: ['style'] });
    watch.observe(root, { attributes: true, attributeFilter: ['data-ready'] });
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      gone = true;
      watch.disconnect();
      document.removeEventListener('visibilitychange', sync);
      told.tell = () => {};
      clearing?.kill();
      returning?.kill();
      lap?.kill();
      gsap.set(still, { clearProps: 'opacity' });
      try {
        player?.destroy();
      } catch {
        // a player that was never ready has nothing to take down
      }
      host.replaceChildren();
    };
  }, [id, start, reduced]);

  return (
    <div className='vid' ref={box}>
      {/* React leaves this element's content alone: the player's frame is put here by the effect above.
          Not `inert`: what is inert on this page is what is held (the page under the sheet, a closed list), and
          the frame is kept out of the keyboard's way and the pointer's by its own attributes and the box's style. */}
      <div className='vid-player' ref={slot} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className='vid-cover'
        ref={cover}
        // which picture this is to be is not decided yet (the effect above decides, and says so here)
        data-cover='pending'
        // (YouTube need not be told which page asks for the picture)
        referrerPolicy='no-referrer'
        src={coverOf(id)}
        alt=''
        fetchPriority='high'
      />
    </div>
  );
};
