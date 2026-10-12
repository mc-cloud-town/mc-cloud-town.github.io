'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import {
  MAP_RUN_S,
  MAP_SIZE,
  drawMap,
  planMap,
  plannedRun,
  seedLateness,
} from '@/lib/dimensions/loaderMap';
import { onNextTick } from '@/lib/dimensions/nextTick';
import { markWhole } from './World';

/** However slow the fonts or the first picture are, the loader lifts after this long. */
export const LOADER_TIMEOUT_MS = 6000;

/**
 * A reader for whom everything is there already (a return to the site, a reload, a step back to the home page from
 * another page of it) is not shown a loading at all: the loader is only its ground, and lifts as soon as the page
 * can be handed over. The map is shown only if something is still awaited this long after the script took over.
 * A map that is shown is played in full (MAP_RUN_S, two seconds), so the grace is on the generous side: a wait of
 * a third of a second on the bare ground is better than two seconds of a map nobody needed.
 */
export const MAP_GRACE_MS = 350;
/** With reduced motion the finished map, once shown, stays at least this long: a beat that can be read, not a flash. */
export const MAP_MIN_MS = 400;
/** It comes as a state changes (--t-state), in the ease of anything that arrives. */
const MAP_IN_S = 0.3;
/**
 * The lift of a loader that showed its map: the map opens onto the world for this long, and the ground goes in
 * the last tenth of a second of that and after. A loader without a map lifts by its ground alone.
 */
const MAP_OPENS_S = 0.6;
const GROUND_GOES_S = 0.9;
/**
 * How far into the lift of a loader with its map the ground begins to go. The hero's arrival is timed against the
 * ground (HomePage.tsx): after a lift without a map it begins this far in.
 */
export const GROUND_GOES_AT_S = MAP_OPENS_S - 0.1;
/**
 * What the map and the percentage show is one number: how much of what was still missing when the map appeared
 * has come since, by what it costs to fetch. What was in by then was never waited for and is not counted, so the
 * number starts at nothing and every point of it is something that arrived while the reader watched.
 * The costs are the sizes measured on this site (2026-10): a font file is about 250 kB (a face of a Chinese
 * typeface comes in slices; the first screen asks for about twenty, 5 MB in all), a picture the page is handed
 * over on about 130 kB (the hero's first picture is 121 kB, the pictures of the places further down 140 kB and
 * more). On a first visit the fonts are therefore nearly all of the number, and a picture a few points of it; on
 * a visit that has the fonts already, the picture is all of it. The browser does not say how much of a file has
 * come, so each counts when it is in (a picture: in and decoded).
 */
const FONT_FILE_KB = 250;
const PICTURE_KB = 130;
/**
 * Which font files are wanted is known only as the page is laid out: the fonts are counted by the files asked for
 * so far, looked up this often, and never as quite all of them until the browser says the fonts are ready (more
 * may still be asked for).
 */
const FONT_POLL_MS = 150;
const FONT_SHARE_MOST = 0.9;
/**
 * While something is on its way the number drifts on, so that it does not look frozen: by this small part of what
 * is still missing at the most, approached in about this long. It never claims what has not come.
 */
const DRIFT_SHARE = 0.12;
const DRIFT_MS = 2500;
/**
 * What the map shows is the lesser of two things: its planned run (loaderMap.ts: from nothing to the whole in
 * MAP_RUN_S, starting when it appears) and what has really come. Loading that is slow holds it back; loading that
 * is over early does not cut the run short. So it always starts at nothing, whatever is in by then, and is never
 * taken away unfinished. And it never jumps: when it has been held back and the rest comes at once, it catches up
 * at this many times the pace of the planned run at the most, easing into that pace.
 */
const CATCH_UP = 2;
const EASE_INTO_PER_S = 10;
/** The finished square holds for a beat before the lift. */
const HOLD_S = 0.18;
/** With reduced motion the finished map gives way in one brief fade. */
const REDUCED_FADE_S = 0.12;

/**
 * Which picture the hero stands on is decided by the hero (HeroVideo.tsx: YouTube's cover, or the site's own when
 * that cannot be had) and published on the picture as `data-cover`: `pending` until it is decided. Resolves once
 * it is; at once for any other picture.
 */
const decided = (img: HTMLImageElement) =>
  new Promise<void>((done) => {
    if (img.dataset.cover !== 'pending') return done();
    const watch = new MutationObserver(() => {
      if (img.dataset.cover === 'pending') return;
      watch.disconnect();
      done();
    });
    watch.observe(img, { attributes: true, attributeFilter: ['data-cover'] });
  });

/**
 * The picture is in and decoded, so the frame that first shows it does not wait for it; or it failed, which is no
 * reason to wait. For the hero's picture: the one the hero ends up with, not the one it started with.
 */
const loaded = (img: HTMLImageElement) =>
  decided(img).then(() =>
    img.decode().then(
      () => {},
      () => {},
    ),
  );

/**
 * A map of the world being generated: chunks pass through their stages from the centre outward
 * (loaderMap.ts), with the percentage above the map and one line below it. The map and the percentage are one
 * number: how much of what was missing when the map appeared has come since (see FONT_FILE_KB). What is drawn goes
 * with the number over its whole range, and the finished square is there at 100% and at nothing less; 100% is
 * said only when the wait is over.
 * The map, the percentage and the line are there only when there is something to wait for (MAP_GRACE_MS): the
 * served page shows the loader's ground alone (home.css), and so does a visit on which everything is in already.
 * A map that is shown is always played in full: from 0, up to the finished square at 100%, which holds for a beat
 * before the lift. Also when the wait is given up (LOADER_TIMEOUT_MS): the map then runs up to the whole and the
 * page is handed over without what has not come. With reduced motion nothing builds up: the map shown is the
 * finished one.
 * Calls onDone once the fonts and the first pictures are in (or given up on) and the map, if it was shown, is
 * finished: `plain` if the loader lifts without having shown a map. It lifts off the page, then removes itself. It is part of the
 * static markup, so it is the first thing painted; it starts once `reduced` is known.
 * Should this script never start, the served page is not left behind it: home.css takes the loader away after ten
 * seconds, and HomePage's `noscript` style at once where scripts are off.
 */
export const Loader = ({
  reduced,
  onDone,
}: {
  reduced: boolean | null;
  onDone: (plain: boolean) => void;
}) => {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el || reduced === null) return;
    // The fail-safe of the served page (home.css) has taken the loader away, or is doing so: this script came
    // too late to cover the page again. The page is handed over as it stands.
    const served = getComputedStyle(el);
    if (served.visibility === 'hidden' || +served.opacity < 1) {
      // This handover is not run through at once as the one in `lift` is: React builds the page when it next gets
      // round to it (`flushSync` cannot be used inside an effect). No cover is left to lift in step with it: the
      // script started ten seconds late, and the reader has the served page in front of them already.
      onDone(false);
      return;
    }
    // from here on the loader is this script's: the fail-safe is called off
    document.documentElement.dataset.live = '';
    const ctx = map.current?.getContext('2d');
    // per-chunk lateness: what makes the fronts ragged while loading (seeded here, never during render)
    const plan = planMap(seedLateness());
    /** What the map shows (0..1), and how fast it is moving (per second). */
    const st = { p: 0, v: 0 };
    const paint = () => {
      // (with the time: the chunks under way are at work whether the number moves or not)
      if (ctx)
        drawMap(ctx, st.p, plan, reduced ? undefined : performance.now());
      // (a hundred is the whole, never a rounding up to it)
      setPct(Math.floor(st.p * 100 + 1e-9));
    };

    let cancelled = false;
    /** The wait is over: everything is in, or it was given up. */
    let over = false;
    /** When the map was shown; null while it is not (and it may never be). */
    let shownAt: number | null = null;
    /** Calls off a lift that has not begun yet. */
    let unstarted: (() => void) | undefined;
    const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];
    // every picture that has an address by now: the first scene, and the place the reader arrives at
    // (World.tsx gives the others theirs when the loader has lifted)
    const pictures = () => [
      ...(el.parentElement?.querySelectorAll<HTMLImageElement>(
        '.world img[src]',
      ) ?? []),
    ];
    const awaited = pictures().map(loaded);
    let fontsIn = false;
    let picturesIn = 0;
    /** The font files asked for so far, and those of them that have come. */
    const fontFiles = () => {
      let asked = 0;
      let came = 0;
      document.fonts.forEach((face) => {
        if (face.status === 'unloaded') return;
        asked++;
        if (face.status !== 'loading') came++;
      });
      return { asked, came };
    };
    let files = fontFiles();
    /** What was in when the map appeared: that much is not counted. */
    let was = { fontsIn, picturesIn, files };
    /** How much of what was missing when the map appeared has come since, by cost. */
    const real = () => {
      // (the fonts are not ready: one file at the least is still to come, whether it has been asked for or not)
      const wanted = was.fontsIn
        ? 0
        : Math.max(1, files.asked - was.files.came);
      const came = fontsIn
        ? wanted
        : Math.min(files.came - was.files.came, wanted) * FONT_SHARE_MOST;
      const missing = awaited.length - was.picturesIn;
      const all = wanted * FONT_FILE_KB + missing * PICTURE_KB;
      return all
        ? (came * FONT_FILE_KB + (picturesIn - was.picturesIn) * PICTURE_KB) /
            all
        : 0;
    };

    /** The page is handed over, built and put in its place in that same step, and then the loader lifts off it. */
    const lift = () => {
      if (cancelled) return;
      gsap.ticker.remove(follow);
      // What is in by now stands whole when the cover goes: the fade of a late picture (home.css) is for one that
      // comes after this. A picture the loader gave up waiting for is not in, and fades in when it comes.
      pictures().forEach(markWhole);
      // At once, not when React next gets round to it: the page is built, put on the place the reader arrives at
      // and switched to its scene (HomePage's effect on `ready`: React runs the effects of a `flushSync` update
      // before it returns) before the first step of the lift. Otherwise the loader would already be going, over
      // the first scene, when the page is handed over.
      const plain = shownAt === null;
      flushSync(() => onDone(plain));
      el.style.pointerEvents = 'none'; // the page underneath is live from here on
      // The lift itself begins on the next tick: building the page took this one a while (a good second on a slow
      // device), and a lift begun before it would be found that far along, or over, when the next frame comes.
      unstarted = onNextTick(() => {
        const away = gsap.timeline({ onComplete: () => setGone(true) });
        tweens.push(away);
        if (reduced)
          return void away.to(el, {
            autoAlpha: 0,
            duration: REDUCED_FADE_S,
            ease: 'none',
          });
        // the map, if there is one, opens onto the world
        if (!plain)
          away.to(el.querySelector('.loader-in'), {
            opacity: 0,
            scale: 1.6,
            duration: MAP_OPENS_S,
            ease: 'power3.in',
          });
        away.to(
          el,
          { autoAlpha: 0, duration: GROUND_GOES_S, ease: 'power2.out' },
          plain ? 0 : GROUND_GOES_AT_S,
        );
      });
    };
    /** The lift, once the finished map has held for this long. */
    const hold = (beat: number) => {
      gsap.ticker.remove(follow);
      tweens.push(gsap.delayedCall(beat, lift));
    };
    /** How far the number has been told to go (it is never told to go back), since when, and where it is aimed. */
    let told = 0;
    let toldAt = 0;
    let aim = 0;
    /**
     * Every tick while the map is shown: the lesser of the planned run and what has come (which drifts a little
     * while it waits, and is the whole once the wait is over), approached without a jump. At the whole the
     * square holds, then the lift.
     */
    const follow = (_time: number, elapsed: number) => {
      const now = performance.now();
      if (shownAt === null) return;
      const at = Math.max(told, real());
      if (at !== told || !toldAt) {
        told = at;
        toldAt = now;
      }
      aim = over
        ? 1
        : Math.max(
            aim,
            at +
              DRIFT_SHARE *
                (1 - at) *
                (1 - Math.exp(-(now - toldAt) / DRIFT_MS)),
          );
      const goal = Math.min(plannedRun((now - shownAt) / 1000), aim);
      // (a long frame is not a long step)
      const s = Math.min(elapsed, 50) / 1000;
      const pace = Math.min(Math.max(0, goal - st.p) / s, CATCH_UP / MAP_RUN_S);
      st.v += (pace - st.v) * Math.min(1, EASE_INTO_PER_S * s);
      st.p = Math.min(goal, Math.max(st.p, st.p + st.v * s));
      if (st.p === goal) st.v = Math.min(st.v, pace);
      paint();
      if (st.p === 1) hold(HOLD_S);
    };
    /**
     * Something is still awaited after the grace: the map is shown, eased in, empty, and its run begins. With reduced motion it is the finished map, and nothing builds up to it.
     */
    const show = () => {
      if (cancelled || over) return;
      shownAt = performance.now();
      files = fontFiles();
      was = { fontsIn, picturesIn, files };
      if (reduced) st.p = 1;
      paint();
      tweens.push(
        gsap.to(el.querySelector('.loader-in'), {
          autoAlpha: 1,
          duration: reduced ? REDUCED_FADE_S : MAP_IN_S,
          ease: reduced ? 'none' : 'power3.out',
        }),
      );
      if (!reduced) gsap.ticker.add(follow);
    };
    /**
     * The wait is over: everything is in, or it has lasted long enough and the page is handed over without what
     * has not come. A loader that never showed its map lifts at once; one that did runs up to the whole first
     * (`follow`).
     */
    const complete = () => {
      if (cancelled || over) return;
      over = true;
      clearTimeout(giveUp);
      clearTimeout(grace);
      clearInterval(fonts);
      if (shownAt === null) return lift();
      if (reduced)
        hold(Math.max(0, MAP_MIN_MS - (performance.now() - shownAt)) / 1000);
    };
    const one = (settle: () => void) => () => {
      if (cancelled || over) return;
      settle();
      if (fontsIn && picturesIn === awaited.length) complete();
    };

    const grace = setTimeout(show, MAP_GRACE_MS);
    const giveUp = setTimeout(complete, LOADER_TIMEOUT_MS);
    const fonts = setInterval(() => {
      files = fontFiles();
    }, FONT_POLL_MS);
    void document.fonts.ready.then(
      one(() => {
        fontsIn = true;
      }),
    );
    awaited.forEach(
      (picture) =>
        void picture.then(
          one(() => {
            picturesIn++;
          }),
        ),
    );
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      clearTimeout(grace);
      clearInterval(fonts);
      unstarted?.();
      gsap.ticker.remove(follow);
      tweens.forEach((tween) => tween.kill());
    };
  }, [reduced, onDone]);

  if (gone) return null;
  return (
    <div className='loader' aria-hidden='true' ref={box}>
      <div className='loader-in'>
        <p className='pct'>{pct}%</p>
        <canvas ref={map} width={MAP_SIZE} height={MAP_SIZE} />
        <p className='stage'>{t('dimensions.hero.loading')}</p>
      </div>
    </div>
  );
};
