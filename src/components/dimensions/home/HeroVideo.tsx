'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { hashId } from '@/lib/dimensions/navigation';
import { recallHomePlace } from '@/lib/dimensions/homePlace';

/**
 * How long the cover stays after the player says it is playing. YouTube's player shows its own buttons in the
 * middle of the picture for about three and a half seconds after it starts; the cover is over them all that time.
 * (The approved demo's value. Not to be shortened below what hides those buttons.)
 */
export const SETTLE_MS = 4200;
/** Then the still becomes the moving picture: opacity only. */
export const DISSOLVE_S = 1.8;
const DISSOLVE_EASE = 'power2.inOut';
/**
 * How long before the video's end the cover begins to come back, in the dissolve's own time and ease: it is whole
 * half a second before the end. At its end the player shows a black frame and a spinner, and when it starts over
 * its buttons again, as at the first start.
 */
const LAP_LEAD_S = DISSOLVE_S + 0.5;

/**
 * How long YouTube's cover is given, from the moment the page's script takes over, before the site's own picture
 * takes its place. Where YouTube cannot be reached the request often does not fail, it hangs: without a budget the
 * loader would wait out its whole timeout and then lift on the scene's bare ground.
 */
export const COVER_BUDGET_MS = 2000;
/**
 * The site's own picture for the hero, used only when YouTube's cover cannot be had (refused, or over its budget).
 * It is the group photograph of the old hero, which is out of date: a frame of the video itself, supplied by the
 * team, should replace it here (put the file under public/assets/homePage/ and name it in this line).
 */
export const LOCAL_COVER = '/assets/members/CTEC_Members.webp';

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

  // the frame is named in the reader's language
  useEffect(() => {
    name.current = title;
    slot.current?.querySelector('iframe')?.setAttribute('title', title);
  }, [title]);

  // YouTube's cover, or else the site's own picture: whatever the reader's motion, connection or kind
  useEffect(() => {
    const still = cover.current;
    if (!still) return;
    const whole = () => still.complete && still.naturalWidth > 0;
    if (whole()) return;
    const fall = () => {
      settle();
      // (the cover may have come in the very last moment)
      if (!whole()) still.src = LOCAL_COVER;
    };
    const timer = window.setTimeout(fall, COVER_BUDGET_MS);
    const settle = () => {
      window.clearTimeout(timer);
      still.removeEventListener('load', settle);
      still.removeEventListener('error', fall);
    };
    // refused before this script ran: known already
    if (still.complete) return void fall();
    still.addEventListener('load', settle);
    still.addEventListener('error', fall);
    return settle;
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
      });
    };
    told.tell = plan;
    /** The cover is whole again and waits for the player to play anew. `at once` only where nobody sees it. */
    const recover = (atOnce: boolean) => {
      clearing?.kill();
      returning?.kill();
      clearing = returning = undefined;
      playingAt = null;
      if (atOnce) gsap.set(still, { opacity: 1 });
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
        void import('youtube-iframe').then((loader) =>
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
        src={coverOf(id)}
        alt=''
        fetchPriority='high'
      />
    </div>
  );
};
