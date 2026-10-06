import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { TRANSITIONS, type TransitionDef } from '@/constants/scenes';
import type { Dimension } from '#/dimensions/DimensionProvider';
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

  const ctx = gsap.context(() => {
    // Which dimension the reader is in. These triggers cover every section of the page, so they
    // are created last: by then each pin above a section has already added its scroll length.
    const dims = () =>
      gsap.utils.toArray<HTMLElement>('[data-dim]', root).forEach((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (s) =>
            s.isActive && opts.onDim(el.dataset.dim as Dimension),
        }),
      );

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

    // ── later tasks append here, in page order ──
    // Rule: one section at a time, top to bottom, and everything a section needs (its scene change, its drift,
    // its pin, its reveals(section)) is created together. A pin adds scroll length, so a trigger created before
    // a pin that sits above it on the page is measured wrong.

    // ── always last ──
    dims();
  }, root);

  return () => {
    gsap.ticker.remove(raf);
    if (lenis) gsap.ticker.lagSmoothing(500, 33); // back to GSAP's default
    lenis?.destroy();
    ctx.revert();
  };
};
