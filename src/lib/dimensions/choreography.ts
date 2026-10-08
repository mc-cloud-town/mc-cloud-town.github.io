import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { TRANSITIONS, type TransitionDef } from '@/constants/scenes';
import type { Dimension } from '#/dimensions/DimensionProvider';
import {
  COVER_HOLD_MS,
  clearCover,
  coverIn,
  coverOut,
  nextFrame,
  setSectionJumper,
  wait,
  type Leave,
} from './navigation';
import { onPageScrollHold } from './pageScroll';
import { addTransition } from './transitions';

gsap.registerPlugin(ScrollTrigger);

export interface ChoreographyOptions {
  reduced: boolean;
  onDim: (d: Dimension) => void;
  onLedger: (index: number) => void;
}

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

/**
 * Every scroll-driven animation on the home page is created here, top to bottom.
 * Order matters: the pinned nether ledger adds scroll length, so any trigger below it
 * must be created after it or its position is measured wrong.
 * Returns a cleanup function.
 */
export const buildChoreography = (
  root: HTMLElement,
  opts: ChoreographyOptions,
): (() => void) => {
  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    root.querySelector<T>(sel);
  const has = (def: TransitionDef) =>
    Boolean(
      q(def.trigger) &&
        q(`.scene[data-scene="${def.to}"]`) &&
        q(`.scene[data-scene="${def.from}"]`),
    );

  let lenis = null as Lenis | null;
  const raf = (t: number) => lenis?.raf(t * 1000);
  // an open overlay (the menu sheet) holds the page: the smooth scroll waits, and picks up where it was
  const unhold = onPageScrollHold((held) =>
    held ? lenis?.stop() : lenis?.start(),
  );

  /** The dimension the reader is in, as last reported. */
  let here: Dimension = 'overworld';
  /** Bring whatever eases after a scroll to its end at once: under a cover nothing should still be on its way. */
  let settle = () => {};

  const ctx = gsap.context(() => {
    // Which dimension the reader is in. These triggers cover every section of the page, so they
    // are created last: by then each pin above a section has already added its scroll length.
    const dims = () => {
      // the rail fills with the progress through the whole page (the reader's own position, so also with reduced motion)
      const fill = q('.rail b');
      if (fill) {
        const set = gsap.quickSetter(fill, 'scaleY');
        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: (s) => set(s.progress),
          onRefresh: (s) => set(s.progress),
        });
      }
      gsap.utils.toArray<HTMLElement>('[data-dim]', root).forEach((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (s) => {
            if (!s.isActive) return;
            here = el.dataset.dim as Dimension;
            opts.onDim(here);
          },
        }),
      );
    };

    if (opts.reduced) {
      // no scrubbed motion: the scene simply switches when its section reaches the middle of the screen
      const show = (id: string) =>
        gsap.utils
          .toArray<HTMLElement>('.scene', root)
          .forEach((s) =>
            gsap.set(s, { autoAlpha: s.dataset.scene === id ? 1 : 0 }),
          );
      ScrollTrigger.create({
        trigger: q('.hero'),
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (s) => s.isActive && show('spawn'),
      });
      TRANSITIONS.filter(has).forEach((def) =>
        ScrollTrigger.create({
          trigger: q(def.trigger),
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (s) => s.isActive && show(def.to),
        }),
      );
      dims();
      return;
    }

    // Lenis does the easing, so scrubbed timelines follow the scroll position directly
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const change = (def: TransitionDef) => {
      if (!has(def)) return;
      addTransition(
        gsap.timeline({
          scrollTrigger: {
            trigger: q(def.trigger),
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        }),
        root,
        def,
      );
    };

    // ── spawn ──
    gsap
      .timeline({
        scrollTrigger: {
          trigger: q('.hero'),
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
      .to(q('.hero .vt'), { yPercent: -30, opacity: 0, ease: 'power1.in' }, 0)
      .to(
        root.querySelectorAll('.hero-copy, .hero-meta'),
        { y: -80, opacity: 0, duration: 0.5 },
        0,
      );

    // The text reveals of one section: the statement lights up line by line, the label and the blocks rise.
    const reveals = (section: HTMLElement | null) => {
      if (!section) return;
      gsap.utils.toArray<HTMLElement>('[data-say]', section).forEach((el) =>
        gsap.to(el.querySelectorAll('span'), {
          opacity: 1,
          stagger: 0.5,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 72%',
            end: 'bottom 40%',
            scrub: true,
          },
        }),
      );
      gsap.utils.toArray<HTMLElement>('.vt', section).forEach((el) =>
        gsap.from(el, {
          yPercent: 12,
          opacity: 0,
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        }),
      );
      gsap.utils.toArray<HTMLElement>('.rise', section).forEach((el) =>
        gsap.from(el, {
          y: 44,
          opacity: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%' },
        }),
      );
    };

    // each build drifts its own way while it is on screen
    const CAM = [
      [{ scale: 1.14 }, { scale: 1.04 }],
      [
        { scale: 1.06, xPercent: 2 },
        { scale: 1.06, xPercent: -2 },
      ],
      [
        { scale: 1.04, yPercent: 1.5 },
        { scale: 1.1, yPercent: -1.5 },
      ],
    ] as const;
    const work = (def: TransitionDef, i: number) => {
      if (!has(def)) return;
      const sec = q(def.trigger)!,
        cam = q(`.scene[data-scene="${def.to}"] .cam`);
      change(def);
      gsap.fromTo(cam, CAM[i % 3][0], {
        ...CAM[i % 3][1],
        ease: 'none',
        immediateRender: false,
        scrollTrigger: {
          trigger: sec,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
      gsap.from(sec.querySelectorAll('.work > div > *'), {
        y: 36,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sec,
          start: 'top 30%',
          toggleActions: 'play none none reverse',
        },
      });
    };
    const drift = (
      trigger: string,
      scene: string,
      from: gsap.TweenVars,
      to: gsap.TweenVars,
    ) => {
      if (!q(trigger)) return;
      gsap.fromTo(q(`.scene[data-scene="${scene}"] .cam`), from, {
        ...to,
        ease: 'none',
        scrollTrigger: {
          trigger: q(trigger),
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    };

    // ── overworld ──
    change(TRANSITIONS[0]);
    drift(
      '#overworld',
      'town',
      { xPercent: -1.5, scale: 1.05 },
      { xPercent: 1.5, scale: 1.12 },
    );
    reveals(q('#overworld'));
    TRANSITIONS.slice(1, 4).forEach(work);

    // ── nether ──
    change(TRANSITIONS[4]);
    reveals(q('#nether'));
    const stage = q('.ledger-stage');
    if (stage) {
      const imgs = gsap.utils.toArray<HTMLElement>('[data-ledger]', root);
      let cur = 0;
      const show = (i: number) => {
        if (i === cur) return;
        cur = i;
        imgs.forEach((im, k) =>
          gsap.to(im, {
            opacity: k === i ? 1 : 0,
            scale: k === i ? 1 : 1.06,
            duration: 0.9,
            ease: 'power2.out',
            overwrite: true,
            // Stay 2D: by default GSAP lifts every tweened element onto its own layer for the length of the
            // tween, which here is six full-screen pictures at each step (measured: half the frames late).
            force3D: false,
          }),
        );
        opts.onLedger(i);
      };
      // Pinned at every viewport size, so a rotated phone needs no second code path (home.css trims the stage
      // to what fits on a short screen). The distance is measured again on every refresh.
      const step = (s: ScrollTrigger) =>
        show(Math.min(imgs.length - 1, Math.floor(s.progress * imgs.length)));
      ScrollTrigger.create({
        trigger: q('#ledger'),
        start: 'top top',
        end: () => `+=${window.innerHeight * 3}`,
        pin: stage,
        onUpdate: step,
        // a resize can land on another facility without a scroll in between
        onRefresh: step,
      });
      settle = () => gsap.getTweensOf(imgs).forEach((t) => t.progress(1));
    }
    // below the pin, so created after it
    reveals(q('.rank'));

    // ── the end ── (created after the pinned ledger, see the note at the top of this file)
    change(TRANSITIONS[5]);
    drift(
      '#end',
      'hall',
      { scale: 1.1, yPercent: 2 },
      { scale: 1.02, yPercent: -2 },
    );
    reveals(q('#end'));
    // the second and third camera moves: the first one belongs to the build before them on the page
    TRANSITIONS.slice(6, 8).forEach((def, i) => work(def, i + 1));
    // the credits simply scroll over the stars
    change(TRANSITIONS[8]);

    // ── respawn ── the white-out, then the first day again; the mascot rises with the title
    change(TRANSITIONS[9]);
    reveals(q('#respawn'));
    const pal = q('.pal');
    if (pal)
      // its floating is a CSS animation on `translate` and `rotate` (home.css), so this rise owns the transform alone
      gsap.from(pal, {
        y: 160,
        rotate: 8,
        opacity: 0,
        duration: 1.5,
        ease: 'expo.out',
        scrollTrigger: { trigger: q('.respawn h2'), start: 'top 80%' },
      });

    // ── later tasks append here, in page order ──
    // Rule: one section at a time, top to bottom, and everything a section needs (its scene change, its drift,
    // its pin, its reveals(section)) is created together. A pin adds scroll length, so a trigger created before
    // a pin that sits above it on the page is measured wrong.

    // ── always last ──
    dims();
  }, root);

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
    ScrollTrigger.update();
  };
  /** The dimension a place belongs to: its own section's, never the document's (`<html data-dim>` is where the reader is). */
  const dimOf = (el: HTMLElement) =>
    el.closest<HTMLElement>('main [data-dim]')?.dataset.dim as
      | Dimension
      | undefined;
  const place = (id: string) =>
    id === 'top'
      ? q('.hero')
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
  const arrive = (el: HTMLElement, id: string) => {
    anchor = { el, y: window.scrollY };
    // one entry in the history, however many sections the reader visits
    window.history.replaceState(
      window.history.state,
      '',
      id === 'top'
        ? window.location.pathname + window.location.search
        : `#${id}`,
    );
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
      // not called when the reader takes over with the wheel or a finger: then the page is theirs
      onComplete: () => arrive(el, id),
    });
  };
  const cut = async (el: HTMLElement, id: string, leave?: Leave) => {
    const mine = ++jumps;
    const stale = () => disposed || mine !== jumps;
    covered = true;
    // the reader is leaving the place they were kept on: a re-measure during the cut must not take them back
    anchor = null;
    // the ground of where it leads: the End is dark whatever the theme
    // Only under a whole cover does the page move: a cover that is still lifting from the jump before turns round
    // first. One that was taken away meanwhile (the page was restored from the cache) covers nothing: no jump.
    if (!(await coverIn({ tone: dimOf(el) === 'end' ? 'night' : 'theme' }))) {
      if (!stale()) covered = false;
      return;
    }
    if (stale()) return;
    const left = leave?.();
    moveTo(top(el));
    settle();
    await Promise.all([left, wait(COVER_HOLD_MS)]);
    await nextFrame();
    if (stale()) return;
    // the dimension has changed under the cover, and with it possibly the layout: measured once more
    moveTo(top(el));
    settle();
    arrive(el, id);
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
    await coverOut();
    if (!stale()) covered = false;
  };
  const unjump = setSectionJumper((id, leave) => {
    const el = place(id);
    if (!el) return false;
    const to = ORDER.indexOf(dimOf(el) ?? here);
    const y = top(el);
    if (lenis && !covered && Math.abs(to - ORDER.indexOf(here)) <= 1) {
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
  const landing =
    window.location.hash &&
    place(decodeURIComponent(window.location.hash.slice(1)));
  if (landing) {
    ScrollTrigger.refresh();
    moveTo(top(landing));
    settle();
    anchor = { el: landing, y: window.scrollY };
  }

  return () => {
    disposed = true;
    // leaving in the middle of a cut: the cover must not stay up over the next page
    if (covered) clearCover();
    unjump();
    window.removeEventListener('scroll', onScroll);
    ScrollTrigger.removeEventListener('refresh', onRefresh);
    unhold();
    gsap.ticker.remove(raf);
    if (lenis) gsap.ticker.lagSmoothing(500, 33); // back to GSAP's default
    lenis?.destroy();
    ctx.revert();
    // whatever Lenis left on the document: the next page scrolls natively
    document.documentElement.classList.remove(
      'lenis',
      'lenis-smooth',
      'lenis-stopped',
      'lenis-scrolling',
    );
  };
};
