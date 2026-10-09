'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  COVER_WAIT_OUT_MS,
  clearCover,
  prefersReducedMotion,
  registerCover,
  registerCoverWait,
} from '@/lib/dimensions/navigation';
import { MAP_SIZE, drawMap, seedLateness } from '@/lib/dimensions/loaderMap';

/** The waiting map builds towards this, ever more slowly: it never looks finished, and never stands still. */
const WAIT_TO = 0.95;
/** After this many milliseconds it is about two thirds of the way there. */
const WAIT_PACE_MS = 4000;

/**
 * The sign of life on a cover that has been whole for long: a small version of the home loader's map of the world
 * being generated (the same drawing, loaderMap.ts) with the loader's own "entering the world" under it.
 * It exists only while it is shown, and draws only then. With reduced motion: the finished map, still.
 */
const CoverWait = ({ leaving }: { leaving: boolean }) => {
  const { t } = useTranslation();
  const map = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = map.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    // per-chunk lateness, seeded here and never during render (as the loader does)
    const late = seedLateness();
    let frames = 0;
    const draw = (p: number) => {
      drawMap(ctx, p, late);
      // for tests: how often it has been drawn
      canvas.dataset.frames = String(++frames);
    };
    if (prefersReducedMotion()) return draw(1);
    const began = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      draw(WAIT_TO * (1 - Math.exp(-(now - began) / WAIT_PACE_MS)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className='cover-wait' data-out={leaving}>
      <canvas ref={map} width={MAP_SIZE} height={MAP_SIZE} />
      <p>{t('dimensions.hero.entering')}</p>
    </div>
  );
};

/**
 * The navigation cover: a fixed layer over everything but the loader, driven by navigation.ts.
 * It belongs to the shell layout, so it outlives any one page. Out of use it is invisible and lets every pointer through.
 */
export const Cover = () => {
  const el = useRef<HTMLDivElement>(null);
  /** The sign of life: not there, there, or easing out. */
  const [wait, setWait] = useState<'off' | 'on' | 'out'>('off');
  useEffect(() => {
    if (!el.current) return;
    const release = registerCover(el.current);
    let shown = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const drop = () => {
      clearTimeout(timer);
      shown = false;
      setWait('off');
    };
    const releaseWait = registerCoverWait({
      show: () => {
        clearTimeout(timer);
        shown = true;
        setWait('on');
      },
      // eased out, and only then taken out of the page; resolves when it is gone
      hide: () =>
        new Promise<void>((done) => {
          if (!shown) return done();
          shown = false;
          setWait('out');
          timer = setTimeout(() => {
            setWait('off');
            done();
          }, COVER_WAIT_OUT_MS);
        }),
      drop,
    });
    // Restored from the back/forward cache, the page is as it was left: never under a cover that was up then.
    // Only then: the first `pageshow` of a page comes with its `load`, which can be late enough to fall into
    // a jump the reader has already asked for, and would take the cover away in the middle of it.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) clearCover();
    };
    window.addEventListener('pageshow', onShow);
    return () => {
      window.removeEventListener('pageshow', onShow);
      clearTimeout(timer);
      releaseWait();
      release();
    };
  }, []);
  return (
    <div className='dim-cover' ref={el} data-on='false' aria-hidden='true'>
      {wait !== 'off' && <CoverWait leaving={wait === 'out'} />}
    </div>
  );
};
