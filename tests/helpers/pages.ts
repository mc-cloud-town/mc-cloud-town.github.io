import { expect, type Page } from '@playwright/test';

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

/** One frame of `watchNav`: everything a step from one page to another changes. */
export interface NavFrame {
  t: number;
  path: string;
  y: number;
  /** opacity of the navigation cover (0 when it is not shown), and its colour */
  cover: number;
  tone: string;
  /** `<html data-nav>`: `leaving`, `covered`, or nothing */
  nav: string | null;
  dim: string | null;
  /** opacity of the home page's loader; null when there is none in the page */
  loader: number | null;
  /** the page's content: how much of it shows, and how far it has been moved (its own `translate`) */
  main: Part | null;
  /** the first line of an inner page's title */
  line0: Part | null;
  /** opacity of the menu sheet (0 when it is hidden) */
  sheet: number;
  /** the smooth scroll of the home page is stopped */
  stopped: boolean;
}

/**
 * Record every frame of this document from its first one (a step made by the client router stays in the same
 * document, so the recording runs through it), and every fade the cover starts. Read with `navFrames`.
 */
export const watchNav = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as {
      __nav: NavFrame[];
      __navRuns: string[];
      __sameDocument: number;
    };
    w.__nav = [];
    w.__navRuns = [];
    w.__sameDocument = Math.random();
    const shown = (el: Element | null) => {
      if (!el) return 0;
      const c = getComputedStyle(el);
      return c.visibility === 'hidden' ? 0 : +c.opacity;
    };
    let listening: Element | null = null;
    const tick = (t: number) => {
      const html = document.documentElement;
      const cover = document.querySelector<HTMLElement>('.dim-cover');
      if (cover && listening !== cover) {
        listening = cover;
        cover.addEventListener('transitionrun', (e) =>
          w.__navRuns.push(
            `${e.propertyName}:${Math.round(parseFloat(getComputedStyle(cover).transitionDuration) * 1000)}`,
          ),
        );
      }
      const main = document.querySelector('.dim main');
      const line = document.querySelector('.dim .head h1 span');
      const loader = document.querySelector('.dim .loader');
      const mc = main && getComputedStyle(main);
      const lc = line && getComputedStyle(line);
      w.__nav.push({
        t,
        path: window.location.pathname,
        y: Math.round(window.scrollY),
        cover: shown(cover),
        tone: cover ? getComputedStyle(cover).backgroundColor : '',
        nav: html.getAttribute('data-nav'),
        dim: html.getAttribute('data-dim'),
        loader: loader ? shown(loader) : null,
        main: mc
          ? {
              o: +mc.opacity,
              y:
                mc.translate === 'none'
                  ? 0
                  : parseFloat(mc.translate.split(' ')[1] ?? '0'),
            }
          : null,
        line0: lc
          ? { o: +lc.opacity, y: new DOMMatrix(lc.transform).m42 }
          : null,
        sheet: shown(document.querySelector('.dim-sheet')),
        stopped: html.classList.contains('lenis-stopped'),
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

/** The frames since the last call (or since the document began), and the cover's fades in that time. */
export const navFrames = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __nav: NavFrame[]; __navRuns: string[] };
    const out = { frames: w.__nav, runs: w.__navRuns };
    w.__nav = [];
    w.__navRuns = [];
    return out;
  });

/** A mark that a new document does not carry: the same value before and after means no reload in between. */
export const documentMark = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __sameDocument: number }).__sameDocument,
  );

/** No cover, no step under way, and the wheel moves the page: it is the reader's. */
export const pageIsFree = async (page: Page) => {
  await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('html')).not.toHaveAttribute('data-nav', /.*/);
  await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
  await expect(page.locator('.dim main')).toHaveCSS('opacity', '1');
  const before = await page.evaluate(() => window.scrollY);
  const size = page.viewportSize()!;
  await page.mouse.move(size.width / 2, size.height / 2);
  await page.mouse.wheel(0, 300);
  await expect
    .poll(() => page.evaluate(() => window.scrollY), {
      message: 'the wheel moves the page',
    })
    .toBeGreaterThan(before);
};
