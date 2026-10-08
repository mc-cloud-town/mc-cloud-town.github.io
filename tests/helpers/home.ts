import { expect, type Page } from '@playwright/test';

/** Ids of the scene layers that are actually on screen. */
export const visibleScenes = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.scene')]
      .filter((s) => {
        const c = getComputedStyle(s);
        return c.visibility !== 'hidden' && +c.opacity > 0.5;
      })
      .map((s) => s.dataset.scene),
  );

/** Scroll so that `selector` sits `offset` viewport-heights below the top, then let the scrub settle. */
export const scrollToSection = async (
  page: Page,
  selector: string,
  offset = 0.3,
) => {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string)!;
      window.scrollTo(
        0,
        el.getBoundingClientRect().top +
          window.scrollY +
          (off as number) * window.innerHeight,
      );
    },
    [selector, offset],
  );
  await page.waitForTimeout(1800);
};

/** The loader has finished and the choreography is built. */
export const ready = (page: Page) =>
  page.locator('.dim[data-ready="true"]').waitFor({ timeout: 20_000 });

/** One frame of a recording: where the page is and what is covering it. */
export interface Frame {
  t: number;
  y: number;
  /** opacity of the navigation cover (0 when it is not shown) */
  cover: number;
  dim: string | undefined;
  /** opacity of the nether portal (0 when it is hidden) */
  portal: number;
  /** opacity of the white-out of the wake (0 when it is hidden) */
  flash: number;
  /** opacity of the menu sheet (0 when it is hidden) */
  sheet: number;
  /** the cover's colour */
  tone: string;
  /** the transitions the cover is running, as `property:milliseconds` */
  run: string;
  scenes: string[];
}

/** Record every frame from now on; read the frames with `recorded`. */
export const record = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __rec: unknown[]; __raf: number };
    const shown = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return 0;
      const c = getComputedStyle(el);
      return c.visibility === 'hidden' ? 0 : +c.opacity;
    };
    w.__rec = [];
    // What the cover is at the very moment the page is moved by more than a screen, and every fade it starts:
    // read where it happens, so neither depends on how many frames the machine manages to draw.
    const log = window as unknown as {
      __jumps: [to: number, cover: number, at: number][];
      __runs: string[];
      __scrollTo?: typeof window.scrollTo;
    };
    log.__jumps = [];
    log.__runs = [];
    if (!log.__scrollTo) {
      const scrollTo = window.scrollTo.bind(window) as (
        ...args: unknown[]
      ) => void;
      log.__scrollTo = scrollTo as typeof window.scrollTo;
      window.scrollTo = ((...args: unknown[]) => {
        const to =
          typeof args[0] === 'object' && args[0]
            ? (args[0] as ScrollToOptions).top
            : (args[1] as number | undefined);
        if (
          typeof to === 'number' &&
          Math.abs(to - window.scrollY) > window.innerHeight
        )
          log.__jumps.push([to, shown('.dim-cover'), performance.now()]);
        scrollTo(...args);
      }) as typeof window.scrollTo;
      const el = document.querySelector<HTMLElement>('.dim-cover');
      el?.addEventListener('transitionrun', (e) =>
        log.__runs.push(
          `${e.propertyName}:${Math.round(parseFloat(getComputedStyle(el).transitionDuration) * 1000)}`,
        ),
      );
    }
    const tick = (t: number) => {
      const cover = document.querySelector('.dim-cover');
      w.__rec.push({
        t,
        y: Math.round(window.scrollY),
        cover: shown('.dim-cover'),
        dim: document.documentElement.dataset.dim,
        portal: shown('canvas.portal'),
        flash: shown('.flash'),
        sheet: shown('.dim-sheet'),
        tone: cover ? getComputedStyle(cover).backgroundColor : '',
        run: (cover?.getAnimations() ?? [])
          .map((a) => {
            const t = a.effect!.getComputedTiming();
            return `${(a as CSSTransition).transitionProperty}:${Math.round(Number(t.delay ?? 0) + Number(t.duration ?? 0))}`;
          })
          .join(),
        scenes: [...document.querySelectorAll<HTMLElement>('.scene')]
          .filter((s) => {
            const c = getComputedStyle(s);
            return c.visibility !== 'hidden' && +c.opacity > 0.5;
          })
          .map((s) => s.dataset.scene),
      });
      w.__raf = requestAnimationFrame(tick);
    };
    w.__raf = requestAnimationFrame(tick);
  });

export const recorded = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __rec: Frame[]; __raf: number };
    cancelAnimationFrame(w.__raf);
    return w.__rec;
  });

/**
 * The cover's opacity at the moment the page was moved, in one step of more than a screen, to where it is now
 * (since `record`). Null if it never was. Large moves that come in pairs are not the jump: when the page is
 * measured again, ScrollTrigger takes it to the top and straight back within one task, which is never painted.
 */
export const coverAtLanding = (page: Page) =>
  page.evaluate(() => {
    const jumps = (
      window as unknown as {
        __jumps: [to: number, cover: number, at: number][];
      }
    ).__jumps;
    const alone = jumps.filter(
      ([, , at], i) =>
        !(jumps[i - 1] && at - jumps[i - 1][2] < 4) &&
        !(jumps[i + 1] && jumps[i + 1][2] - at < 4),
    );
    const here = alone.find(([to]) => Math.abs(to - window.scrollY) <= 2);
    return here ? here[1] : null;
  });

/** Every fade the cover started since `record`, in order, as `property:milliseconds`. */
export const coverRuns = (page: Page) =>
  page.evaluate(() => (window as unknown as { __runs: string[] }).__runs);

/** How far the top of `selector` is from the top of the screen, in pixels. */
export const topOf = (page: Page, selector: string) =>
  page.evaluate(
    (sel) =>
      Math.round(document.querySelector(sel)!.getBoundingClientRect().top),
    selector,
  );

/** The page has come to rest with `selector` at the top of the screen and no cover over it. */
export const landedOn = async (page: Page, selector: string) => {
  await expect
    .poll(async () => Math.abs(await topOf(page, selector)), {
      message: `${selector} at the top`,
    })
    .toBeLessThanOrEqual(1);
  await expect(page.locator('.dim-cover')).toHaveCSS('visibility', 'hidden');
};
