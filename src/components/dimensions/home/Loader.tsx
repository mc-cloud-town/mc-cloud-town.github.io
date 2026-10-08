'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { MAP_SIZE, drawMap, seedLateness } from '@/lib/dimensions/loaderMap';

/** However slow the fonts or the first picture are, the loader lifts after this long. */
export const LOADER_TIMEOUT_MS = 6000;

/** The map builds this far on its own, in this many seconds… */
const BUILD_TO = 0.82;
const BUILD_S = 1.5;
/** …then creeps towards this while the page's resources are still arriving, so it never looks frozen… */
const CREEP_TO = 0.95;
/** …and says so, if they take longer than this. */
const ENTERING_AFTER_MS = 600;
/** Once everything is in, it completes in this long, and the finished square holds for a beat. */
const FINISH_S = 0.35;
const HOLD_S = 0.18;
/** With reduced motion the finished map gives way in one brief fade. */
const REDUCED_FADE_S = 0.12;

const loaded = (img: HTMLImageElement | null) =>
  !img || img.complete
    ? Promise.resolve()
    : new Promise<void>((done) => {
        img.addEventListener('load', () => done(), { once: true });
        img.addEventListener('error', () => done(), { once: true });
      });

/**
 * A map of the world being generated: chunks pass through their stages from the centre outward
 * (loaderMap.ts), with the percentage above the map and the stage below it.
 * Calls onDone once the fonts and the first scene are in and the map is finished, lifts off the page, then
 * removes itself. It is part of the static markup, so it is the first thing painted; it starts once `reduced` is known.
 */
export const Loader = ({
  reduced,
  onDone,
}: {
  reduced: boolean | null;
  onDone: () => void;
}) => {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(0);
  /** The map is built and the page's resources are still on their way. */
  const [entering, setEntering] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el || reduced === null) return;
    const ctx = map.current?.getContext('2d');
    // per-chunk lateness: what makes the fronts ragged while loading (seeded here, never during render)
    const late = seedLateness();
    const st = { p: reduced ? 1 : 0 };
    const draw = () => ctx && drawMap(ctx, st.p, late);
    const paint = () => {
      draw();
      setPct(Math.round(st.p * 100));
    };
    draw();

    let cancelled = false;
    let built = false;
    let arrived = false;
    let giveUp: ReturnType<typeof setTimeout> | undefined;
    let label: ReturnType<typeof setTimeout> | undefined;
    const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];
    const assets = Promise.race([
      Promise.all([
        document.fonts.ready,
        loaded(
          el.parentElement?.querySelector<HTMLImageElement>(
            '.scene.is-first img',
          ) ?? null,
        ),
      ]),
      new Promise((done) => (giveUp = setTimeout(done, LOADER_TIMEOUT_MS))),
    ]);

    /** The page is handed over (it is built behind the loader from here on), and the loader lifts off it. */
    const lift = () => {
      onDone();
      el.style.pointerEvents = 'none'; // the page underneath is live from here on
      const away = gsap.timeline({ onComplete: () => setGone(true) });
      tweens.push(away);
      if (reduced)
        return away.to(el, {
          autoAlpha: 0,
          duration: REDUCED_FADE_S,
          ease: 'none',
        });
      // the map opens onto the world
      away
        .to(el.querySelector('.loader-in'), {
          opacity: 0,
          scale: 1.6,
          duration: 0.6,
          ease: 'power3.in',
        })
        .to(el, { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, '-=.1');
    };
    /** Everything is in: the last chunks finish, the square holds for a beat, then the lift. */
    const complete = () => {
      clearTimeout(label);
      gsap.killTweensOf(st);
      tweens.push(
        gsap.to(st, {
          p: 1,
          duration: FINISH_S,
          ease: 'power2.out',
          onUpdate: paint,
          onComplete: () => tweens.push(gsap.delayedCall(HOLD_S, lift)),
        }),
      );
    };

    if (!reduced)
      tweens.push(
        gsap.to(st, {
          p: BUILD_TO,
          duration: BUILD_S,
          ease: 'power1.inOut',
          onUpdate: paint,
          onComplete: () => {
            built = true;
            if (arrived) return complete();
            label = setTimeout(() => setEntering(true), ENTERING_AFTER_MS);
            // as long as the wait can last at the most: it is cut short the moment the resources are in
            tweens.push(
              gsap.to(st, {
                p: CREEP_TO,
                duration: LOADER_TIMEOUT_MS / 1000 - BUILD_S,
                ease: 'power1.out',
                onUpdate: paint,
              }),
            );
          },
        }),
      );
    assets.then(() => {
      if (cancelled) return;
      arrived = true;
      // reduced motion: the finished map is already there, nothing builds up
      if (reduced) lift();
      else if (built) complete();
    });
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      clearTimeout(label);
      gsap.killTweensOf(st);
      tweens.forEach((tween) => tween.kill());
    };
  }, [reduced, onDone]);

  if (gone) return null;
  return (
    <div className='loader' aria-hidden='true' ref={box}>
      <div className='loader-in'>
        {/* with reduced motion the map is drawn finished, once */}
        <p className='pct'>{reduced ? 100 : pct}%</p>
        <canvas ref={map} width={MAP_SIZE} height={MAP_SIZE} />
        <p className='stage'>
          {t(entering ? 'dimensions.hero.entering' : 'dimensions.hero.loading')}
        </p>
      </div>
    </div>
  );
};
