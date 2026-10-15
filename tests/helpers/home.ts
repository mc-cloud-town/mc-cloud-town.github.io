import { expect, type Page } from '@playwright/test';
import { TRANSITIONS } from '../../src/constants/scenes';

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
  /** opacity of a portal, the Nether's or the End's, whichever shows more (0 when both are hidden) */
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
        portal: Math.max(
          shown('canvas.portal[data-surface="nether"]'),
          shown('canvas.portal[data-surface="end"]'),
        ),
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

/**
 * Where a jump to `selector` lands, as a scroll position worked out from the layout alone; null for a place that is
 * landed on at its top (the section's own top is then what is read). An opening: the middle of its slow stretch (its
 * title a fifth of the way down), or, with reduced motion, which carries nothing, the place that puts the title
 * there; but never later than where the scene change after it begins (on a tall screen the middle can be past it).
 * The credits: their first heading a fifth of the way down (their top is a screen of scene alone: spec 5.3).
 */
export const landingOf = (page: Page, selector: string) =>
  page.evaluate(
    ([sel, triggers]) => {
      const el = document.querySelector<HTMLElement>(sel)!;
      const topOfEl = (e: Element) => e.getBoundingClientRect().top + scrollY;
      const offset = (words: HTMLElement) => {
        let o = 0;
        for (
          let e: HTMLElement | null = words;
          e && e !== el;
          e = e.offsetParent as HTMLElement | null
        )
          o += e.offsetTop;
        return o;
      };
      if (el.matches('.credits'))
        return Math.round(
          topOfEl(el.querySelector('.cast')!) - innerHeight * 0.2,
        );
      if (el.id === 'ledger' && el.querySelector('[data-ledger-sec]'))
        return Math.round(topOfEl(el)) + 2;
      if (!el.matches('.open')) return null;
      const narrow = matchMedia('(max-width: 860px)').matches;
      const title = el.querySelector<HTMLElement>(narrow ? '.vt' : '.tag')!;
      const lines = el.querySelectorAll('[data-say] span').length;
      const carry = Math.round(innerHeight * (0.33 * lines + 0.4) * 0.62);
      const still =
        matchMedia('(prefers-reduced-motion: reduce)').matches ||
        matchMedia('(pointer: coarse)').matches;
      let y =
        topOfEl(el) +
        offset(title) -
        innerHeight * 0.2 +
        (still ? 0 : carry / 2);
      for (const t of triggers) {
        const next = document.querySelector(t);
        if (next && next !== el && topOfEl(next) > topOfEl(el))
          y = Math.min(y, topOfEl(next) - innerHeight);
      }
      return Math.round(y);
    },
    [selector, TRANSITIONS.map((t) => t.trigger)] as const,
  );

/**
 * The page has come to rest where a jump to `selector` lands (`landingOf`, to within a few pixels; the section's top
 * to within one), and no cover is over it.
 */
export const landedOn = async (page: Page, selector: string) => {
  const to = await landingOf(page, selector);
  if (to === null) {
    await expect
      .poll(async () => Math.abs(await topOf(page, selector)), {
        message: `${selector} at the top`,
      })
      .toBeLessThanOrEqual(1);
  } else {
    await expect
      .poll(async () => Math.abs((await page.evaluate(() => scrollY)) - to), {
        message: `the page at ${to}, where a jump to ${selector} lands`,
      })
      .toBeLessThanOrEqual(3);
  }
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
  /** on the page's own clock */
  t: number;
  /** the hero's first picture is in */
  cover: boolean;
  pct: string;
  label: string;
  /** the page's script has taken the loader over (`html[data-live]`) */
  live: boolean;
  /** opacity of the loader's ground (0 when it is hidden) */
  ground: number;
  /**
   * opacity of the block that holds the map (0 while it is hidden): 0 until the loader has decided that a map is
   * needed, and below 1 again once the lift has begun
   */
  block: number;
  /** scale of the first scene's camera: 1.3 before the hero's arrival, 1 after it */
  cam: number;
  ready: boolean;
  colours: number;
  /** every colour on the map */
  palette: string[];
  centre: string;
  ring: string;
  inner: string;
  /** the chunk just inside the ring: the last of the square to be done */
  last: string;
  /** how many chunks of the square (17 × 17, the ring included) have been started */
  started: number;
  /** every chunk of the map, a letter for its colour: two frames with the same picture have the same string */
  picture: string;
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
        const cover = document.querySelector<HTMLImageElement>(
          '.scene.is-first img',
        );
        const shown = (el: Element) => {
          const c = getComputedStyle(el);
          return c.visibility === 'hidden' ? 0 : +c.opacity;
        };
        const cam = document.querySelector('.scene.is-first .cam');
        w.__loader.push({
          t: performance.now(),
          live: document.documentElement.hasAttribute('data-live'),
          ground: shown(document.querySelector('.loader')!),
          cam: cam ? new DOMMatrix(getComputedStyle(cam).transform).a : 1,
          cover: Boolean(cover?.complete && cover.naturalWidth > 0),
          pct: document.querySelector('.loader .pct')?.textContent ?? '',
          label: document.querySelector('.loader .stage')?.textContent ?? '',
          block: shown(block),
          ready:
            document.querySelector<HTMLElement>('.dim--home')?.dataset.ready ===
            'true',
          colours: all.size,
          palette: [...all],
          centre: at(10, 10),
          inner: at(13, 10),
          last: at(17, 10),
          picture: (() => {
            let out = '';
            for (let y = 0; y < map.height; y++)
              for (let x = 0; x < map.width; x++)
                out += String.fromCharCode(
                  97 + (d[(y * map.width + x) * 4] % 26),
                );
            return out;
          })(),
          started: (() => {
            let n = 0;
            for (let y = 2; y <= 18; y++)
              for (let x = 2; x <= 18; x++) if (at(x, y) !== '6,8,11') n++;
            return n;
          })(),
          ring: at(18, 10),
          border: at(19, 10),
          corner: at(0, 0),
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
/**
 * For a picture the loader waits for: answer it (`serve`) only once the loader has been recorded for `frames`
 * frames. Counted on the page, not on a clock: how soon the page draws its first frame is the machine's affair.
 */
export const afterLoaderFrames = async (
  page: Page,
  frames: number,
  serve: () => unknown,
) => {
  for (;;) {
    const seen = await page
      .evaluate(
        () => (window as unknown as { __loader?: unknown[] }).__loader?.length,
      )
      // (the page is on its way)
      .catch(() => 0);
    if ((seen ?? 0) >= frames) break;
    await new Promise((done) => setTimeout(done, 40));
  }
  await serve();
};

/**
 * A map that is shown is played in full, on every path: its first frame says 0 (or next to it), the number only
 * ever grows and never by a jump (a few points a frame at the most; more only as a frame was longer: the quickest
 * the map moves is under a tenth of a point a millisecond), it reaches 100, the finished map is seen whole on a ground
 * that is still whole, and nothing is lifted or handed over while it says less. Returns the frames it is shown in.
 */
export const expectFullRun = (frames: LoaderFrame[]) => {
  const number = (f: LoaderFrame) => Number(f.pct.replace('%', ''));
  const first = frames.findIndex((f) => f.block > 0);
  expect(first, 'the map is shown').toBeGreaterThanOrEqual(0);
  const shown = frames.slice(first);
  expect(number(shown[0]), 'it starts at 0').toBeLessThanOrEqual(2);
  shown.forEach((f, i) => {
    if (i === 0) return;
    const step = number(f) - number(shown[i - 1]);
    expect(step, `frame ${i}`).toBeGreaterThanOrEqual(0);
    expect(step, `frame ${i}`).toBeLessThanOrEqual(
      4 + 0.1 * (f.t - shown[i - 1].t),
    );
  });
  const full = shown.find((f) => f.pct === '100%')!;
  expect(full, 'it reaches 100%').toBeDefined();
  expect(full.ground).toBe(1);
  expect(full.block).toBe(1);
  expect(full.ready).toBe(false);
  // the run is a build that can be followed, never a blink: many values, over the planned two seconds at the least
  expect(new Set(shown.map(number)).size).toBeGreaterThan(30);
  expect(full.t - shown[0].t).toBeGreaterThan(1850);
  for (const f of shown.filter((f) => f.pct !== '100%')) {
    expect(f.ground, `whole at ${f.pct}`).toBe(1);
    expect(f.ready, `not handed over at ${f.pct}`).toBe(false);
  }
  return shown;
};

/** The frames of the lift of a loader that showed its map: from the map having been whole to its going. */
export const mapLifting = (frames: LoaderFrame[]) => {
  const whole = frames.findIndex((f) => f.block === 1);
  return whole < 0 ? [] : frames.slice(whole).filter((f) => f.block < 1);
};

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

/**
 * The sections whose words come in after the change into them (TRANSITIONS in scenes.ts), in page order. Not the
 * respawn: its words come up out of the white of the wake.
 */
export const WORDED = [
  '#overworld',
  '[data-work="overworld-0"]',
  '[data-work="overworld-1"]',
  '[data-work="overworld-2"]',
  '#nether',
  '#end',
  '[data-work="end-0"]',
  '[data-work="end-1"]',
  '#credits',
] as const;

/** Move the page to `y` and wait for the frame that draws it: scrubbed motion follows the scroll within a frame. */
export const scrollAt = (page: Page, y: number) =>
  page.evaluate(async (to) => {
    window.scrollTo({ top: to, behavior: 'instant' });
    await new Promise((done) =>
      requestAnimationFrame(() => requestAnimationFrame(done)),
    );
  }, y);

/**
 * Where the slow stretch of a dimension's opening is at its middle, as a scroll position, worked out from the
 * layout alone (the stretch is `0.33` of a screen a line and `0.4` over; the words are carried `0.62` of it; at the
 * middle the title stands a fifth of the way down, whatever the carry): the section's place, plus the title's place
 * in the section, less a fifth of a screen, plus half of what is carried by then.
 */
export const stretchOf = (page: Page, section: string) =>
  page.evaluate((sel) => {
    const sec = document.querySelector<HTMLElement>(sel)!;
    const narrow = matchMedia('(max-width: 860px)').matches;
    const title = sec.querySelector<HTMLElement>(narrow ? '.vt' : '.tag')!;
    const lines = sec.querySelectorAll('[data-say] span').length;
    const run = innerHeight * (0.33 * lines + 0.4);
    const carry = run * 0.62;
    // the title's place in the section, summed up the chain of what it is offset from (a block that is carried has a
    // transform, and is the next link)
    let offset = 0;
    for (
      let el: HTMLElement | null = title;
      el && el !== sec;
      el = el.offsetParent as HTMLElement | null
    )
      offset += el.offsetTop;
    const top = sec.getBoundingClientRect().top + scrollY;
    return {
      narrow,
      lines,
      run,
      mid: top + offset - innerHeight * 0.2 + carry / 2,
    };
  }, section);

/** The page is on a touch screen (`pointer: coarse`): nothing counters the scroll there, spec 5.3.1. */
export const onTouch = (page: Page) =>
  page.evaluate(() => matchMedia('(pointer: coarse)').matches);
