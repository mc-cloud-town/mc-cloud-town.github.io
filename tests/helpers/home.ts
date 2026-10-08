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
      // the same moves, with where the page was last drawn and whether the next frame drew it there: `coverAtMoves`
      __moves: {
        to: number;
        cover: number;
        at: number;
        from: number;
        painted?: boolean;
      }[];
      __drawn: number;
    };
    log.__jumps = [];
    log.__runs = [];
    log.__moves = [];
    if (!log.__scrollTo) {
      log.__drawn = window.scrollY;
      const frame = () => {
        for (const m of log.__moves)
          m.painted ??=
            Math.abs(window.scrollY - m.to) <= 2 &&
            Math.abs(m.from - m.to) > window.innerHeight;
        log.__drawn = window.scrollY;
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
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
        ) {
          const cover = shown('.dim-cover');
          const at = performance.now();
          log.__jumps.push([to, cover, at]);
          log.__moves.push({ to, cover, at, from: log.__drawn });
        }
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

/** One move of the page by more than a screen: where to, the cover's opacity at that very moment, and when. */
export interface Move {
  to: number;
  cover: number;
  at: number;
}

/**
 * Every move of the page by more than a screen that was painted, since `record`, in order: the page was drawn
 * somewhere else in the frame before, and is drawn at the new place in the frame after. A re-measure is not one:
 * it takes the page to the top and back within one task, however long that task is, and no frame shows it.
 */
export const coverAtMoves = (page: Page): Promise<Move[]> =>
  page.evaluate(
    () =>
      new Promise<Move[]>((done) =>
        // the frame after the last move has to have come
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            done(
              (
                window as unknown as {
                  __moves: (Move & { painted?: boolean })[];
                }
              ).__moves
                .filter((m) => m.painted)
                .map(({ to, cover, at }) => ({ to, cover, at })),
            ),
          ),
        ),
      ),
  );

/**
 * A moment of a cut, as the cover shows it:
 * `coming`: the cover is on its way in (between 0.3 and 0.9, not yet whole);
 * `whole`: the cover is whole and the page has been moved under it;
 * `lifting`: the cover has been whole and has fallen below `below`.
 */
export type Moment = 'coming' | 'whole' | 'lifting';

/** What the page was like when `clickAt` clicked. */
export interface Clicked {
  cover: number;
  y: number;
  t: number;
}

/**
 * Arm a click on `selector` for the first frame in which the cut that follows is at `moment`. The click is made
 * inside the page, in that frame: from outside, the moment would have passed. Read the result with `clickedAt`.
 */
export const clickAt = (
  page: Page,
  selector: string,
  moment: Moment,
  below = 0.99,
) =>
  page.evaluate(
    ([sel, when, under]) => {
      const w = window as unknown as { __clicked?: Clicked };
      delete w.__clicked;
      const y0 = window.scrollY;
      let wasWhole = false;
      const tick = () => {
        const el = document.querySelector('.dim-cover');
        const c = el && getComputedStyle(el);
        const cover = !c || c.visibility === 'hidden' ? 0 : +c.opacity;
        const now =
          when === 'coming'
            ? !wasWhole && cover > 0.3 && cover < 0.9
            : when === 'whole'
              ? cover === 1 && Math.abs(window.scrollY - y0) > 2
              : wasWhole && cover < under;
        if (cover === 1) wasWhole = true;
        if (!now) return requestAnimationFrame(tick);
        w.__clicked = { cover, y: window.scrollY, t: performance.now() };
        document.querySelector<HTMLElement>(sel)!.click();
      };
      requestAnimationFrame(tick);
    },
    [selector, moment, below] as const,
  );

export const clickedAt = async (page: Page): Promise<Clicked> =>
  (
    await page.waitForFunction(
      () => (window as unknown as { __clicked?: Clicked }).__clicked,
    )
  ).jsonValue() as Promise<Clicked>;

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
