/**
 * The home page's loader, the part of it that is the same before and after the page's script has come: the map
 * (how it is laid out and drawn), the number it shows (what has come of what was missing, by what it costs to
 * fetch), and how the number moves.
 *
 * It is used twice. The page's script imports it (loaderMap.ts, Loader.tsx). And the served home page carries it
 * as a small script of its own, right behind the loader's markup (LoaderBoot.tsx), which shows the map and runs
 * it while the page's script, the heaviest thing on a slow line, is still on its way; the page's script then
 * takes the same run over where it stands.
 *
 * So that the two cannot drift, the served script is not written a second time: it is the text of the two
 * functions of this file (`loaderCore`, `loaderBoot`), taken when the page is built. Each of them therefore
 * stands entirely on its own: everything it needs, every number included, is inside it, and it refers to nothing
 * of this module or of any other. Keep it so.
 */

/** The map of one loader: for every chunk, at what progress it reaches each of its stages. */
export interface MapPlan {
  /** `stages[chunk]`: the progress (0..1] at which the chunk reaches stage 1, 2, …, in order */
  stages: number[][];
  /** how many stage changes there are in all */
  changes: number;
}

/** One script file of the page: where it is, what it costs (kB; 0 while that is not known), and whether it is in. */
export interface LoaderScript {
  url: string;
  kb: number;
  in: boolean;
}

/** One run of the loader: all there is to say about it, so that whoever takes it over continues where it stands. */
export interface LoaderRun {
  /** the loader this is the run of (a run is taken over only by the loader it was begun on) */
  el: Element | null;
  reduced: boolean;
  /** which build of the site the served page was (LoaderBoot.tsx) */
  build: string;
  /** when the map was shown; null while it is not (and it may never be) */
  shownAt: number | null;
  /** what the map shows (0..1), how fast it is moving (per second), and when it last took a step */
  p: number;
  v: number;
  steppedAt: number;
  /** how far the number has been told to go (it is never told to go back), since when, and where it is aimed */
  told: number;
  toldAt: number;
  aim: number;
  /** the wait is over: everything is in, or it was given up */
  over: boolean;
  /** the page's script has taken the run over */
  taken: boolean;
  /** the served script gave the page's script up, and the loader has given way to the served page */
  gone: boolean;
  /** per-chunk lateness (what makes the fronts ragged), and the map laid out with it */
  late: number[];
  plan: MapPlan;
  /** the page's script files */
  scripts: LoaderScript[];
  /** what else is waited for besides the fonts (the pictures, the page's shape), in kB: all of it, and what is in */
  othersAll: number;
  othersIn: number;
  fontsIn: boolean;
  /** the font files asked for so far, and those of them that have come; and when that was last looked up */
  files: { asked: number; came: number };
  countedAt: number;
  /** what was in when the map appeared: that much is not counted */
  was: { fontsIn: boolean; kb: number; came: number };
}

/** What the served script is told when the page is built. */
export interface BootConfig {
  build: string;
  /** what each script file of the site costs to fetch (kB as served, compressed), by the file's name */
  sizes: Record<string, number>;
}

declare global {
  interface Window {
    /** the run the served script began (LoaderBoot.tsx) */
    __ctecLoader?: LoaderRun;
  }
}

/** Everything the loader is made of. Stands on its own (see the head of this file). */
export const loaderCore = () => {
  /** The canvas is N × N pixels, one per chunk. */
  const MAP_SIZE = 21;
  /** The finished map is a (2R + 1) square; around it, a border two chunks wide. */
  const MAP_RADIUS = 8;
  const BORDER = 2;
  const CENTRE = (MAP_SIZE - 1) / 2;

  /** What shows where no chunk has started: the loader's own ground. */
  const MAP_GROUND = '#06080b';
  /** The Overworld accent of the night theme (tokens.css): the loader is always dark. */
  const MAP_FRONTIER = '#86cdff';
  /** The stages a chunk passes through, oldest first; the last one is "done". */
  const MAP_TONES = [
    '#0d1217',
    '#39424c',
    '#6f7984',
    '#9aa3ad',
    MAP_FRONTIER,
    '#f2f4f6',
  ];
  /**
   * How many stages a chunk at this distance from the centre goes through. The outer two rings never finish: they
   * stay at the first grey, like the border of a map. The edge of the square stops at the frontier colour: the
   * ring. Inside it chunks are done.
   */
  const stagesAt = (d: number) =>
    d > MAP_RADIUS ? 1 : d === MAP_RADIUS ? 4 : 5;
  /**
   * In which order the changes come: how far behind a chunk's first stage each later one follows (in the map's own
   * width: the band of chunks under way is about two rings deep, so at a half about half of the square is built)…
   */
  const LAGS = [0, 0.05, 0.1, 0.15, 0.2];
  /** …how far ahead of the fronts the border is laid, so that the last to come is the ring and what lies next to it… */
  const BORDER_EARLY = 0.25;
  /** …how much later the corners of a ring are than the middles of its sides (in rings): a ring closes towards them… */
  const CORNERS_LATE = 1;
  /** …and how ragged the fronts are (the lateness of each chunk, in the map's own width). */
  const RAGGED = 0.16;

  /**
   * One chunk at work at a time is drawn a stage back, for this long, and then the next one: about twelve changes
   * a second, small and local. Whose turn it is goes through the chunks under way in strides, never the same one
   * twice running.
   */
  const WORK_MS = 160;
  const WORK_STRIDE = 7919;

  /**
   * The run the map is given when it is shown: from nothing to the whole in this long, at a fairly even pace (a
   * little slower into it and out of it), so that every part of the range has its time on the screen. The loader
   * shows the lesser of this and what has really come: loading that is over early does not cut the run short, and
   * loading that is slow holds it back.
   */
  const MAP_RUN_S = 2;
  /** How far the planned run is `s` seconds after the map appeared (0..1). */
  const plannedRun = (s: number) => {
    const u = Math.min(1, Math.max(0, s / MAP_RUN_S));
    return 0.7 * u + 0.3 * u * u * (3 - 2 * u);
  };

  /**
   * A reader who is known to have everything (see WARM_KEY) is not shown a loading: the loader is only its ground,
   * and lifts as soon as the page can be handed over. Should something still be awaited this long after, the map
   * is shown after all, and played in full.
   */
  const MAP_GRACE_MS = 350;
  /** A map that comes after the grace comes as a state changes (--t-state), in the ease of anything that arrives. */
  const MAP_IN_S = 0.3;
  /** The finished square holds for a beat before the loader goes. */
  const HOLD_S = 0.18;
  /**
   * What a reader's browser remembers of a visit on which the home page was handed over: which build of the site
   * it was, and when. Who has such a mark of this build, not older than WARM_MS, has the page's files already and
   * is the only reader to whom the map is not shown at once. A guess: if it is wrong, the map comes after the
   * grace.
   */
  const WARM_KEY = 'ctec-home-loaded';
  const WARM_MS = 7 * 24 * 3600 * 1000;
  /**
   * For that reader the grace is for the page's script files: any of them not in by then is a wait like any other,
   * and the map is shown. With all of them in (from the browser's own store, at once) what is left is that script
   * starting, which takes a browser longer than the grace and is no loading: it is given until this long after
   * the loader was parsed, and then the map is shown all the same.
   */
  const WARM_START_MS = 1000;
  /**
   * How long the served script waits for the page's script once the map is up. After that (or as soon as a file
   * of that script fails to come) it is given up: the map runs up to the whole, and the loader gives way to the
   * served page, which can be read as it is.
   */
  const BOOT_LIMIT_MS = 20000;

  /**
   * What the map and the percentage show is one number: how much of what was still missing when the map appeared
   * has come since, by what it costs to fetch. What was in by then was never waited for and is not counted, so the
   * number starts at nothing and every point of it is something that arrived while the reader watched.
   * The costs: a script file of the page is what it weighs as it is served (written into the served page when the
   * site is built, LoaderBoot.tsx; about 280 kB for the home page, in a dozen files). The others are the sizes
   * measured on this site (2026-10): a font file is about 250 kB (a face of a Chinese typeface comes in slices;
   * the first screen asks for about twenty, 5 MB in all), a picture the page is handed over on about 130 kB.
   * The browser does not say how much of a file has come, so each counts when it is in.
   */
  const FONT_FILE_KB = 250;
  /**
   * Which font files are wanted is known only as the page is laid out: the fonts are counted by the files asked
   * for so far, looked up this often (and the script files with them), and never as quite all of them until the
   * browser says the fonts are ready (more may still be asked for).
   */
  const COUNT_MS = 150;
  const FONT_SHARE_MOST = 0.9;
  /**
   * While something is on its way the number drifts on, so that it does not look frozen: by this small part of what
   * is still missing at the most, approached in about this long. It never claims what has not come.
   */
  const DRIFT_SHARE = 0.12;
  const DRIFT_MS = 2500;
  /**
   * The number never jumps: when it has been held back and the rest comes at once, it catches up at this many
   * times the pace of the planned run at the most, easing into that pace.
   */
  const CATCH_UP = 2;
  const EASE_INTO_PER_S = 10;

  /** One number per chunk: how late it is. Random, so made where it is used (an effect), never during render. */
  const seedLateness = () => {
    const late: number[] = [];
    for (let i = 0; i < MAP_SIZE * MAP_SIZE; i++) late.push(Math.random());
    return late;
  };

  /**
   * Lay the map out: every stage change of every chunk in its order (from the centre outward, each ring closing
   * towards its corners, later stages behind earlier ones, ragged by each chunk's lateness), and then the changes
   * spread evenly over the progress, the last of them at 1.
   */
  const planMap = (late: number[]): MapPlan => {
    const order: { chunk: number; when: number }[] = [];
    const stages: number[][] = [];
    for (let y = 0; y < MAP_SIZE; y++)
      for (let x = 0; x < MAP_SIZE; x++) {
        const dx = Math.abs(x - CENTRE),
          dy = Math.abs(y - CENTRE);
        const d = Math.max(dx, dy);
        const reach =
          d > MAP_RADIUS
            ? d / (MAP_RADIUS + BORDER) - BORDER_EARLY
            : (d + (d ? (CORNERS_LATE * Math.min(dx, dy)) / d : 0)) /
              (MAP_RADIUS + BORDER);
        const chunk = y * MAP_SIZE + x;
        stages.push([]);
        for (let s = 0; s < stagesAt(d); s++)
          order.push({ chunk, when: reach + LAGS[s] + late[chunk] * RAGGED });
      }
    // (a chunk's own stages keep their order: each is later than the one before it)
    order.sort((a, b) => a.when - b.when);
    order.forEach((one, i) => stages[one.chunk].push((i + 1) / order.length));
    return { stages, changes: order.length };
  };

  /**
   * Draw the map at progress `p` (0..1). The finished square is drawn at 1, and at nothing less.
   * With `at` (a time in milliseconds) the chunks that are under way are at work: a few of them are drawn one
   * stage back for a moment. Without it the map is drawn as the progress alone has it.
   */
  const drawMap = (
    ctx: CanvasRenderingContext2D,
    p: number,
    plan: MapPlan,
    at?: number,
  ) => {
    ctx.fillStyle = MAP_GROUND;
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
    const stage = plan.stages.map((moments) => {
      let k = 0;
      while (k < moments.length && (p >= 1 || moments[k] <= p)) k++;
      return k;
    });
    if (at !== undefined && p < 1) {
      // under way: past its first stage (a chunk does not go back to the ground) and not at its last
      const working: number[] = [];
      stage.forEach((k, chunk) => {
        if (k > 1 && k < plan.stages[chunk].length) working.push(chunk);
      });
      const turn = Math.floor(at / WORK_MS);
      // (a single chunk under way takes every other turn)
      if (working.length > 1 || (working.length && turn % 2))
        stage[working[(turn * WORK_STRIDE) % working.length]] -= 1;
    }
    stage.forEach((k, chunk) => {
      if (k < 1) return;
      ctx.fillStyle = MAP_TONES[k];
      ctx.fillRect(chunk % MAP_SIZE, Math.floor(chunk / MAP_SIZE), 1, 1);
    });
  };

  /** The font files asked for so far, and those of them that have come. */
  const fontFiles = () => {
    let asked = 0;
    let came = 0;
    document.fonts.forEach((face) => {
      if (face.status === 'unloaded') return;
      asked++;
      if (face.status !== 'loading') came++;
    });
    return { asked, came };
  };

  /** A run that has not begun: nothing shown, nothing counted. */
  const newRun = (el: Element | null, reduced: boolean): LoaderRun => {
    const late = seedLateness();
    return {
      el,
      reduced,
      build: '',
      shownAt: null,
      p: 0,
      v: 0,
      steppedAt: 0,
      told: 0,
      toldAt: 0,
      aim: 0,
      over: false,
      taken: false,
      gone: false,
      late,
      plan: planMap(late),
      scripts: [],
      othersAll: 0,
      othersIn: 0,
      fontsIn: false,
      files: { asked: 0, came: 0 },
      countedAt: 0,
      was: { fontsIn: false, kb: 0, came: 0 },
    };
  };

  /**
   * The script files the page is made of, as the document names them (the ones it runs and the ones it asks for
   * ahead), each with what it costs (`sizes`, by the file's name). Not the scripts of others, and not the one kept
   * for browsers too old for the rest, which is never fetched here.
   */
  const scriptsOf = (sizes: Record<string, number>): LoaderScript[] => {
    const found: LoaderScript[] = [];
    document
      .querySelectorAll<
        HTMLScriptElement & HTMLLinkElement
      >('script[src],link[rel=preload][as=script]')
      .forEach((one) => {
        const url = one.src || one.href;
        if (
          one.noModule ||
          url.indexOf(location.origin + '/_next/static/') ||
          found.some((had) => had.url === url)
        )
          return;
        found.push({
          url,
          kb: sizes[url.slice(url.lastIndexOf('/') + 1)] || 0,
          in: false,
        });
      });
    return found;
  };

  /** What the script files cost: all of them, and those that are in (kB). */
  const scriptsKb = (run: LoaderRun) => {
    let all = 0;
    let came = 0;
    let known = 0;
    run.scripts.forEach((one) => {
      all += one.kb;
      if (one.kb) known++;
      if (one.in) came += one.kb;
    });
    // (a file whose cost is not known, which is every one where the site was not built, is taken to cost what
    // the known ones do on average; it is known when it is in)
    if (known) all += ((run.scripts.length - known) * all) / known;
    return { all, came };
  };

  /** Look up what has come (not more often than every COUNT_MS): the font files, and the script files. */
  const count = (run: LoaderRun, now: number) => {
    if (now - run.countedAt < COUNT_MS) return;
    run.countedAt = now;
    run.files = fontFiles();
    run.scripts.forEach((one) => {
      if (one.in) return;
      const seen = performance.getEntriesByName(one.url)[0] as
        | PerformanceResourceTiming
        | undefined;
      if (!seen || !seen.responseEnd) return;
      one.in = true;
      if (!one.kb) one.kb = seen.encodedBodySize / 1000;
    });
  };

  /** How much of what was missing when the map appeared has come since, by cost. */
  const real = (run: LoaderRun) => {
    const scripts = scriptsKb(run);
    // (the fonts are not ready: one file at the least is still to come, whether it has been asked for or not)
    const wanted = run.was.fontsIn
      ? 0
      : Math.max(1, run.files.asked - run.was.came);
    const came = run.fontsIn
      ? wanted
      : Math.min(run.files.came - run.was.came, wanted) * FONT_SHARE_MOST;
    const missing = scripts.all + run.othersAll - run.was.kb;
    const all = wanted * FONT_FILE_KB + missing;
    return all
      ? Math.max(
          0,
          (came * FONT_FILE_KB + scripts.came + run.othersIn - run.was.kb) /
            all,
        )
      : 0;
  };

  /**
   * The map is shown from here on, and its run begins: at nothing, whatever is in by now (that much is not
   * counted). With reduced motion it is the finished map, and nothing builds up to it.
   */
  const show = (run: LoaderRun, now: number) => {
    run.shownAt = now;
    run.steppedAt = now;
    run.countedAt = 0;
    count(run, now);
    run.was = {
      fontsIn: run.fontsIn,
      kb: scriptsKb(run).came + run.othersIn,
      came: run.files.came,
    };
    if (run.reduced) run.p = 1;
  };

  /**
   * One step of a map that is shown: the lesser of the planned run and what has come (which drifts a little while
   * it waits, and is the whole once the wait is over), approached without a jump. By the run's own clock, whoever
   * takes the step: the time since its last one.
   */
  const advance = (run: LoaderRun, now: number) => {
    if (run.shownAt === null) return;
    const elapsed = now - run.steppedAt;
    run.steppedAt = now;
    count(run, now);
    const at = Math.max(run.told, real(run));
    if (at !== run.told || !run.toldAt) {
      run.told = at;
      run.toldAt = now;
    }
    run.aim = run.over
      ? 1
      : Math.max(
          run.aim,
          at +
            DRIFT_SHARE *
              (1 - at) *
              (1 - Math.exp(-(now - run.toldAt) / DRIFT_MS)),
        );
    const goal = Math.min(plannedRun((now - run.shownAt) / 1000), run.aim);
    // (a long frame is not a long step)
    const s = Math.min(elapsed, 50) / 1000;
    if (!(s > 0)) return;
    const pace = Math.min(Math.max(0, goal - run.p) / s, CATCH_UP / MAP_RUN_S);
    run.v += (pace - run.v) * Math.min(1, EASE_INTO_PER_S * s);
    run.p = Math.min(goal, Math.max(run.p, run.p + run.v * s));
    if (run.p === goal) run.v = Math.min(run.v, pace);
  };

  /** Put the run on the screen as it stands: the map, and the number over it. */
  const paint = (
    run: LoaderRun,
    ctx: CanvasRenderingContext2D | null | undefined,
    pct: Element | null | undefined,
    now: number,
  ) => {
    // (with the time: the chunks under way are at work whether the number moves or not)
    if (ctx) drawMap(ctx, run.p, run.plan, run.reduced ? undefined : now);
    // (a hundred is the whole, never a rounding up to it)
    const said = Math.floor(run.p * 100 + 1e-9) + '%';
    if (pct && pct.textContent !== said) pct.textContent = said;
  };

  return {
    MAP_SIZE,
    MAP_RADIUS,
    MAP_GROUND,
    MAP_FRONTIER,
    MAP_TONES,
    MAP_RUN_S,
    MAP_GRACE_MS,
    MAP_IN_S,
    HOLD_S,
    WARM_KEY,
    WARM_MS,
    WARM_START_MS,
    BOOT_LIMIT_MS,
    plannedRun,
    seedLateness,
    planMap,
    drawMap,
    newRun,
    scriptsOf,
    count,
    real,
    show,
    advance,
    paint,
  };
};

export type LoaderCore = ReturnType<typeof loaderCore>;

/**
 * What the served home page runs the moment its loader has been parsed, long before the page's script (see the
 * head of this file). Stands on its own, and cannot throw into the page.
 *
 * The map is what a loader is for, so it is there at once: in the first frame that is painted, and at work from
 * then on, for as long as the reader waits. The one reader it is not shown to is the one known to have everything
 * (WARM_KEY): for them the block is hidden at once, and shown after all if the page's script has not taken over
 * within the grace.
 * The run is published (`window.__ctecLoader`), and the page's script continues it from where it stands
 * (Loader.tsx). Should that script never come, the loader does not stay: see BOOT_LIMIT_MS.
 * The fail-safe of the stylesheet (home.css, ten seconds) is for a page on which not even this has run: it is
 * called off here (`html[data-boot]`).
 */
export const loaderBoot = (core: LoaderCore, config: BootConfig) => {
  try {
    const root = document.documentElement;
    const el = document.querySelector('.dim--home .loader');
    const block = el && el.querySelector<HTMLElement>('.loader-in');
    if (!el || !block) return;
    const canvas = block.querySelector('canvas');
    const ctx = canvas && canvas.getContext('2d');
    const pct = block.querySelector('.pct');
    const run = core.newRun(
      el,
      matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    run.build = config.build;
    run.scripts = core.scriptsOf(config.sizes);
    window.__ctecLoader = run;
    root.setAttribute('data-boot', '');

    /** The loader gives way to the served page (home.css): the page's script was given up. */
    const leave = () => {
      if (run.taken) return;
      run.gone = true;
      root.setAttribute('data-boot', 'gone');
    };
    let leaving = false;
    const frame = () => {
      if (run.taken || run.gone) return;
      const now = performance.now();
      core.advance(run, now);
      core.paint(run, ctx, pct, now);
      // the finished square holds for a beat, and then the loader goes: only ever when the wait was given up
      if (run.p === 1 && run.over) {
        if (!leaving) setTimeout(leave, core.HOLD_S * 1000);
        leaving = true;
        return;
      }
      requestAnimationFrame(frame);
    };
    /** The page's script is given up: a map that is shown runs up to the whole first. */
    const giveUp = () => {
      if (run.taken || run.over) return;
      run.over = true;
      if (run.shownAt === null || run.reduced) leave();
    };
    const show = () => {
      if (run.taken || run.over || run.shownAt !== null) return;
      const now = performance.now();
      core.show(run, now);
      core.paint(run, ctx, pct, now);
      block.style.visibility = 'visible';
      block.style.opacity = '1';
      setTimeout(giveUp, core.BOOT_LIMIT_MS);
      if (!run.reduced) requestAnimationFrame(frame);
    };

    let warm = false;
    try {
      const mark = JSON.parse(localStorage.getItem(core.WARM_KEY) || 'null');
      warm =
        mark &&
        mark.build === config.build &&
        Math.abs(Date.now() - mark.at) < core.WARM_MS;
    } catch {
      // (no storage: not known to be warm)
    }
    if (warm) {
      const began = performance.now();
      block.style.visibility = 'hidden';
      block.style.opacity = '0';
      const after = () => {
        if (run.taken || run.over) return;
        const now = performance.now();
        run.countedAt = 0;
        core.count(run, now);
        // (every file is in, and the script is starting: looked at again in a moment)
        if (
          now - began < core.WARM_START_MS &&
          run.scripts.every((one) => one.in)
        )
          return void setTimeout(after, 50);
        block.style.transition =
          'opacity ' + core.MAP_IN_S + 's cubic-bezier(0.215,0.61,0.355,1)';
        show();
      };
      setTimeout(after, core.MAP_GRACE_MS);
    } else show();

    // a file of the page's script that fails to come: there is nothing to wait for
    document.addEventListener(
      'error',
      (event) => {
        const from = event.target as
          | (HTMLScriptElement & HTMLLinkElement)
          | null;
        if (
          from &&
          (from.tagName === 'SCRIPT' ||
            (from.tagName === 'LINK' && from.as === 'script')) &&
          (from.src || from.href || '').indexOf('/_next/static/') > 0
        )
          giveUp();
      },
      true,
    );
  } catch {
    // (the loader is then the stylesheet's, and the page's script's when it comes)
  }
};
