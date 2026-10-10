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
import {
  recallHomePlace,
  rememberHomePlace,
  type HomePlace,
} from './homePlace';
import { holdPage, type PageHold } from './pageScroll';
import { picturesAt } from '@/constants/scenes';

/**
 * Going to a section of the home page: the jumps asked for by a link (travel or cut), the place the reader is kept
 * on when the page is measured again, arriving with a hash, and coming back to where the reader was (homePlace.ts).
 * It moves the page that choreography.ts has built and reads its ScrollTriggers; it creates none (every
 * ScrollTrigger is created in choreography.ts).
 */

/** The reader's place is written down this long after the page last moved. */
const REMEMBER_AFTER_MS = 120;

/** The dimensions in page order: a jump to the next or the previous one may travel, a jump further away cuts. */
const ORDER: Dimension[] = ['overworld', 'nether', 'end', 'respawn'];
/**
 * How far a travel may go, in screens. A neighbouring dimension can still be most of the page away (from the hero
 * to the Nether's opening: three builds; from the respawn to the End's: two builds and the credits): at a travel's
 * pace that is every transition on the way at once, which is what the cut is for. Within this distance there is
 * one boundary to ride, at most.
 */
const TRAVEL_REACH = 2.5;
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
  // A film moves between scenes in two ways: it travels, or it cuts. To the next or the previous dimension, if that
  // is near (TRAVEL_REACH), the page travels, so the reader rides the transition of that boundary. Further away,
  // in dimensions or in screens, it cuts under the cover: the page jumps while it is covered, and the cover lifts
  // on the target, whose opening plays again.
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
  // (the names of the credits arrive, the language changes, the window is resized). A reader who came back to
  // where they were is kept the same way, at their distance into the section (`back`).
  let anchor: { el: HTMLElement; y: number; back?: HomePlace } | null = null;
  /**
   * Where a remembered place is on the page as it is now. The same distance into the section, if the section is
   * as tall as it was. If it is not (the names of the credits are not in yet, the window has another size), the
   * distance is kept from the nearer end of the section: what grows in the middle of it then moves the far end.
   */
  const placeOf = (el: HTMLElement, back: HomePlace) => {
    const height = el.getBoundingClientRect().height;
    const into =
      Math.abs(height - back.height) <= 2 || back.into <= back.height / 2
        ? back.into
        : height - (back.height - back.into);
    return Math.min(
      Math.max(0, Math.round(top(el) + Math.max(0, into))),
      ScrollTrigger.maxScroll(window),
    );
  };
  const sections = () => [
    ...root.querySelectorAll<HTMLElement>(':scope > main > *'),
  ];
  /** The reader's place as it is now: the last section that has reached the head of the screen. */
  const measure = (): HomePlace | null => {
    const all = sections();
    let i = -1;
    let box: DOMRect | null = null;
    all.forEach((el, k) => {
      const r = el.getBoundingClientRect();
      if (r.top <= 1) [i, box] = [k, r];
    });
    if (!box) return null;
    const shown = (el: Element) => {
      const c = getComputedStyle(el);
      return c.visibility !== 'hidden' && +c.opacity > 0.01;
    };
    return {
      section: i,
      into: Math.round(-(box as DOMRect).top),
      height: Math.round((box as DOMRect).height),
      pictures: [...root.querySelectorAll<HTMLElement>('.world .scene')]
        .filter(shown)
        .flatMap((scene) => [...scene.querySelectorAll('img')])
        .filter((img) => img.getAttribute('src') && shown(img))
        .map((img) => img.getAttribute('src') as string),
    };
  };
  let remembering: number | undefined;
  const remember = () => {
    window.clearTimeout(remembering);
    remembering = undefined;
    // gone from the document (the reader has left): what was written last stands
    if (!root.isConnected) return;
    const now = measure();
    if (now) rememberHomePlace(now);
  };
  const onScroll = () => {
    if (anchor && Math.abs(window.scrollY - anchor.y) > 2) anchor = null;
    window.clearTimeout(remembering);
    remembering = window.setTimeout(remember, REMEMBER_AFTER_MS);
  };
  const onRefresh = () => {
    if (!anchor) return;
    const y = anchor.back ? placeOf(anchor.el, anchor.back) : top(anchor.el);
    anchor.y = y;
    if (Math.abs(window.scrollY - y) > 1) moveTo(y);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  // leaving for another document: the last place, also if the page moved a moment ago
  window.addEventListener('pagehide', remember);
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
    // The picture of the place the cut leads to is wanted before the others that are still on their way (all of
    // them were asked for when the loader lifted): the cover should lift on a picture, not on its ground.
    const wanted = picturesAt(id);
    if (wanted.length)
      root.querySelectorAll<HTMLImageElement>('.world img').forEach((img) => {
        if (wanted.includes(img.getAttribute('src') ?? ''))
          img.fetchPriority = 'high';
      });
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
    // in scroll pixels, as the page is now: the spacer of the pinned ledger is part of the way
    const near =
      Math.abs(y - window.scrollY) <= TRAVEL_REACH * window.innerHeight;
    if (
      lenis &&
      !covered &&
      Math.abs(to - ORDER.indexOf(opts.here())) <= 1 &&
      // (a travel that is under way goes on, wherever it started from)
      (near || lenis.userData.travel === el)
    ) {
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

  // Arriving somewhere other than the top: the loader is the cover. It is still whole now, so the page goes there
  // at once, measured with the pin in place.
  // A return to this visit (back, forward, reload) comes first: the reader is put where they were. The address
  // still names the section of their last jump, however far they have read on since, so on a return it does not
  // decide. A place is remembered for a visit only once the reader has been on it: a new visit has none.
  const back = recallHomePlace();
  const was = back && sections()[back.section];
  if (back && was) {
    // (remembered at the very top: the page is there already)
    if (back.section > 0 || back.into > 0) {
      ScrollTrigger.refresh();
      moveTo(placeOf(was, back));
      opts.settle();
      anchor = { el: was, y: window.scrollY, back };
    }
  } else {
    // Nothing remembered (a fresh load, a shared link, a new entry): an address that names a section says where.
    const hash = hashId(window.location.hash);
    const landing = hash && place(hash);
    if (landing) {
      ScrollTrigger.refresh();
      moveTo(top(landing));
      opts.settle();
      anchor = { el: landing, y: window.scrollY };
    }
  }

  return () => {
    disposed = true;
    // Leaving in the middle of a cut: the cover must not stay up over the next page, nor the page be held.
    // Not when it is a step that takes the reader away: the cover is the step's, and lifts on the page it leads to.
    if (covered && !pageStepUnderWay()) clearCover();
    hold?.release();
    hold = null;
    unjump();
    // the page moved a moment ago and has not been written down: now, while it can still be measured
    if (remembering !== undefined) remember();
    window.removeEventListener('pagehide', remember);
    window.removeEventListener('scroll', onScroll);
    ScrollTrigger.removeEventListener('refresh', onRefresh);
  };
};
