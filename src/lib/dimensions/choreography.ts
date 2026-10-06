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
    TRANSITIONS.slice(0, 1).forEach(change);

    // ── later tasks append here, in page order ──

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
