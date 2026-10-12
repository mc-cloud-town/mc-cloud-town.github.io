'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { MAP_SIZE, drawMap, seedLateness } from '@/lib/dimensions/loaderMap';
import { onNextTick } from '@/lib/dimensions/nextTick';
import { markWhole } from './World';

/** However slow the fonts or the first picture are, the loader lifts after this long. */
export const LOADER_TIMEOUT_MS = 6000;

/**
 * A reader for whom everything is there already (a return to the site, a reload, a step back to the home page from
 * another page of it) is not shown a loading at all: the loader is only its ground, and lifts as soon as the page
 * can be handed over. The map is shown only if something is still awaited this long after the script took over, so
 * that a wait of a fraction of a second never flashes one…
 */
export const MAP_GRACE_MS = 200;
/** …and a map that has been shown stays at least this long before the lift begins: a beat that can be read. */
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
 * What the map shows is how much of what the loader waits for is in: the page's script (in when the loader starts),
 * the fonts, and each picture the page is to be handed over on. A few things, so the progress comes in steps: the
 * map eases to each step in this long (--t-in, with the ease of anything that arrives)…
 */
const STEP_S = 0.45;
const STEP_EASE = 'power3.out';
/**
 * …and while the next thing is still on its way it moves on slowly, by this much of the step that thing is worth
 * at the most, so it never looks frozen and never says more than is in.
 */
const CREEP_SHARE = 0.8;
/**
 * The fonts are many files (a face of a Chinese typeface comes in slices), and most of a first visit's wait: their
 * step is filled by how many of the files asked for so far are in, looked up this often. Never quite all of it:
 * more may be asked for until the browser says the fonts are ready.
 */
const FONT_POLL_MS = 150;
const FONT_SHARE_MOST = 0.9;
/** Once everything is in, it completes in this long, and the finished square holds for a beat. */
const FINISH_S = 0.35;
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
 * (loaderMap.ts), with the percentage above the map and the stage below it. The map and the percentage are one
 * number: the share of what the loader waits for that is in (see STEP_S). The line below says which of two things
 * is going on: the world's parts are still arriving ("building terrain"), or they are all in and the page is being
 * built and handed over ("entering the world").
 * The map, the percentage and the line are there only when there is something to wait for (MAP_GRACE_MS): the
 * served page shows the loader's ground alone (home.css), and so does a visit on which everything is in already.
 * Calls onDone once the fonts and the first pictures are in and the map, if it was shown, is finished: `plain` if
 * the loader lifts without having shown a map. It lifts off the page, then removes itself. It is part of the
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
  /** Everything is in (or given up on): the page is being built and handed over. */
  const [entering, setEntering] = useState(false);
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
    const startedAt = performance.now();
    const ctx = map.current?.getContext('2d');
    // per-chunk lateness: what makes the fronts ragged while loading (seeded here, never during render)
    const late = seedLateness();
    const st = { p: 0 };
    /** Everything is in, or the wait was given up. */
    let all = false;
    /** When the map was shown; null while it is not (and it may never be). */
    let shownAt: number | null = null;
    const paint = () => {
      if (ctx) drawMap(ctx, st.p, late);
      // (a hundred is said when everything is in, never by rounding up to it)
      setPct(
        all ? Math.round(st.p * 100) : Math.min(99, Math.floor(st.p * 100)),
      );
    };

    let cancelled = false;
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
    // What is waited for, each thing one step of the map. The script that runs this is the first, and it is in;
    // the fonts are the second (`fontShare`).
    const awaited: Promise<unknown>[] = [
      document.fonts.ready,
      ...pictures().map(loaded),
    ];
    const steps = awaited.length + 1;
    let inNow = 1;
    let fontsIn = false;
    /** How much of the fonts' step is in: the share of the font files asked for so far that have come. */
    const fontShare = () => {
      if (fontsIn || reduced) return 0;
      let asked = 0;
      let came = 0;
      document.fonts.forEach((face) => {
        if (face.status === 'unloaded') return;
        asked++;
        if (face.status !== 'loading') came++;
      });
      return asked ? (came / asked) * FONT_SHARE_MOST : 0;
    };
    /** How far the map has been told to go: it is never told to go back. */
    let told = 0;

    /** The page is handed over, built and put in its place in that same step, and then the loader lifts off it. */
    const lift = () => {
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
    /**
     * The map eases to what is in now, then moves on slowly from there, for as long as the wait can last at the
     * most: by a part of one step, and never to the end. With reduced motion it stands at each step, without the
     * way between.
     */
    const advance = () => {
      if (shownAt === null) return;
      const at = Math.max(told, (inNow + fontShare()) / steps);
      if (at === told) return;
      told = at;
      gsap.killTweensOf(st);
      if (reduced) {
        st.p = at;
        return paint();
      }
      const creep = () =>
        void tweens.push(
          gsap.to(st, {
            p: at + CREEP_SHARE * Math.min(1 / steps, 1 - at),
            duration: Math.max(
              1,
              (LOADER_TIMEOUT_MS - (performance.now() - startedAt)) / 1000,
            ),
            ease: 'power2.out',
            onUpdate: paint,
          }),
        );
      tweens.push(
        gsap.to(st, {
          p: Math.max(st.p, at),
          duration: STEP_S,
          ease: STEP_EASE,
          onUpdate: paint,
          onComplete: creep,
        }),
      );
    };
    /**
     * Something is still awaited after the grace: the map is shown, eased in, and builds up from nothing to what
     * is in by now.
     */
    const show = () => {
      if (cancelled || all) return;
      shownAt = performance.now();
      paint();
      tweens.push(
        gsap.to(el.querySelector('.loader-in'), {
          autoAlpha: 1,
          duration: reduced ? REDUCED_FADE_S : MAP_IN_S,
          ease: reduced ? 'none' : STEP_EASE,
        }),
      );
      advance();
    };
    /**
     * Everything is in, or the wait is given up. A loader that never showed its map lifts at once. Otherwise the
     * last chunks finish and the square holds for a beat (and until the map has been there for its minimum), then
     * the lift.
     */
    const complete = () => {
      if (cancelled || all) return;
      all = true;
      clearTimeout(giveUp);
      clearTimeout(grace);
      clearInterval(fonts);
      if (shownAt === null) return lift();
      const since = shownAt;
      setEntering(true);
      gsap.killTweensOf(st);
      const hold = () =>
        void tweens.push(
          gsap.delayedCall(
            Math.max(
              reduced ? 0 : HOLD_S,
              (MAP_MIN_MS - (performance.now() - since)) / 1000,
            ),
            lift,
          ),
        );
      if (reduced) {
        // the finished map, and nothing builds up to it
        st.p = 1;
        paint();
        return hold();
      }
      tweens.push(
        gsap.to(st, {
          p: 1,
          duration: FINISH_S,
          ease: 'power2.out',
          onUpdate: paint,
          onComplete: hold,
        }),
      );
    };

    const grace = setTimeout(show, MAP_GRACE_MS);
    const fonts = setInterval(() => {
      if (!all && !fontsIn) advance();
    }, FONT_POLL_MS);
    awaited.forEach(
      (one, i) =>
        void one.then(() => {
          if (cancelled || all) return;
          if (i === 0) fontsIn = true;
          inNow++;
          if (inNow === steps) complete();
          else advance();
        }),
    );
    const giveUp = setTimeout(complete, LOADER_TIMEOUT_MS);
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      clearTimeout(grace);
      clearInterval(fonts);
      unstarted?.();
      gsap.killTweensOf(st);
      tweens.forEach((tween) => tween.kill());
    };
  }, [reduced, onDone]);

  if (gone) return null;
  return (
    <div className='loader' aria-hidden='true' ref={box}>
      <div className='loader-in'>
        <p className='pct'>{pct}%</p>
        <canvas ref={map} width={MAP_SIZE} height={MAP_SIZE} />
        <p className='stage'>
          {t(entering ? 'dimensions.hero.entering' : 'dimensions.hero.loading')}
        </p>
      </div>
    </div>
  );
};
