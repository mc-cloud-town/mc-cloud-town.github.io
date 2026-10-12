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
 *
 * The drawing itself, and every number of it, is in loaderCore.ts: the one source of it, which the served home
 * page carries as well. This is that source as the page's script uses it.
 */
import { loaderCore } from './loaderCore';

export type { MapPlan } from './loaderCore';

export const core = loaderCore();

export const {
  MAP_SIZE,
  MAP_RADIUS,
  MAP_GROUND,
  MAP_FRONTIER,
  MAP_TONES,
  MAP_RUN_S,
  plannedRun,
  seedLateness,
  planMap,
  drawMap,
} = core;
