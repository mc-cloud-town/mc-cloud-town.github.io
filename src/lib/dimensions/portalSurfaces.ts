/**
 * What a portal is filled with. Each surface is generated in code on a small canvas (16:9) and scaled up with hard
 * pixels; no game asset is used. A surface is prepared once and then painted frame by frame (PortalCanvas.tsx).
 */
export type PortalSurface = 'nether' | 'end';

/** Paints frame number `frame` (0, 1, 2, …) over the whole canvas. */
export type SurfacePainter = (
  ctx: CanvasRenderingContext2D,
  frame: number,
) => void;

export interface SurfaceDef {
  width: number;
  height: number;
  /** how long one frame stands */
  frameMs: number;
  /** Draw whatever the frames are made from. Null where there is no canvas to draw on. */
  prepare: () => SurfacePainter | null;
}

// ───────── the nether: a swirling violet tile ─────────

/** One tile of the pattern, in pixels, and how many tiles cover the canvas (16:9). */
const TILE = 16,
  COLS = 16,
  ROWS = 9;
/** The swirl is drawn once as this many frames and then played in a loop. */
const FRAMES = 32;

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

const nether: SurfaceDef = {
  width: COLS * TILE,
  height: ROWS * TILE,
  frameMs: 50,
  prepare: () => {
    const strip = drawStrip();
    if (!strip) return null;
    return (ctx, frame) => {
      const f = frame % FRAMES;
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          ctx.drawImage(
            strip,
            0,
            f * TILE,
            TILE,
            TILE,
            x * TILE,
            y * TILE,
            TILE,
            TILE,
          );
    };
  },
};

// ───────── the end: a near-black field, specks at several depths ─────────

const END_WIDTH = 256,
  END_HEIGHT = 144,
  END_FRAME_MS = 50;
/** The field the specks stand in: almost black, a shade towards teal. */
const END_GROUND = 'rgb(3, 8, 11)';
/**
 * Far to near. Each depth is one tile of specks, repeated over the canvas and carried along at its own pace
 * (`vx`, `vy`: canvas pixels a second; one of them is five to six of the screen's at 1440px): the far ones dim,
 * many and slow, the near ones few, pale and quicker, each in a direction of its own. That difference in pace is
 * the depth. Teal, green and a pale white, on the dark of the End.
 */
const END_DEPTHS = [
  { tile: 64, specks: 26, colour: [18, 62, 70], vx: -0.9, vy: -1.6 },
  { tile: 80, specks: 30, colour: [24, 96, 92], vx: 1.3, vy: -2.4 },
  { tile: 112, specks: 34, colour: [40, 138, 108], vx: -2.2, vy: -3.6 },
  { tile: 144, specks: 30, colour: [86, 190, 168], vx: 2.9, vy: -5.2 },
  { tile: 176, specks: 16, colour: [218, 242, 234], vx: -1.5, vy: -7.4 },
] as const;

/** A fixed sequence of pseudo-random numbers in 0..1: the field is the same on every visit, and in every still. */
const sequence = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** One tile per depth: opaque specks on nothing. */
const drawDepths = () => {
  const random = sequence(0xe2d);
  const tiles: HTMLCanvasElement[] = [];
  for (const [k, depth] of END_DEPTHS.entries()) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = depth.tile;
    const ctx = tile.getContext('2d');
    if (!ctx) return null;
    const [r, g, b] = depth.colour;
    const nearest = k === END_DEPTHS.length - 1;
    // each depth in a few strengths of its own colour, mixed towards the ground (opaque: hard pixels, no blending)
    const shade = (s: number) =>
      `rgb(${Math.round(3 + (r - 3) * s)}, ${Math.round(8 + (g - 8) * s)}, ${Math.round(11 + (b - 11) * s)})`;
    for (let i = 0; i < depth.specks; i++) {
      // kept off the tile's edge, so a halo is never cut by it
      const x = 1 + Math.floor(random() * (depth.tile - 2)),
        y = 1 + Math.floor(random() * (depth.tile - 3));
      // half of the nearest specks have a faint halo, one pixel each way
      if (nearest && random() < 0.5) {
        ctx.fillStyle = shade(0.26);
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
      ctx.fillStyle = shade(0.6 + random() * 0.4);
      // some of the middle ones are two pixels tall
      ctx.fillRect(x, y, 1, k > 1 && !nearest && random() < 0.18 ? 2 : 1);
    }
    tiles.push(tile);
  }
  return tiles;
};

const end: SurfaceDef = {
  width: END_WIDTH,
  height: END_HEIGHT,
  // the specks are carried a whole pixel at a time, a few times a second at the most
  frameMs: END_FRAME_MS,
  prepare: () => {
    const tiles = drawDepths();
    if (!tiles) return null;
    return (ctx, frame) => {
      const seconds = (frame * END_FRAME_MS) / 1000;
      ctx.fillStyle = END_GROUND;
      ctx.fillRect(0, 0, END_WIDTH, END_HEIGHT);
      END_DEPTHS.forEach((depth, k) => {
        // whole pixels only: the specks stay hard-edged as they move
        const at = (v: number) =>
          ((Math.floor(v * seconds) % depth.tile) + depth.tile) % depth.tile;
        const ox = at(depth.vx),
          oy = at(depth.vy);
        for (let y = oy - depth.tile; y < END_HEIGHT; y += depth.tile)
          for (let x = ox - depth.tile; x < END_WIDTH; x += depth.tile)
            ctx.drawImage(tiles[k], x, y);
      });
    };
  },
};

export const PORTAL_SURFACES: Record<PortalSurface, SurfaceDef> = {
  nether,
  end,
};
