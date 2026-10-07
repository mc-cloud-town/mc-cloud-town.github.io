'use client';

import { useEffect, useRef } from 'react';

/** One tile of the pattern, in pixels, and how many tiles cover the canvas (16:9). */
const TILE = 16,
  COLS = 16,
  ROWS = 9;
/** The swirl is drawn once as this many frames and then played in a loop. */
const FRAMES = 32,
  FRAME_MS = 50;

/** Dark to light. Every step is a violet: opaque, blue far above green. */
const PALETTE = [
  [56, 0, 159],
  [62, 0, 174],
  [74, 2, 187],
  [88, 6, 196],
  [116, 24, 211],
  [141, 47, 221],
  [160, 70, 228],
] as const;

/** Signed distance from `c` on a tile that wraps round, so neighbouring tiles join without a seam. */
const wrap = (v: number, c: number) =>
  ((((v - c + TILE / 2) % TILE) + TILE) % TILE) - TILE / 2;
/** A fixed pseudo-random number in 0..1 for one cell. */
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** One spiral arm turning round the point (cx, cy); it fades towards the edge of its tile. */
const vortex = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  turn: number,
  t: number,
) => {
  const dx = wrap(x + 0.5, cx),
    dy = wrap(y + 0.5, cy),
    r = Math.hypot(dx, dy);
  const weight = Math.max(0, 1 - r / (TILE * 0.56));
  return weight * Math.cos(turn * Math.atan2(dy, dx) + r * 0.95 - t);
};

/** Every frame of the swirl, stacked in one strip (TILE wide, FRAMES tiles tall). */
const drawStrip = () => {
  const strip = document.createElement('canvas');
  strip.width = TILE;
  strip.height = TILE * FRAMES;
  const ctx = strip.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(TILE, TILE * FRAMES);
  for (let f = 0; f < FRAMES; f++) {
    // a whole number of turns per loop, so the last frame runs into the first
    const t = (f / FRAMES) * Math.PI * 2;
    for (let y = 0; y < TILE; y++)
      for (let x = 0; x < TILE; x++) {
        // two vortices per tile, one in the middle and one on the corners, turning opposite ways
        const swirl =
          vortex(x, y, TILE / 2, TILE / 2, 1, t) + vortex(x, y, 0, 0, -1, t);
        const shimmer =
          0.22 * Math.cos(t * 2 + hash(x, y) * Math.PI * 2) +
          0.18 * (hash(y, x) - 0.5);
        // mostly dark, with the arms picked out in the lighter steps
        const k =
          Math.min(1, Math.max(0, (swirl + shimmer + 0.75) / 1.75)) ** 1.25;
        const [r, g, b] =
          PALETTE[Math.min(PALETTE.length - 1, Math.floor(k * PALETTE.length))];
        const i = ((f * TILE + y) * TILE + x) * 4;
        image.data[i] = r;
        image.data[i + 1] = g;
        image.data[i + 2] = b;
        image.data[i + 3] = 255;
      }
  }
  ctx.putImageData(image, 0, 0);
  return strip;
};

/**
 * A procedurally generated pixel portal: a swirling violet tile, drawn small and scaled up with hard pixels.
 * No game asset is used. The swirl advances only while the portal is switched on.
 */
export const PortalCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const strip = drawStrip();
    if (!strip) return;
    let frame = 0;
    const draw = () => {
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          ctx.drawImage(
            strip,
            0,
            frame * TILE,
            TILE,
            TILE,
            x * TILE,
            y * TILE,
            TILE,
            TILE,
          );
    };
    // painted once up front, so the first frame the reader sees is never blank
    draw();
    let frames = 0;
    canvas.dataset.frames = '0';
    let timer: number | undefined;
    const tick = () => {
      frame = (frame + 1) % FRAMES;
      draw();
      // how many frames the swirl has advanced: the tests read it to see that a hidden portal costs nothing
      canvas.dataset.frames = String(++frames);
    };
    // The portal transition switches the canvas on and off through its inline visibility (GSAP autoAlpha);
    // the stylesheet keeps it hidden until then. The timer exists only while it is switched on.
    const sync = () => {
      const v = canvas.style.visibility;
      const on = v !== '' && v !== 'hidden';
      if (on && timer === undefined) timer = window.setInterval(tick, FRAME_MS);
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
  }, []);

  return (
    <canvas
      className='portal'
      ref={ref}
      width={COLS * TILE}
      height={ROWS * TILE}
      aria-hidden='true'
    />
  );
};
