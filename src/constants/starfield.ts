/**
 * How far each layer of the End starfield drifts from where the stylesheet puts it, in pixels:
 * sideways (either way) and upwards. The one source for the animation (Starfield.tsx), for the size of
 * the layers (home.css, through --drift-x / --drift-y) and for the test that checks the stars cover the screen.
 */
export const STAR_DRIFT = { x: 160, y: 220 } as const;
