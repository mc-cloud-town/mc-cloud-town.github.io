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

/** Opacity of the white-out, 0 while it is hidden. */
export const flashState = (page: Page) =>
  page.locator('.flash').evaluate((el) => {
    const s = getComputedStyle(el);
    return s.visibility === 'hidden' ? 0 : +s.opacity;
  });
/** Without smooth scrolling the site's own `scroll-behavior` would carry the page there: jump instead. */
export const jumpTo = (page: Page, sel: string, off = 0) =>
  page.evaluate(
    ([s, o]) => {
      const el = document.querySelector(s as string)!;
      window.scrollTo({
        top:
          el.getBoundingClientRect().top +
          window.scrollY +
          (o as number) * window.innerHeight,
        behavior: 'instant',
      });
    },
    [sel, off] as const,
  );

/** Pictures of the nether ledger that are showing (their indices). */
export const shownPictures = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-ledger]')]
      .filter((i) => +getComputedStyle(i).opacity > 0.5)
      .map((i) => i.dataset.ledger),
  );

/** One frame of the loader, as `watchLoader` records it. */
export interface LoaderFrame {
  pct: string;
  label: string;
  /** opacity of the block that holds the map: below 1 once the lift has begun */
  block: number;
  ready: boolean;
  colours: number;
  /** every colour on the map */
  palette: string[];
  centre: string;
  ring: string;
  inner: string;
  border: string;
  corner: string;
}
/** Record the loader on every frame from the very first one. */
export const watchLoader = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __loader: unknown[] };
    w.__loader = [];
    const tick = () => {
      const map = document.querySelector<HTMLCanvasElement>('.loader canvas');
      const block = document.querySelector('.loader-in');
      if (map && block) {
        const d = map
          .getContext('2d')!
          .getImageData(0, 0, map.width, map.height).data;
        const at = (x: number, y: number) => {
          const i = (y * map.width + x) * 4;
          // nothing drawn yet: the loader's own ground shows through
          return d[i + 3] === 0 ? '6,8,11' : `${d[i]},${d[i + 1]},${d[i + 2]}`;
        };
        const all = new Set<string>();
        for (let y = 0; y < map.height; y++)
          for (let x = 0; x < map.width; x++) all.add(at(x, y));
        w.__loader.push({
          pct: document.querySelector('.loader .pct')?.textContent ?? '',
          label: document.querySelector('.loader .stage')?.textContent ?? '',
          block: +getComputedStyle(block).opacity,
          ready:
            document.querySelector<HTMLElement>('.dim--home')?.dataset.ready ===
            'true',
          colours: all.size,
          palette: [...all],
          centre: at(10, 10),
          inner: at(13, 10),
          ring: at(18, 10),
          border: at(19, 10),
          corner: at(0, 0),
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
export const loaderFrames = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __loader: LoaderFrame[] }).__loader,
  );

/** One frame of `recordHeld`. */
export interface HeldFrame {
  cover: number;
  y: number;
  inert: boolean;
  stopped: boolean;
  wheel: boolean;
}

/**
 * Record on every frame from now on: the cover, the page, and whether the page is held (inert, smooth scroll stopped);
 * and once, while the cover comes in, a turn of the wheel. Read the frames with `heldFrames`.
 */
export const recordHeld = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as {
      __held: {
        cover: number;
        y: number;
        inert: boolean;
        stopped: boolean;
        wheel: boolean;
      }[];
      __heldRaf: number;
    };
    w.__held = [];
    let wheeled = false;
    const tick = () => {
      const el = document.querySelector('.dim-cover')!;
      const c = getComputedStyle(el);
      const cover = c.visibility === 'hidden' ? 0 : +c.opacity;
      let wheel = false;
      if (!wheeled && cover > 0.3 && cover < 0.9) {
        wheeled = wheel = true;
        document.elementFromPoint(195, 500)!.dispatchEvent(
          new WheelEvent('wheel', {
            deltaY: 400,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
      w.__held.push({
        cover,
        y: Math.round(window.scrollY),
        inert: document.querySelector('main')!.inert,
        stopped: document.documentElement.classList.contains('lenis-stopped'),
        wheel,
      });
      w.__heldRaf = requestAnimationFrame(tick);
    };
    w.__heldRaf = requestAnimationFrame(tick);
  });

export const heldFrames = (page: Page): Promise<HeldFrame[]> =>
  page.evaluate(() => {
    const w = window as unknown as { __held: HeldFrame[]; __heldRaf: number };
    cancelAnimationFrame(w.__heldRaf);
    return w.__held;
  });

/** One frame of `watchLanding`. */
export interface LandingFrame {
  loader: number;
  top: number;
  scenes: string;
}

/** From the first frame of the next page: is the loader still whole, where is the target (`id`: a selector), which scenes show? */
export const watchLanding = (page: Page, id: string) =>
  page.addInitScript((id) => {
    const w = window as unknown as {
      __seen: { loader: number; top: number; scenes: string }[];
    };
    w.__seen = [];
    const tick = () => {
      const loader = document.querySelector('.loader');
      const target = document.querySelector(id);
      if (document.querySelector('.dim--home') && target) {
        const s = loader && getComputedStyle(loader);
        w.__seen.push({
          loader: !s || s.visibility === 'hidden' ? 0 : +s.opacity,
          top: Math.round(target.getBoundingClientRect().top),
          scenes: [...document.querySelectorAll<HTMLElement>('.scene')]
            .filter((el) => {
              const c = getComputedStyle(el);
              return c.visibility !== 'hidden' && +c.opacity > 0.5;
            })
            .map((el) => el.dataset.scene)
            .join('+'),
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, id);

export const landingFrames = (page: Page): Promise<LandingFrame[]> =>
  page.evaluate(() => (window as unknown as { __seen: LandingFrame[] }).__seen);

/**
 * The arrival that follows the loader has played out: the bar, the last line of the hero and the last sign of the
 * title all stand whole in their places. (Its parts start one after another, so "nothing moves" is true before
 * it begins as well; this waits for its end.)
 */
export const arrived = async (page: Page) => {
  await ready(page);
  await expect(page.locator('.dim-bar')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero .cue')).toHaveCSS('opacity', '1');
  await expect
    .poll(
      () =>
        page
          .locator('.hero h1 b')
          .last()
          .evaluate((el) => {
            const m = new DOMMatrix(getComputedStyle(el).transform);
            const c = new DOMMatrix(
              getComputedStyle(
                document.querySelector('.scene.is-first .cam')!,
              ).transform,
            );
            return Math.abs(m.m42) < 0.5 && Math.abs(c.a - 1) < 0.001;
          }),
      { message: 'the title has risen and the camera has settled' },
    )
    .toBe(true);
};
