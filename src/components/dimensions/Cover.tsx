'use client';

import { useEffect, useRef } from 'react';
import { clearCover, registerCover } from '@/lib/dimensions/navigation';

/**
 * The navigation cover: a fixed layer over everything but the loader, driven by navigation.ts.
 * It belongs to the shell layout, so it outlives any one page. Out of use it is invisible and lets every pointer through.
 */
export const Cover = () => {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const release = registerCover(el.current);
    // Restored from the back/forward cache, the page is as it was left: never under a cover that was up then.
    // Only then: the first `pageshow` of a page comes with its `load`, which can be late enough to fall into
    // a jump the reader has already asked for, and would take the cover away in the middle of it.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) clearCover();
    };
    window.addEventListener('pageshow', onShow);
    return () => {
      window.removeEventListener('pageshow', onShow);
      release();
    };
  }, []);
  return (
    <div className='dim-cover' ref={el} data-on='false' aria-hidden='true' />
  );
};
