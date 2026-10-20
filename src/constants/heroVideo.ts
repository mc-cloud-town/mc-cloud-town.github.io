/**
 * The times of the hero's video (HeroVideo.tsx) and of the arrival it waits for (HomePage.tsx), in one place: the
 * components and the tests that hold them read the same numbers.
 */

/**
 * How long the cover stays after the player says it is playing. YouTube's player shows its own buttons in the
 * middle of the picture for about three and a half seconds after it starts; the cover is over them all that time.
 * (The approved demo's value. Not to be shortened below what hides those buttons.)
 */
export const SETTLE_MS = 4200;
/** Then the still becomes the moving picture: opacity only. */
export const DISSOLVE_S = 1.8;
/**
 * How long before the video's end the cover begins to come back, in the dissolve's own time and ease: it is whole
 * half a second before the end. At its end the player shows a black frame and a spinner, and when it starts over
 * its buttons again, as at the first start.
 */
export const LAP_LEAD_S = DISSOLVE_S + 0.5;
/**
 * How long YouTube's cover is given, from the moment the page's script takes over, before the site's own picture
 * takes its place. Where YouTube cannot be reached the request often does not fail, it hangs: without a budget the
 * loader would wait out its whole timeout and then lift on the scene's bare ground.
 */
export const COVER_BUDGET_MS = 2000;
/**
 * The camera's move of the hero's arrival, in seconds from the arrival's start: the longest part of the arrival,
 * so its end is the arrival's end.
 */
export const ARRIVAL_CAMERA = { at: 0.5, duration: 2.6 };
/** How long the arrival lasts. */
export const ARRIVAL_S = ARRIVAL_CAMERA.at + ARRIVAL_CAMERA.duration;
