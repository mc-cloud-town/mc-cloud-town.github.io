import type { Page } from '@playwright/test';

/** One part of an inner page's entrance in one frame: how much of it shows, and how far below its place it is drawn (its own transform, so a reflow of the page is not mistaken for travel). */
export interface Part {
  o: number;
  y: number;
}

export const ENTRANCE_PARTS = {
  crumb: '.dim .head .crumb',
  line0: '.dim .head h1 span:nth-child(1)',
  line1: '.dim .head h1 span:nth-child(2)',
  vt: '.dim .head .vt',
  lede: '.dim .head p[data-t="body"]',
  tools: '.dim .tools',
  list: '.dim .entry, .dim .group header',
  next: '.dim .next',
} as const;
export type PartName = keyof typeof ENTRANCE_PARTS;

/** One frame of `watchEntrance`. */
export interface EntranceFrame {
  t: number;
  /** the page it was taken on */
  path: string;
  /** opacity of the navigation cover (0 when it is not shown) */
  cover: number;
  /** scale of the header's picture */
  zoom: number;
  parts: Record<PartName, Part | null>;
}

/**
 * Record an inner page's header from the first frame it is in the document: on this document and on every page
 * the client router shows after it. Read the frames with `entranceFrames`.
 */
export const watchEntrance = (page: Page) =>
  page.addInitScript((parts) => {
    const w = window as unknown as { __entrance: EntranceFrame[] };
    w.__entrance = [];
    const tick = (t: number) => {
      if (document.querySelector('.dim .head h1 span')) {
        const read = (sel: string) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const c = getComputedStyle(el);
          return {
            o: c.visibility === 'hidden' ? 0 : +c.opacity,
            y: new DOMMatrix(c.transform).m42,
          };
        };
        const cover = document.querySelector('.dim-cover');
        const cs = cover && getComputedStyle(cover);
        const img = document.querySelector('.dim .head .bg img');
        w.__entrance.push({
          t,
          path: window.location.pathname,
          cover: !cs || cs.visibility === 'hidden' ? 0 : +cs.opacity,
          zoom: img ? new DOMMatrix(getComputedStyle(img).transform).a : 1,
          parts: Object.fromEntries(
            Object.entries(parts).map(([name, sel]) => [name, read(sel)]),
          ) as EntranceFrame['parts'],
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, ENTRANCE_PARTS);

export const entranceFrames = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __entrance: EntranceFrame[] }).__entrance,
  );

/** The frames in which this part is in the page. */
export const partFrames = (frames: EntranceFrame[], name: PartName) =>
  frames
    .filter((f) => f.parts[name])
    .map((f) => ({ t: f.t, ...(f.parts[name] as Part) }));

/** When a part first shows at all, and when it has arrived (the first frame from which it stays whole). */
export const timing = (frames: EntranceFrame[], name: PartName) => {
  const own = partFrames(frames, name);
  const start = own.find((f) => f.o > 0.02)?.t ?? Infinity;
  let i = own.length;
  while (i > 0 && own[i - 1].o > 0.98) i--;
  return { start, end: own[i]?.t ?? Infinity, frames: own };
};

/** The entrance a part is styled with: its keyframes, length, delay and easing, as the browser computes them. */
export const animationOf = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const c = getComputedStyle(document.querySelector(sel)!);
    return {
      name: c.animationName,
      duration: c.animationDuration,
      delay: c.animationDelay,
      easing: c.animationTimingFunction,
    };
  }, selector);
