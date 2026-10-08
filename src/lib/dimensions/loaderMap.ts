/**
 * The loader's map: a small square of chunks that pass through stages from the centre outward and settle
 * into a finished square, after the world-generation map of the game without copying it. Drawn in code, in the
 * site's own greys and the Overworld's blue; no image is used. Ported from docs/design-demos/loader-lab.html.
 */

/** The canvas is N × N pixels, one per chunk. */
export const MAP_SIZE = 21;
/** The finished map is a (2R + 1) square; around it, a border two chunks wide. */
export const MAP_RADIUS = 8;
const BORDER = 2;
const CENTRE = (MAP_SIZE - 1) / 2;

/** What shows where no chunk has started: the loader's own ground. */
export const MAP_GROUND = '#06080b';
/** The Overworld accent of the night theme (tokens.css): the loader is always dark. */
export const MAP_FRONTIER = '#86cdff';
/** The stages a chunk passes through, oldest first; the last one is "done". */
export const MAP_TONES = [
  '#0d1217',
  '#39424c',
  '#6f7984',
  '#9aa3ad',
  MAP_FRONTIER,
  '#f2f4f6',
];
/** How far behind the leading front each stage follows. */
const FRONTS = [0, 0.16, 0.3, 0.42, 0.5];
/** How ragged the fronts are while loading (it dies out with the progress). */
const RAGGED = 0.16;
/** The frontier is one chunk wide: this far behind it, a chunk is done. */
const RING_DEPTH = 0.08;
/** The fronts run ahead of the progress, so that the last of them has arrived at 100%. */
const LEAD = 1.5;

/** One number per chunk: how late it is. Random, so made where it is used (an effect), never during render. */
export const seedLateness = () =>
  Array.from({ length: MAP_SIZE * MAP_SIZE }, () => Math.random());

/** Draw the map at progress `p` (0..1). */
export const drawMap = (
  ctx: CanvasRenderingContext2D,
  p: number,
  late: number[],
) => {
  ctx.fillStyle = MAP_GROUND;
  ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
  for (let y = 0; y < MAP_SIZE; y++)
    for (let x = 0; x < MAP_SIZE; x++) {
      const d = Math.max(Math.abs(x - CENTRE), Math.abs(y - CENTRE));
      if (d > MAP_RADIUS + BORDER) continue;
      const reach = d / (MAP_RADIUS + BORDER);
      // raggedness dies out as the map completes
      const jitter = late[y * MAP_SIZE + x] * RAGGED * (1 - p);
      let stage = -1;
      for (let s = 0; s < FRONTS.length; s++)
        if (p * LEAD - FRONTS[s] - jitter > reach) stage = s;
      if (stage < 0) continue;
      // the outer two rings never finish: they stay at the first grey, like the border of a map;
      // the edge of the square stops at the frontier colour; inside it chunks are done
      const cap = d > MAP_RADIUS ? 1 : d === MAP_RADIUS ? 4 : 5;
      let k = Math.min(stage + 1, cap);
      // the ring is only ever one chunk wide: behind it chunks are done
      if (
        k === 4 &&
        d < MAP_RADIUS &&
        p * LEAD - FRONTS[4] - jitter > reach + RING_DEPTH
      )
        k = 5;
      if (k === 5 && d === MAP_RADIUS) k = 4;
      ctx.fillStyle = MAP_TONES[k];
      ctx.fillRect(x, y, 1, 1);
    }
};
