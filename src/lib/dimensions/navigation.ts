import type { MouseEvent as ReactMouseEvent } from 'react';

/**
 * Navigation is a transition too. Two things live here, both for the whole shell:
 *
 *  - the cover: one full-screen layer (`<Cover />`, in the shell layout) that fades in over the page, so that
 *    what is behind it can change at once, and fades out again over the new scene. Opacity only; the page's
 *    layout, scrollbar and scroll position are never touched by it.
 *  - section links: a link to a part of the home page asks whoever drives the home page's scroll
 *    (choreography.ts) to take the reader there. With no home page mounted the link is an ordinary link.
 */

/** The cover's fades, in milliseconds. The lift is slower: the scene under it gets to open. */
export const COVER_IN_MS = 280;
export const COVER_OUT_MS = 520;
/** With reduced motion both are a brief fade. */
export const COVER_REDUCED_IN_MS = 100;
export const COVER_REDUCED_OUT_MS = 120;
/** How long the cover stays whole at the least: a cut reads as one beat, not as a flicker. */
export const COVER_HOLD_MS = 120;

/** `theme`: the ground of the current theme. `night`: the dark ground, whatever the theme (the End has no daylight). */
export type CoverTone = 'theme' | 'night';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const wait = (ms: number) =>
  new Promise<void>((done) => setTimeout(done, ms));
export const nextFrame = () =>
  new Promise<void>((done) => requestAnimationFrame(() => done()));

/** The fade of `el` that is under way has ended, or `ms` have passed (a fade that never ran sends no event). */
const faded = (el: HTMLElement, ms: number) =>
  new Promise<void>((done) => {
    const end = (e?: TransitionEvent) => {
      if (e && (e.target !== el || e.propertyName !== 'opacity')) return;
      el.removeEventListener('transitionend', end);
      el.removeEventListener('transitioncancel', end);
      clearTimeout(timer);
      done();
    };
    const timer = setTimeout(end, ms);
    el.addEventListener('transitionend', end);
    el.addEventListener('transitioncancel', end);
  });

let cover: HTMLElement | null = null;
/** Each fade has a number: a fade that was overtaken by a later one does nothing when its time is up. */
let fade = 0;

/** `<Cover />` hands its element over; returns the release. */
export const registerCover = (el: HTMLElement) => {
  cover = el;
  return () => {
    if (cover === el) cover = null;
  };
};

/**
 * Fade the cover in. Resolves once it is whole and that frame has been painted,
 * so the caller may change anything behind it.
 */
export const coverIn = async ({
  tone = 'theme',
  ms = prefersReducedMotion() ? COVER_REDUCED_IN_MS : COVER_IN_MS,
}: { tone?: CoverTone; ms?: number } = {}) => {
  const el = cover;
  if (!el) return;
  fade++;
  el.dataset.tone = tone;
  el.style.transitionDuration = `${ms}ms`;
  el.style.visibility = 'visible';
  // the starting state has to be computed once, or there is nothing to fade from
  void el.offsetWidth;
  el.dataset.on = 'true';
  // the fade starts with the next frame, not with this line: its own end is what counts, the clock is the fallback
  await faded(el, ms + 400);
  await nextFrame();
};

/** Fade the cover out. Resolves when it is gone. */
export const coverOut = async ({
  ms = prefersReducedMotion() ? COVER_REDUCED_OUT_MS : COVER_OUT_MS,
}: { ms?: number } = {}) => {
  const el = cover;
  if (!el) return;
  const mine = ++fade;
  el.style.transitionDuration = `${ms}ms`;
  el.dataset.on = 'false';
  await faded(el, ms + 400);
  if (mine === fade) el.style.visibility = 'hidden';
};

/** Take the cover away at once: a page restored from the back/forward cache must never show a stuck cover. */
export const clearCover = () => {
  const el = cover;
  if (!el) return;
  fade++;
  el.style.transitionDuration = '0ms';
  el.dataset.on = 'false';
  el.style.visibility = 'hidden';
};

/**
 * Called when what the reader came from may go (the menu sheet closes): at once for a travel,
 * under the cover for a cut. If it returns a promise, the cover stays until that has settled.
 */
export type Leave = () => void | Promise<void>;
/** Takes the reader to the element with this id (`top`: the very top). False if there is no such place. */
export type SectionJumper = (id: string, leave?: Leave) => boolean;

let jumper: SectionJumper | null = null;

/** The home page's choreography registers itself while it is mounted; returns the release. */
export const setSectionJumper = (fn: SectionJumper) => {
  jumper = fn;
  return () => {
    if (jumper === fn) jumper = null;
  };
};

/** False when no home page is there to do it, or it has no such section: the caller falls back to a plain link. */
export const jumpToSection = (id: string, leave?: Leave) =>
  jumper ? jumper(id, leave) : false;

/** A click that the browser should handle itself: a new tab, a new window, a download. */
export const isPlainClick = (e: ReactMouseEvent) =>
  !e.defaultPrevented &&
  e.button === 0 &&
  !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);

/**
 * onClick for a link to a section of the home page. Returns true if the jump was taken over
 * (the default navigation is then cancelled), false if the link should simply be followed.
 * `id` defaults to the link's own hash.
 */
export const followSectionLink = (
  e: ReactMouseEvent<HTMLAnchorElement>,
  { id, leave }: { id?: string; leave?: Leave } = {},
) => {
  if (!isPlainClick(e)) return false;
  const target = id ?? decodeURIComponent(e.currentTarget.hash.slice(1));
  if (!target || !jumpToSection(target, leave)) return false;
  e.preventDefault();
  return true;
};
