'use client';

import { useEffect, useRef } from 'react';
import {
  PORTAL_SURFACES,
  type PortalSurface,
} from '@/lib/dimensions/portalSurfaces';

/**
 * A portal's surface, generated in code: drawn small and scaled up with hard pixels. No game asset is used.
 * One canvas per portal of the page: the Nether's swirling violet, the End's dark field of drifting specks
 * (portalSurfaces.ts). It advances only while the portal is switched on; a portal that is never switched on
 * (reduced motion: the scenes change without it) holds its one first frame.
 */
export const PortalCanvas = ({ surface }: { surface: PortalSurface }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const def = PORTAL_SURFACES[surface];

  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const paint = def.prepare();
    if (!paint) return;
    // painted once up front, so the first frame the reader sees is never blank
    paint(ctx, 0);
    let frames = 0;
    canvas.dataset.frames = '0';
    let timer: number | undefined;
    const tick = () => {
      paint(ctx, ++frames);
      // how many frames the surface has advanced: the tests read it to see that a hidden portal costs nothing
      canvas.dataset.frames = String(frames);
    };
    // The portal transition switches the canvas on and off through its inline visibility (GSAP autoAlpha);
    // the stylesheet keeps it hidden until then. The timer exists only while it is switched on.
    const sync = () => {
      const v = canvas.style.visibility;
      const on = v !== '' && v !== 'hidden';
      if (on && timer === undefined)
        timer = window.setInterval(tick, def.frameMs);
      else if (!on && timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    const watch = new MutationObserver(sync);
    watch.observe(canvas, { attributes: true, attributeFilter: ['style'] });
    sync();
    return () => {
      watch.disconnect();
      window.clearInterval(timer);
    };
  }, [def]);

  return (
    <canvas
      className='portal'
      data-surface={surface}
      ref={ref}
      width={def.width}
      height={def.height}
      aria-hidden='true'
    />
  );
};
