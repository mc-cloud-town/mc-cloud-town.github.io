import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { TRANSITIONS, type TransitionDef } from '@/constants/scenes';
import type { Dimension } from '#/dimensions/DimensionProvider';
import { onPageScrollHold } from './pageScroll';
import { mountSectionJumps } from './sectionJumps';
import { addTransition } from './transitions';

gsap.registerPlugin(ScrollTrigger);

export interface ChoreographyOptions {
  reduced: boolean;
  onDim: (d: Dimension) => void;
  onLedger: (index: number) => void;
}

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

  // ── going to a section ── (sectionJumps.ts: it moves the page built above, and creates no trigger of its own)
  const unjump = mountSectionJumps(root, {
    lenis,
    here: () => here,
    settle: () => settle(),
  });

  return () => {
    // first: a cut that is under way lets go of the cover and the page, and nothing asks for a jump any more
    unjump();
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
