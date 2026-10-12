/**
 * The loader's map: a small square of chunks that pass through stages from the centre outward and settle
 * into a finished square, after the world-generation map of the game without copying it. Drawn in code, in the
 * site's own greys and the Overworld's blue; no image is used. After docs/design-demos/loader-lab.html.
 *
 * What is drawn goes with the progress over its whole range. Every chunk has a moment of its own for each of its
 * stage changes, and those moments (some fifteen hundred of them) are spread evenly from 0 to 1: every hundredth
 * of the progress changes about fifteen chunks, the last hundredth as many as the first, and the very last change
 * falls at 1. So the finished square is there at 1 and at nothing less, and no stretch of the progress, least of
 * all the last fifth where a real wait is longest, leaves the map as it was.
 * (Before, the fronts ran at one and a half times the progress: the square stood finished from about 85%.)
 *
 * And the map is at work the whole time, as the game's is, whether the progress moves or not: the chunks that
 * are under way (started, not finished) take turns to fall back one stage for a moment (`at`, the time). That
 * never shows more than the progress allows, never touches a finished chunk, and is over at 1.
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
/**
 * How many stages a chunk at this distance from the centre goes through. The outer two rings never finish: they
 * stay at the first grey, like the border of a map. The edge of the square stops at the frontier colour: the
 * ring. Inside it chunks are done.
 */
const stagesAt = (d: number) => (d > MAP_RADIUS ? 1 : d === MAP_RADIUS ? 4 : 5);
/**
 * In which order the changes come: how far behind a chunk's first stage each later one follows (in the map's own
 * width: the band of chunks under way is about two rings deep, so at a half about half of the square is built)…
 */
const LAGS = [0, 0.05, 0.1, 0.15, 0.2];
/** …how far ahead of the fronts the border is laid, so that the last to come is the ring and what lies next to it… */
const BORDER_EARLY = 0.25;
/** …how much later the corners of a ring are than the middles of its sides (in rings): a ring closes towards them… */
const CORNERS_LATE = 1;
/** …and how ragged the fronts are (the lateness of each chunk, in the map's own width). */
const RAGGED = 0.16;

/**
 * One chunk at work at a time is drawn a stage back, for this long, and then the next one: about twelve changes
 * a second, small and local. Whose turn it is goes through the chunks under way in strides, never the same one
 * twice running.
 */
const WORK_MS = 160;
const WORK_STRIDE = 7919;

/**
 * The run the map is given when it is shown: from nothing to the whole in this long, at a fairly even pace (a
 * little slower into it and out of it), so that every part of the range has its time on the screen. The loader
 * shows the lesser of this and what has really come (Loader.tsx): loading that is over early does not cut the
 * run short, and loading that is slow holds it back.
 */
export const MAP_RUN_S = 2;
/** How far the planned run is `s` seconds after the map appeared (0..1). */
export const plannedRun = (s: number) => {
  const u = Math.min(1, Math.max(0, s / MAP_RUN_S));
  return 0.7 * u + 0.3 * u * u * (3 - 2 * u);
};

/** The map of one loader: for every chunk, at what progress it reaches each of its stages. */
export interface MapPlan {
  /** `stages[chunk]`: the progress (0..1] at which the chunk reaches stage 1, 2, …, in order */
  stages: number[][];
  /** how many stage changes there are in all */
  changes: number;
}

/** One number per chunk: how late it is. Random, so made where it is used (an effect), never during render. */
export const seedLateness = () =>
  Array.from({ length: MAP_SIZE * MAP_SIZE }, () => Math.random());

/**
 * Lay the map out: every stage change of every chunk in its order (from the centre outward, each ring closing
 * towards its corners, later stages behind earlier ones, ragged by each chunk's lateness), and then the changes
 * spread evenly over the progress, the last of them at 1.
 */
export const planMap = (late: number[]): MapPlan => {
  const order: { chunk: number; when: number }[] = [];
  for (let y = 0; y < MAP_SIZE; y++)
    for (let x = 0; x < MAP_SIZE; x++) {
      const dx = Math.abs(x - CENTRE),
        dy = Math.abs(y - CENTRE);
      const d = Math.max(dx, dy);
      const reach =
        d > MAP_RADIUS
          ? d / (MAP_RADIUS + BORDER) - BORDER_EARLY
          : (d + (d ? (CORNERS_LATE * Math.min(dx, dy)) / d : 0)) /
            (MAP_RADIUS + BORDER);
      const chunk = y * MAP_SIZE + x;
      for (let s = 0; s < stagesAt(d); s++)
        order.push({ chunk, when: reach + LAGS[s] + late[chunk] * RAGGED });
    }
  // (a chunk's own stages keep their order: each is later than the one before it)
  order.sort((a, b) => a.when - b.when);
  const stages: number[][] = Array.from(
    { length: MAP_SIZE * MAP_SIZE },
    () => [],
  );
  order.forEach(({ chunk }, i) => stages[chunk].push((i + 1) / order.length));
  return { stages, changes: order.length };
};

/**
 * Draw the map at progress `p` (0..1). The finished square is drawn at 1, and at nothing less.
 * With `at` (a time in milliseconds) the chunks that are under way are at work: a few of them are drawn one
 * stage back for a moment. Without it the map is drawn as the progress alone has it.
 */
export const drawMap = (
  ctx: CanvasRenderingContext2D,
  p: number,
  plan: MapPlan,
  at?: number,
) => {
  ctx.fillStyle = MAP_GROUND;
  ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
  const stage = plan.stages.map((moments) => {
    let k = 0;
    while (k < moments.length && (p >= 1 || moments[k] <= p)) k++;
    return k;
  });
  if (at !== undefined && p < 1) {
    // under way: past its first stage (a chunk does not go back to the ground) and not at its last
    const working: number[] = [];
    stage.forEach((k, chunk) => {
      if (k > 1 && k < plan.stages[chunk].length) working.push(chunk);
    });
    const turn = Math.floor(at / WORK_MS);
    // (a single chunk under way takes every other turn)
    if (working.length > 1 || (working.length && turn % 2))
      stage[working[(turn * WORK_STRIDE) % working.length]] -= 1;
  }
  stage.forEach((k, chunk) => {
    if (k < 1) return;
    ctx.fillStyle = MAP_TONES[k];
    ctx.fillRect(chunk % MAP_SIZE, Math.floor(chunk / MAP_SIZE), 1, 1);
  });
};
