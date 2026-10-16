'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { MAP_SIZE, core } from '@/lib/dimensions/loaderMap';
import { onNextTick } from '@/lib/dimensions/nextTick';
import { fontSheetIn } from '#/dimensions/FontSheet';
import { markWhole } from './World';

/** However slow the fonts or the first picture are, the loader lifts after this long. */
export const LOADER_TIMEOUT_MS = 6000;

/**
 * A reader for whom everything is there already (a return to the site, a reload, a step back to the home page from
 * another page of it) is not shown a loading at all: the loader is only its ground, and lifts as soon as the page
 * can be handed over. The map is shown only if something is still awaited this long after the script took over.
 * A map that is shown is played in full (MAP_RUN_S, two seconds). (The number is the shared source's:
 * loaderCore.ts, which says as well who is taken to be such a reader before this script has come.)
 */
export const MAP_GRACE_MS = core.MAP_GRACE_MS;
/** With reduced motion the finished map, once shown, stays at least this long: a beat that can be read, not a flash. */
export const MAP_MIN_MS = 400;
/** It comes as a state changes (--t-state), in the ease of anything that arrives. */
const MAP_IN_S = core.MAP_IN_S;
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
 * has come since, by what it costs to fetch (loaderCore.ts, which has the rule, the costs of the script files and
 * of the fonts, and how the number moves). What only this script knows is added to it here: the pictures the page
 * is handed over on, about 130 kB each (the hero's first picture is 121 kB, the pictures of the places further
 * down 140 kB and more), each counted when it is in and decoded…
 */
const PICTURE_KB = 130;
/** …and the list of names the credits are made of (`settled`, below): a small file. */
const NAMES_KB = 20;
/** The finished square holds for a beat before the lift. */
const HOLD_S = core.HOLD_S;
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
 * (A picture that cannot be decoded yet is not one that failed: the browser may refuse to decode one that has
 * only just been given its address. Such a picture is waited for until it has come, or has failed to.)
 */
const loaded = (img: HTMLImageElement) =>
  decided(img).then(() =>
    img.decode().then(
      () => {},
      () =>
        img.complete
          ? undefined
          : new Promise<void>((done) => {
              img.addEventListener('load', () => done(), { once: true });
              img.addEventListener('error', () => done(), { once: true });
            }),
    ),
  );

/**
 * The fonts are in: their stylesheet (which the home page asks for without waiting for it, FontSheet.tsx), and
 * then every file of them that the page as it is laid out asks for.
 */
const fontsAreIn = () => fontSheetIn().then(() => document.fonts.ready);

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
 *
 * This script is the heaviest thing a reader on a slow line waits for, and the loader does not wait for it to
 * begin: the served page shows the map and runs it by a small script of its own (LoaderBoot.tsx, loaderCore.ts),
 * from the first frame that is painted. What this script finds on the loader it was served with is therefore a run
 * under way, and it takes that run over as it stands: the same map, the same number, no second beginning. To what
 * is counted it adds what only it knows, and it ends the run as it always did. Only a reader known to have
 * everything is served the ground alone, and so is one who steps here from another page of the site (the served
 * script does not run then).
 * Should this script never start, the served page is not left behind the loader: the served script gives it up
 * after a while (BOOT_LIMIT_MS), home.css takes the loader away after ten seconds where not even that has run,
 * and HomePage's `noscript` style at once where scripts are off.
 */
export const Loader = ({
  reduced,
  settled,
  onDone,
}: {
  reduced: boolean | null;
  /**
   * The page has the shape it will be handed over in: false while something that changes the height of the page
   * above the place the reader arrives at is still on its way (the names of the credits, on an arrival further
   * down). The loader waits for it like for a picture, so that it never lifts on a place that is about to move.
   */
  settled: boolean;
  onDone: (plain: boolean) => void;
}) => {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLCanvasElement>(null);
  const said = useRef<HTMLParagraphElement>(null);
  const [gone, setGone] = useState(false);
  /** What the effect below needs of `settled`: how it is now, and whom to tell when it comes true. */
  const shape = useRef({ settled, tell: () => {} });
  useEffect(() => {
    shape.current.settled = settled;
    if (settled) shape.current.tell();
  }, [settled]);

  // The block of the map is in the served page for all to see (home.css): a loader shows its map. Where the served
  // script has not been at work on this very loader (a step here from another page of the site), nothing is known
  // to be waited for, and the block is put away before the first frame, until it turns out to be needed.
  useLayoutEffect(() => {
    if (window.__ctecLoader?.el !== box.current)
      gsap.set(box.current?.querySelector('.loader-in') ?? null, {
        autoAlpha: 0,
      });
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || reduced === null) return;
    /** The run the served script began on this loader, if it did. */
    const begun = window.__ctecLoader?.el === el ? window.__ctecLoader : null;
    // The fail-safe of the served page (home.css) has taken the loader away, or is doing so: this script came
    // too late to cover the page again. The page is handed over as it stands.
    // (Or the served script has given this one up, and the loader is going: home.css, `data-boot`.)
    const served = getComputedStyle(el);
    if (begun?.gone || served.visibility === 'hidden' || +served.opacity < 1) {
      // This handover is not run through at once as the one in `lift` is: React builds the page when it next gets
      // round to it (`flushSync` cannot be used inside an effect). No cover is left to lift in step with it: the
      // script started ten seconds late, and the reader has the served page in front of them already.
      onDone(false);
      return;
    }
    // from here on the loader is this script's: the fail-safe is called off
    document.documentElement.dataset.live = '';
    const ctx = map.current?.getContext('2d');
    const block = el.querySelector<HTMLElement>('.loader-in');
    /**
     * The run: the one the served script began, taken over as it stands (its map, its number, what it has
     * counted), or a new one (its per-chunk lateness seeded here, never during render).
     */
    const run = begun ?? core.newRun(el, reduced);
    run.taken = true;
    run.reduced = reduced;
    const paint = () => core.paint(run, ctx, said.current, performance.now());

    let cancelled = false;
    const startedAt = performance.now();
    let lastWait: ReturnType<typeof setTimeout> | undefined;
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
    // what is waited for besides the fonts, each with what it costs: the pictures, and the page's shape
    const awaited = [
      ...pictures().map((img) => ({ in: loaded(img), kb: PICTURE_KB })),
      {
        in: new Promise<void>((done) => {
          if (shape.current.settled) done();
          else shape.current.tell = done;
        }),
        kb: NAMES_KB,
      },
    ];
    /** How many of them are in. (What they cost goes to the run's count, missing until each is in.) */
    let othersIn = 0;
    awaited.forEach((other) => (run.othersAll += other.kb));

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
      const plain = run.shownAt === null;
      flushSync(() => onDone(plain));
      // this browser has what the page is made of from here on: the next visit need not be shown a loading
      try {
        localStorage.setItem(
          core.WARM_KEY,
          JSON.stringify({
            build: process.env.NEXT_PUBLIC_BUILD_ID ?? '',
            at: Date.now(),
          }),
        );
      } catch {
        // (no storage: the next visit shows its map, which is never wrong)
      }
      // The page is on its place now, and it is known for certain which scene the loader lifts on. Should a
      // picture of that scene not be in (the place a return remembers is written down while the reader scrolls,
      // and may name the scene before), the lift waits for it: never beyond the loader's own limit.
      const showing = pictures().filter((img) => {
        if (img.complete) return false;
        const scene = img.closest('.scene');
        const c = scene && getComputedStyle(scene);
        return Boolean(c && c.visibility !== 'hidden' && +c.opacity > 0.5);
      });
      const left = LOADER_TIMEOUT_MS - (performance.now() - startedAt);
      if (showing.length && left > 0)
        return void Promise.race([
          Promise.all(showing.map(loaded)),
          new Promise((done) => (lastWait = setTimeout(done, left))),
        ]).then(() => {
          if (cancelled) return;
          clearTimeout(lastWait);
          showing.forEach(markWhole);
          away(plain);
        });
      away(plain);
    };
    /** The loader goes: the map, if there is one, opens onto the world, and the ground fades. */
    const away = (plain: boolean) => {
      el.style.pointerEvents = 'none'; // the page underneath is live from here on
      // The lift itself begins on the next tick: building the page took this one a while (a good second on a slow
      // device), and a lift begun before it would be found that far along, or over, when the next frame comes.
      unstarted = onNextTick(() => {
        const going = gsap.timeline({ onComplete: () => setGone(true) });
        tweens.push(going);
        if (reduced)
          return void going.to(el, {
            autoAlpha: 0,
            duration: REDUCED_FADE_S,
            ease: 'none',
          });
        // the map, if there is one, opens onto the world
        // (should the served script have eased the block in, that easing is not to follow this one)
        if (block) block.style.transition = 'none';
        if (!plain)
          going.to(block, {
            opacity: 0,
            scale: 1.6,
            duration: MAP_OPENS_S,
            ease: 'power3.in',
          });
        going.to(
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
    /**
     * Every tick while the map is shown: one step of the run (loaderCore.ts). At the whole the square holds, then
     * the lift.
     */
    const follow = () => {
      if (run.shownAt === null) return;
      core.advance(run, performance.now());
      paint();
      if (run.p === 1) hold(HOLD_S);
    };
    /**
     * Something is still awaited after the grace: the map is shown, eased in, empty, and its run begins. With reduced motion it is the finished map, and nothing builds up to it.
     */
    const show = () => {
      if (cancelled || run.over || run.shownAt !== null) return;
      core.show(run, performance.now());
      paint();
      tweens.push(
        gsap.to(block, {
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
      if (cancelled || run.over) return;
      run.over = true;
      clearTimeout(giveUp);
      clearTimeout(grace);
      if (run.shownAt === null) return lift();
      if (reduced)
        hold(
          Math.max(0, MAP_MIN_MS - (performance.now() - run.shownAt)) / 1000,
        );
    };
    const one = (settle: () => void) => () => {
      if (cancelled || run.over) return;
      settle();
      if (run.fontsIn && othersIn === awaited.length) complete();
    };

    // A run that is under way goes on from the next tick. Where no map is shown, it is if something is still
    // awaited after the grace.
    const grace =
      run.shownAt === null ? setTimeout(show, MAP_GRACE_MS) : undefined;
    if (run.shownAt !== null && !reduced) gsap.ticker.add(follow);
    const giveUp = setTimeout(complete, LOADER_TIMEOUT_MS);
    void fontsAreIn().then(
      one(() => {
        run.fontsIn = true;
      }),
    );
    awaited.forEach(
      (other) =>
        void other.in.then(
          one(() => {
            othersIn++;
            run.othersIn += other.kb;
          }),
        ),
    );
    return () => {
      cancelled = true;
      clearTimeout(lastWait);
      clearTimeout(giveUp);
      clearTimeout(grace);
      unstarted?.();
      gsap.ticker.remove(follow);
      tweens.forEach((tween) => tween.kill());
    };
  }, [reduced, onDone]);

  if (gone) return null;
  return (
    <div className='loader' aria-hidden='true' ref={box}>
      {/* (the served script is at work on these two before this one has come: its styles and its number stand) */}
      <div className='loader-in' suppressHydrationWarning>
        <p className='pct' ref={said} suppressHydrationWarning>
          0%
        </p>
        <canvas ref={map} width={MAP_SIZE} height={MAP_SIZE} />
        <p className='stage'>{t('dimensions.hero.loading')}</p>
      </div>
    </div>
  );
};
