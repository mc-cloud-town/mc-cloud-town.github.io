import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import type { Dimension } from '#/dimensions/DimensionProvider';
import {
  COVER_HOLD_MS,
  clearCover,
  coverIn,
  coverOut,
  hashId,
  nextFrame,
  setSectionJumper,
  wait,
  type Leave,
} from './navigation';
import { pageStepUnderWay } from './pageTransition';
import { holdPage, type PageHold } from './pageScroll';

/**
 * Going to a section of the home page: the jumps asked for by a link (travel or cut), the place the reader is kept
 * on when the page is measured again, and arriving with a hash. It moves the page that choreography.ts has built
 * and reads its ScrollTriggers; it creates none (every ScrollTrigger is created in choreography.ts).
 */

/** The dimensions in page order: a jump to the next or the previous one travels, a jump further away cuts. */
const ORDER: Dimension[] = ['overworld', 'nether', 'end', 'respawn'];
/** A travel takes between these many seconds, longer the further it goes (in screens). */
const TRAVEL = { min: 1.2, max: 2.2, perScreen: 0.125 };
/**
 * The pace of a travel: it gathers speed over the first fifth of its time and spends the rest slowing down
 * (the curve of power3.out, as `.rise`). The last screen before the target is the transition of that boundary,
 * and so the reader gets about half of the travel's time to watch it.
 */
const RAMP = 0.2;
const RAMP_SHARE = (3 * RAMP) / (2 + RAMP); // where the two halves meet at the same speed
const travelEase = (t: number) =>
  t < RAMP
    ? RAMP_SHARE * (t / RAMP) ** 2
    : RAMP_SHARE + (1 - RAMP_SHARE) * (1 - (1 - (t - RAMP) / (1 - RAMP)) ** 3);

export interface SectionJumpsOptions {
  /** The smooth scroll of the page, or none (reduced motion): then every jump is a cut. */
  lenis: Lenis | null;
  /** The dimension the reader is in, as last reported. */
  here: () => Dimension;
  /** Bring whatever eases after a scroll to its end at once: under a cover nothing should still be on its way. */
  settle: () => void;
}

/**
 * Call once the page's ScrollTriggers exist (landing positions are measured with the pin in place).
 * Returns the cleanup: to be called before the smooth scroll and the triggers themselves are taken down.
 */
export const mountSectionJumps = (
  root: HTMLElement,
  opts: SectionJumpsOptions,
): (() => void) => {
  const { lenis } = opts;

  // ── going to a section ──
  // A film moves between scenes in two ways: it travels, or it cuts. To the next or the previous dimension the page
  // travels, so the reader rides the transition of that boundary. Further away it cuts under the cover: the page
  // jumps while it is covered, and the cover lifts on the target, whose opening plays again.
  const top = (el: HTMLElement) =>
    Math.min(
      Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY)),
      ScrollTrigger.maxScroll(window),
    );
  const moveTo = (y: number) => {
    if (lenis) {
      // Lenis learns the page's length from an observer, a moment late: right after the pin has added its
      // four screens it would still stop the jump at the old end of the page
      lenis.resize();
      lenis.scrollTo(y, { immediate: true, force: true });
    }
    // not `scrollTo(0, y)`: without Lenis the site's own smooth scrolling would carry the page there
    else window.scrollTo({ top: y, behavior: 'instant' });
    // a cut keeps the page where it is, and this is where it is now
    hold?.moved();
    ScrollTrigger.update();
  };
  /** The dimension a place belongs to: its own section's, never the document's (`<html data-dim>` is where the reader is). */
  const dimOf = (el: HTMLElement) =>
    el.closest<HTMLElement>('main [data-dim]')?.dataset.dim as
      | Dimension
      | undefined;
  const place = (id: string) =>
    id === 'top'
      ? root.querySelector<HTMLElement>('.hero')
      : root.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`) ?? null;

  // Whoever was taken to a section and has not scrolled since stays on it when the page is measured again
  // (the names of the credits arrive, the language changes, the window is resized).
  let anchor: { el: HTMLElement; y: number } | null = null;
  const onScroll = () => {
    if (anchor && Math.abs(window.scrollY - anchor.y) > 2) anchor = null;
  };
  const onRefresh = () => {
    if (!anchor) return;
    const y = top(anchor.el);
    anchor.y = y;
    if (Math.abs(window.scrollY - y) > 1) moveTo(y);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  ScrollTrigger.addEventListener('refresh', onRefresh);

  /** Each jump has a number: one that was overtaken by a later one stops where it is. */
  let jumps = 0;
  let disposed = false;
  /** The cover is up, or on its way: until it is gone, any further jump is a cut under the same cover. */
  let covered = false;
  /**
   * A cut keeps the page where it is from the click until its cover has gone: while a cover can be seen through,
   * only the cut itself may move the page, under the whole cover. One hold for all the cuts that are under way
   * (a later one overtakes an earlier one, and each lets go once): the page is free when the last has ended.
   */
  let hold: PageHold | null = null;
  let cuts = 0;
  const keep = () => {
    if (cuts++ === 0) hold = holdPage();
    let mine = true;
    return () => {
      if (!mine) return;
      mine = false;
      if (--cuts > 0) return;
      hold?.release();
      hold = null;
    };
  };
  /** Where the cut that is under way leads, and whether the page has been put there: until its cover has gone. */
  let cutting: { el: HTMLElement; landed: boolean } | null = null;
  const arrive = (el: HTMLElement, id: string) => {
    anchor = { el, y: window.scrollY };
    // one entry in the history, however many sections the reader visits
    try {
      window.history.replaceState(
        window.history.state,
        '',
        id === 'top'
          ? window.location.pathname + window.location.search
          : `#${id}`,
      );
    } catch {
      // a browser may refuse (the address was replaced too often): the reader has arrived all the same
    }
    (el.matches('[data-heading]')
      ? el
      : el.querySelector<HTMLElement>('[data-heading]')
    )?.focus({ preventScroll: true });
  };
  const travel = (el: HTMLElement, id: string, y: number) => {
    const screens = Math.abs(y - window.scrollY) / window.innerHeight;
    anchor = null;
    lenis!.resize();
    lenis!.scrollTo(y, {
      duration: Math.min(TRAVEL.max, TRAVEL.min + screens * TRAVEL.perScreen),
      easing: travelEase,
      force: true,
      // Lenis keeps this for as long as the travel is the scroll that is running: it drops it when the travel
      // ends, and when the reader takes over
      userData: { travel: el },
      // not called when the reader takes over with the wheel or a finger: then the page is theirs
      onComplete: () => arrive(el, id),
    });
  };
  const cut = async (el: HTMLElement, id: string, leave?: Leave) => {
    const mine = ++jumps;
    // Overtaken by a later jump, or the page has gone; or a step to another page has begun (pageTransition.ts):
    // from then on the cover is that step's. The cut stops where it is: it does not move the page again and does
    // not lift the cover, and lets go of its own hold only (the step took its own at the click, before this).
    const stale = () => disposed || mine !== jumps || pageStepUnderWay();
    covered = true;
    const letGo = keep();
    const me: NonNullable<typeof cutting> = { el, landed: false };
    cutting = me;
    // the reader is leaving the place they were kept on: a re-measure during the cut must not take them back
    anchor = null;
    let left = false;
    const go = () => {
      left = true;
      return leave?.();
    };
    try {
      // Only under a whole cover does the page move: a cover that is still lifting from the jump before turns round
      // first. One that was taken away meanwhile (the page was restored from the cache) covers nothing: no jump.
      // The ground of where it leads: the End is dark whatever the theme.
      if (!(await coverIn({ tone: dimOf(el) === 'end' ? 'night' : 'theme' })))
        return;
      // overtaken by a later jump, or the place itself has gone from the page: nowhere to take the reader
      if (stale() || !el.isConnected) return;
      const gone = go();
      moveTo(top(el));
      opts.settle();
      await Promise.all([gone, wait(COVER_HOLD_MS)]);
      await nextFrame();
      if (stale() || !el.isConnected) return;
      // the dimension has changed under the cover, and with it possibly the layout: measured once more
      moveTo(top(el));
      opts.settle();
      arrive(el, id);
      me.landed = true;
      // the opening of the target plays again as the cover lifts
      ScrollTrigger.getAll().forEach((st) => {
        if (
          st.animation &&
          !st.vars.scrub &&
          st.progress > 0 &&
          st.trigger &&
          el.contains(st.trigger)
        )
          st.animation.restart();
      });
    } finally {
      // However the cut ended (landed, nowhere to go, something threw), the cover it brought is taken away again
      // and the page is the reader's. Not by a cut that was overtaken: the cover then belongs to the later jump,
      // which lifts it itself. And not after the page has gone: its cleanup has cleared the cover already.
      try {
        // what the reader came from (the sheet) goes in any case, and the cover lifts only when it has
        if (!left && !stale()) await go();
      } finally {
        try {
          if (!stale()) await coverOut();
          // Lifted, or handed over to a step (before the lift or during it): either way the cover is not this
          // cut's any more, also not for the cleanup below. A later jump keeps what is its own.
          if (!disposed && mine === jumps) {
            covered = false;
            cutting = null;
          }
        } finally {
          // with the cover, or without it for a cut that was overtaken: the page is held by the later one then
          letGo();
        }
      }
    }
  };
  const unjump = setSectionJumper((id, leave) => {
    const el = place(id);
    if (!el) return false;
    // the reader is on the way to another page: a link to a section is not followed, and not as a plain link either
    if (pageStepUnderWay()) return true;
    // Asked for again while the page is already being taken there: the jump that is under way is the answer.
    // A cut: until its cover has gone, unless the reader has arrived and scrolled on since.
    if (cutting?.el === el && (!cutting.landed || anchor?.el === el))
      return true;
    const to = ORDER.indexOf(dimOf(el) ?? opts.here());
    const y = top(el);
    if (lenis && !covered && Math.abs(to - ORDER.indexOf(opts.here())) <= 1) {
      // a travel: for as long as it is the one that moves the page
      if (lenis.userData.travel === el) {
        void leave?.();
        return true;
      }
      jumps++;
      void leave?.();
      if (Math.abs(y - window.scrollY) <= 1) arrive(el, id);
      else travel(el, id, y);
    } else {
      // with reduced motion there is no travel: every jump is a cut, behind a brief fade
      void cut(el, id, leave);
    }
    return true;
  });

  // Arriving with a hash: the loader is the cover. It is still whole now, so the page goes there at once,
  // measured with the pin in place.
  const hash = hashId(window.location.hash);
  const landing = hash && place(hash);
  if (landing) {
    ScrollTrigger.refresh();
    moveTo(top(landing));
    opts.settle();
    anchor = { el: landing, y: window.scrollY };
  }

  return () => {
    disposed = true;
    // Leaving in the middle of a cut: the cover must not stay up over the next page, nor the page be held.
    // Not when it is a step that takes the reader away: the cover is the step's, and lifts on the page it leads to.
    if (covered && !pageStepUnderWay()) clearCover();
    hold?.release();
    hold = null;
    unjump();
    window.removeEventListener('scroll', onScroll);
    ScrollTrigger.removeEventListener('refresh', onRefresh);
  };
};
