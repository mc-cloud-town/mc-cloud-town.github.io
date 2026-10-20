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

/** The sign of life on a cover that has been whole for long eases out in this long (shell.css, --t-out). */
export const COVER_WAIT_OUT_MS = 220;

/** `theme`: the ground of the current theme. `night`: the dark ground, whatever the theme (the End has no daylight). */
export type CoverTone = 'theme' | 'night';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const wait = (ms: number) =>
  new Promise<void>((done) => setTimeout(done, ms));
export const nextFrame = () =>
  new Promise<void>((done) => requestAnimationFrame(() => done()));

/** The cover as the reader sees it right now. */
const opacityOf = (el: HTMLElement) => {
  const c = getComputedStyle(el);
  return c.visibility === 'hidden' ? 0 : Number(c.opacity);
};

/** The fade of `el` that is under way has ended or was turned round, or `ms` have passed (a fade that never ran sends no event). */
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

/**
 * The cover is whole: its fade in has run to its own end. True then; false if it was sent away meanwhile
 * (`coverOut`, `clearCover`). A fade that is cancelled is not an end: turning a lifting cover round cancels the lift,
 * and at that moment the cover can still be seen through. If no end comes within `ms`, the cover is made whole at once.
 */
const whole = (el: HTMLElement, ms: number) =>
  new Promise<boolean>((done) => {
    const finish = (ok: boolean) => {
      el.removeEventListener('transitionend', look);
      el.removeEventListener('transitioncancel', look);
      clearTimeout(timer);
      done(ok);
    };
    const look = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'opacity') return;
      if (el.dataset.on !== 'true') finish(false);
      else if (e.type === 'transitionend' && opacityOf(el) === 1) finish(true);
    };
    const timer = setTimeout(() => {
      if (el.dataset.on !== 'true') return finish(false);
      // no fade ran, or it never ended (a tab in the background): whole without one
      el.style.transition = 'none';
      void el.offsetWidth;
      finish(true);
    }, ms);
    el.addEventListener('transitionend', look);
    el.addEventListener('transitioncancel', look);
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
 * The sign of life on the cover (`<Cover />` renders it): shown when a destination keeps the cover whole for long,
 * eased out before the cover lifts, dropped at once whenever the cover is taken away.
 */
interface CoverWait {
  show: () => void;
  hide: () => Promise<void>;
  drop: () => void;
}
let coverWait: CoverWait | null = null;

/** `<Cover />` hands the sign of life over; returns the release. */
export const registerCoverWait = (w: CoverWait) => {
  coverWait = w;
  return () => {
    if (coverWait === w) coverWait = null;
  };
};

export const showCoverWait = () => coverWait?.show();
/** Resolves when the sign has eased out; at once if it was not shown. */
export const hideCoverWait = () => coverWait?.hide() ?? Promise.resolve();

/** The length of the fade that starts now. (The shorthand is cleared first: a cover that was made whole without a fade has it set.) */
const pace = (el: HTMLElement, ms: number) => {
  el.style.transition = '';
  el.style.transitionDuration = `${ms}ms`;
};

/**
 * Fade the cover in. Resolves once it is whole and that frame has been painted, so the caller may change anything
 * behind it: true then, and also when there is no cover at all. False if the cover was sent away before it was whole;
 * the caller must then leave the page as it is. A cover that is whole already resolves at once; one that is lifting
 * turns round, and resolves only when it is whole again.
 */
export const coverIn = async ({
  tone = 'theme',
  ms = prefersReducedMotion() ? COVER_REDUCED_IN_MS : COVER_IN_MS,
}: { tone?: CoverTone; ms?: number } = {}) => {
  const el = cover;
  if (!el) return true;
  fade++;
  el.dataset.tone = tone;
  if (el.dataset.on === 'true' && opacityOf(el) === 1) return true;
  pace(el, ms);
  el.style.visibility = 'visible';
  // the starting state has to be computed once, or there is nothing to fade from
  void el.offsetWidth;
  el.dataset.on = 'true';
  // the fade starts with the next frame, not with this line: its own end is what counts, the clock is the fallback
  if (!(await whole(el, ms + 400))) return false;
  await nextFrame();
  return el.dataset.on === 'true';
};

/** Fade the cover out. Resolves when it is gone, or when a later fade has taken over. */
export const coverOut = async ({
  ms = prefersReducedMotion() ? COVER_REDUCED_OUT_MS : COVER_OUT_MS,
}: { ms?: number } = {}) => {
  const el = cover;
  if (!el) return;
  const mine = ++fade;
  pace(el, ms);
  el.dataset.on = 'false';
  // nothing to fade if it never came in
  if (opacityOf(el) > 0) await faded(el, ms + 400);
  if (mine === fade) el.style.visibility = 'hidden';
};

/** Take the cover away at once: a page restored from the back/forward cache must never show a stuck cover. */
export const clearCover = () => {
  const el = cover;
  if (!el) return;
  fade++;
  el.style.transition = 'none';
  el.dataset.on = 'false';
  el.style.visibility = 'hidden';
  coverWait?.drop();
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

/** The id a hash names. None if the hash is not well formed (`#%`): that names no place, and is no reason to fail. */
export const hashId = (hash: string) => {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return '';
  }
};

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
  const target = id ?? hashId(e.currentTarget.hash);
  if (!target || !jumpToSection(target, leave)) return false;
  e.preventDefault();
  return true;
};
