import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  COVER_HOLD_MS,
  clearCover,
  coverIn,
  coverOut,
  hideCoverWait,
  isPlainClick,
  nextFrame,
  showCoverWait,
  wait,
  type Leave,
} from './navigation';
import { holdPage } from './pageScroll';
import { pageKind, samePath, type PageKind } from './pages';

/**
 * Going from one page of the shell to another is a transition in two halves.
 *
 *  - Leave: the content of the page settles out (shell.css, `data-nav='leaving'`) while the cover comes in, in the
 *    ground of where it leads. Only under the whole cover does the router change the page.
 *  - Arrive: an inner page is mounted under the cover with its entrance held (`data-nav='covered'`), and the cover
 *    lifts onto that entrance. The home page's loader is its entrance: the cover is the loader's ground and is taken
 *    away the moment the loader is there, so the reader sees one cover, not two.
 *  - A legacy page gets the leave only. It is outside the shell: when the router shows it, the shell is taken down,
 *    and the cover, the hold and the step go with it (`resetPageTransition`, from `<PageTransitions />`).
 *
 *  - The page changes under the cover, always. A destination that is slow keeps the cover whole: it never lifts onto
 *    the page that was left. After a while the cover shows a sign of life (`<Cover />`), and past a hard limit the
 *    step is handed to the browser, which loads the destination as a document; the cover stays until that one unloads.
 *    A destination that cannot be fetched at all is handed to the browser by the router itself, the same way.
 *
 * The page is held from the click until the cover has gone again. A step through the history is never ours to
 * delay: it gets the arrival only, which the page plays by itself.
 * Whatever happens, the cover is taken away again and the page let go, once: every path below ends in `giveUp`
 * (before the router was asked), in an arrival, in `resetPageTransition`, in a new document, or in a later step
 * that takes both over.
 */

/** A cover that has been whole for this long shows that something is still happening. */
export const WAIT_SIGN_MS = 1200;
/** A destination that has not come by then is loaded by the browser instead, as a document. */
export const HARD_LIMIT_MS = 12000;

interface Router {
  push: (href: string) => void;
  prefetch: (href: string) => void;
}

interface Target {
  /** path, query and hash */
  href: string;
  path: string;
  kind: PageKind;
}

/** One step to another page, from the click to its arrival. */
interface Step extends Target {
  /** the router has been asked: from here on it is the arrival that is waited for */
  pushed: boolean;
  /** the two clocks that run while the destination is waited for: the sign of life, and the hard limit */
  sign?: number;
  limit?: number;
  /** Let the page go. Works once. */
  letGo: () => void;
  /** The router has put the new page in its place: that is where the page is kept from now on. */
  moved: () => void;
}

let router: Router | null = null;
/** The step that is under way. A later click, a step through the history or a restored page take its place. */
let step: Step | null = null;
/** The release of every hold on the page that a step has taken and not yet let go. */
const holds = new Set<() => void>();

/**
 * A step to another page is under way: from the click until its cover has gone again and the page is let go.
 * For that long the cover is the step's alone. A section jump of the home page (sectionJumps.ts) does not start,
 * and one that is running hands the cover over: it neither lifts it nor moves the page again.
 */
export const pageStepUnderWay = () => step !== null || holds.size > 0;

/** `<PageTransitions />` hands the router over while the shell is mounted; returns the release. */
export const setPageRouter = (r: Router) => {
  router = r;
  return () => {
    if (router === r) router = null;
  };
};

const setNav = (state: 'leaving' | 'covered' | null) => {
  const html = document.documentElement;
  if (state) html.dataset.nav = state;
  else delete html.dataset.nav;
};

/** Hold the page. The release works once, and `resetPageTransition` can pull it too. */
const hold = () => {
  const held = holdPage();
  const letGo = () => {
    holds.delete(letGo);
    held.release();
  };
  holds.add(letGo);
  return { letGo, moved: held.moved };
};

const sameOrigin = (href: string) => {
  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin ? url : null;
  } catch {
    return null;
  }
};

const stopClocks = (me: Step) => {
  window.clearTimeout(me.sign);
  window.clearTimeout(me.limit);
};

/**
 * The step ends on the page as it is: the content comes back, the cover lifts, and then the page is let go.
 * Only for a step that was sent away or failed before the router was asked: once it has been, the page that was
 * left is never shown again. Not for a step that was overtaken: the cover and the page then belong to whatever
 * took its place.
 */
const giveUp = async (me: Step, leave?: () => void | Promise<void>) => {
  if (step !== me) return;
  stopClocks(me);
  step = null;
  setNav(null);
  try {
    await leave?.();
  } finally {
    try {
      await coverOut();
    } finally {
      me.letGo();
    }
  }
};

const take = async (target: Target, leave?: Leave) => {
  // a step that is overtaken hands the page over: the later one holds it first, then the earlier one lets go
  const me: Step = { ...target, pushed: false, ...hold() };
  if (step) {
    stopClocks(step);
    step.letGo();
  }
  step = me;
  const stale = () => step !== me;
  setNav('leaving');
  let left = false;
  const go = () => {
    left = true;
    return leave?.();
  };
  try {
    // The page changes only under a whole cover. One that was sent away meanwhile covers nothing: no step.
    // The ground of where it leads: an inner page's is the theme's, the home page's is its loader's night.
    const whole = await coverIn({
      tone: me.kind === 'home' ? 'night' : 'theme',
    });
    if (stale() || !whole) return;
    // what the reader came from (the sheet) goes under the cover
    await go();
    if (stale()) return;
    setNav('covered');
    me.pushed = true;
    // From here the cover stays whole until the destination is in the document, however long that takes.
    const toBrowser = () => {
      // still this step's: the browser loads the destination, and the cover stays until this document is gone
      if (step === me) window.location.assign(me.href);
    };
    me.sign = window.setTimeout(showCoverWait, WAIT_SIGN_MS);
    me.limit = window.setTimeout(toBrowser, HARD_LIMIT_MS);
    if (router) router.push(me.href);
    // the shell has gone meanwhile: there is no router to ask
    else toBrowser();
  } finally {
    // sent away, or something threw: the page stays as it was
    if (!me.pushed) await giveUp(me, left ? undefined : go);
  }
};

/**
 * Take the reader to another page of the site, as a transition. True if the step was taken over (the caller
 * cancels the link's own navigation), false if the link is not ours: another site, not a page, this page.
 * `leave` is called under the whole cover, for what the reader came from (the menu sheet).
 */
export const goToPage = (href: string, { leave }: { leave?: Leave } = {}) => {
  const url = router && sameOrigin(href);
  if (!url) return false;
  const kind = pageKind(url.pathname);
  if (!kind || samePath(url.pathname, window.location.pathname)) return false;
  const target = url.pathname + url.search + url.hash;
  // asked for again while the reader is being taken there: the step under way is the answer
  if (step?.href !== target)
    void take({ href: target, path: url.pathname, kind }, leave);
  return true;
};

/** Fetch a page of the site ahead of the click, so that the cover waits for the network as little as can be. */
export const prefetchPage = (href: string) => {
  const url = router && sameOrigin(href);
  if (
    !url ||
    !pageKind(url.pathname) ||
    samePath(url.pathname, window.location.pathname)
  )
    return;
  router?.prefetch(url.pathname + url.search);
};

/**
 * The router has shown another page (`<PageTransitions />` calls this before the first paint of it).
 * If it is the one a step was taken to, this is its arrival; any other change of page is not ours.
 */
export const pageArrived = (pathname: string) => {
  const me = step;
  if (!me?.pushed || !samePath(me.path, pathname)) return;
  stopClocks(me);
  if (me.kind !== 'inner') {
    // The home page: its loader is there, whole, in the cover's own ground. The cover has done its part, and the
    // page is the home page's own from here (behind its loader it goes to the section a hash names).
    // (A legacy page does not arrive here: the shell, and this with it, is gone by then.)
    step = null;
    setNav(null);
    clearCover();
    me.letGo();
    return;
  }
  // the router has put the new page at its top: that is where it stays until the cover has gone
  me.moved();
  void (async () => {
    // one beat under the cover, and the new page's first frame painted under it; a sign of life eases out first
    await Promise.all([wait(COVER_HOLD_MS), nextFrame(), hideCoverWait()]);
    await nextFrame();
    if (step !== me) return;
    step = null;
    try {
      // the entrance is let go as the cover begins to lift: one movement
      setNav(null);
      await coverOut();
    } finally {
      me.letGo();
    }
  })();
};

/**
 * Nothing of a step is left: no cover, no hold, the content as it is. For whatever takes the page out of our hands:
 * a step through the history, a page restored from the back/forward cache, the shell itself going away.
 */
export const resetPageTransition = () => {
  if (!step && holds.size === 0) return;
  if (step) stopClocks(step);
  step = null;
  setNav(null);
  clearCover();
  [...holds].forEach((letGo) => letGo());
};

/** A link that is ours to follow: not one that opens a new tab or window, and not a download. */
export const isOwnLink = (a: HTMLAnchorElement) =>
  !(a.target && a.target !== '_self') && !a.hasAttribute('download');

/**
 * onClick for a link to another page. True if the step was taken over (the default navigation is cancelled),
 * false if the link should simply be followed.
 */
export const followPageLink = (
  e: ReactMouseEvent<HTMLAnchorElement>,
  opts: { leave?: Leave } = {},
) => {
  const a = e.currentTarget;
  if (!isPlainClick(e) || !isOwnLink(a) || !goToPage(a.href, opts))
    return false;
  e.preventDefault();
  return true;
};
