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
  /**
   * A touch screen (`pointer: coarse`: phones and tablets, not by width). The finger's scroll is the system's, moved
   * on its own thread a frame before the page's script can answer, so nothing that counters the scroll is made: no
   * slowing, no hold, no pin (spec 5.3.1). The desktop keeps the film as it is.
   */
  touch: boolean;
  onDim: (d: Dimension) => void;
  onLedger: (index: number) => void;
}

/**
 * The length of a dimension's opening that its words are carried over in the slow stretch: the stretch is a third of a
 * screen of scroll a line and a little more, and they are carried 0.62 of it (whole pixels: the layout below stays on
 * whole pixels, as the pinned ledger's place is read). The opening has this room at the foot of its text column in
 * every mode, so the page is as long with reduced motion (which carries nothing) as without.
 */
const stretchRun = (lines: number) => window.innerHeight * (0.33 * lines + 0.4);
const stretchCarry = (lines: number) => Math.round(stretchRun(lines) * 0.62);

/**
 * Every scroll-driven animation on the home page is created here, top to bottom.
 * Creation order is kept top to bottom all the same, but it no longer decides how triggers are measured: the
 * openings' triggers carry a `refreshPriority`, and any trigger with one makes ScrollTrigger sort all of them on every
 * refresh, by where their elements stand at that moment (before it reverts anything), the ones with a priority
 * last. That is safe here because the sort sees the page as it is laid out, the pin's spacer in place, so the
 * order is the page's order: a trigger below the ledger's pin is measured after the pin has taken its room.
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
      // No scrubbed motion: the scene simply switches when its section reaches the middle of the screen.
      // It is read from where the page is, not from what was passed on the way: a jump (a scrollbar drag, the End
      // key, a long list scrolled in one step) passes whole sections without any of them ever being on screen.
      const places = [
        { el: q('.hero'), scene: 'spawn' as string },
        ...TRANSITIONS.filter(has).map((def) => ({
          el: q(def.trigger),
          scene: def.to as string,
        })),
      ];
      let showing = '';
      const show = (id: string) => {
        if (id === showing) return;
        showing = id;
        gsap.utils
          .toArray<HTMLElement>('.scene', root)
          .forEach((s) =>
            gsap.set(s, { autoAlpha: s.dataset.scene === id ? 1 : 0 }),
          );
      };
      /** The scene of the last section whose top has reached the middle of the screen. */
      const sync = () => {
        const middle = window.innerHeight / 2;
        let id = 'spawn';
        for (const p of places)
          if (p.el && p.el.getBoundingClientRect().top <= middle) id = p.scene;
        show(id);
      };
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: sync,
        onRefresh: sync,
      });
      // The same layout as with motion, so a place on the page is the same place: each opening has the room its words
      // would be carried into at the foot of its text column (nothing is carried), measured again with every refresh.
      gsap.utils.toArray<HTMLElement>('.open', root).forEach((section) => {
        const text = section.firstElementChild as HTMLElement | null;
        const n = section.querySelectorAll('[data-say] span').length;
        if (!text || !n) return;
        const room = () => {
          text.style.paddingBottom = `${stretchCarry(n)}px`;
        };
        room();
        ScrollTrigger.create({ trigger: section, onRefreshInit: room });
      });
      dims();
      return;
    }

    // Lenis does the easing, so scrubbed timelines follow the scroll position directly
    // (the wheel's: a finger's scroll is not taken over, on a touch screen or any other)
    lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /**
     * One scene change, scrubbed over the screen of scroll in which its section comes up from the foot of the screen
     * to the head. The timeline is returned (it is normalised to length 1) for whatever else belongs to the change.
     */
    const change = (def: TransitionDef) => {
      if (!has(def)) return null;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: q(def.trigger),
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      });
      addTransition(tl, root, def);
      return tl;
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

    // The text reveals of one section: the name and the blocks rise. (The statement of a dimension's opening lights
    // up line by line in `opening`, below.)
    const reveals = (section: HTMLElement | null) => {
      if (!section) return;
      // On a touch screen the fades of a dimension's opening are short (about 0.4s): the words wait for the change
      // into the dimension, and then they are not to be waited for again (spec 5.3.1).
      const quick = opts.touch && section.matches('.open');
      gsap.utils.toArray<HTMLElement>('.vt', section).forEach((el) =>
        gsap.from(el, {
          yPercent: 12,
          opacity: 0,
          duration: quick ? 0.4 : 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        }),
      );
      gsap.utils.toArray<HTMLElement>('.rise', section).forEach((el) =>
        gsap.from(el, {
          y: 44,
          opacity: 0,
          duration: quick ? 0.4 : 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%' },
        }),
      );
    };

    /**
     * A dimension's opening: its words come in only once the change into it has played out (the opening begins a
     * screen lower than the change, see .open in home.css). They do not stop. Over a stretch of the page they are
     * carried down as the page goes up, by an ease that begins and ends at nothing: they slow down near the head of
     * the screen, stand almost still while the statement lights up line by line, dark to bright, and gather speed
     * again. The opening is that much longer at its foot, so nothing after it moves. The ScrollTrigger carries an
     * id (`open-nether`): a jump to the section lands in the middle of its stretch (sectionJumps.ts).
     */
    const opening = (section: HTMLElement | null) => {
      const lines = section
        ? gsap.utils.toArray<HTMLElement>('[data-say] span', section)
        : [];
      const text = section?.firstElementChild as HTMLElement | null;
      if (!section || !text || !lines.length) return;
      const name = section.querySelector<HTMLElement>('.vt');
      const tag = section.querySelector<HTMLElement>('.tag');
      // up to 860px the name leads the opening, written across, and is carried with the words
      const narrow = () => window.matchMedia('(max-width: 860px)').matches;
      // what the reader meets first: the name where it leads, above 860px the tag
      const title = () => (narrow() ? name : tag) ?? text;
      const run = () => stretchRun(lines.length);
      const carry = () => stretchCarry(lines.length);
      // The room the words are carried into is the text column's own, at its foot, not the section's padding: the
      // section's content is then that much taller, and the upright name (position: sticky, which holds only within
      // its grid area) holds beside the words through the whole stretch. The section keeps its own padding (home.css).
      // Set again before every refresh measures anything (another language has another number of lines, a resize
      // another screen): the sections below move with it.
      const room = () => {
        text.style.paddingBottom = `${carry()}px`;
      };
      room();
      // Where the scroll is not countered (a touch screen) the words go at the finger's pace: no stretch, nothing is
      // carried (the room above keeps the layout the same), and each line lights up as it crosses the middle of the
      // screen.
      if (opts.touch) {
        // (the room is measured again with every refresh, as with the stretch)
        ScrollTrigger.create({ trigger: section, onRefreshInit: room });
        lines.forEach((line) =>
          gsap.to(line, {
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: line,
              start: 'top 95%',
              end: 'top 65%',
              scrub: true,
            },
          }),
        );
        return;
      }
      const stretch = gsap
        .timeline({
          scrollTrigger: {
            id: `open-${section.id}`,
            trigger: section,
            // the slowing begins where it will leave the title a fifth of the way down the screen at its slowest,
            // half way through the stretch
            start: () =>
              `top+=${
                title().getBoundingClientRect().top -
                section.getBoundingClientRect().top -
                window.innerHeight * 0.2 -
                (run() - carry()) / 2
              } top`,
            end: () => `+=${run()}`,
            scrub: true,
            invalidateOnRefresh: true,
            onRefreshInit: room,
            // Measured after every other trigger, so after the holds above it (the ledger's) have taken their room.
            // (A priority turns ScrollTrigger's sort on for every refresh: see the note at the top of this file.)
            refreshPriority: -1,
          },
        })
        .fromTo(
          text,
          { y: 0 },
          {
            y: () => carry(),
            duration: 1,
            ease: 'sine.inOut',
          },
          0,
        )
        // Above 860px the name stands upright beside the words and holds by the stylesheet (position: sticky):
        // carried as well, it would be moved twice, and jump where its hold begins and ends.
        .fromTo(
          name,
          { y: 0 },
          {
            y: () => (narrow() ? carry() : 0),
            duration: 1,
            ease: 'sine.inOut',
          },
          0,
        );
      stretch.to(
        lines,
        { opacity: 1, duration: 0.24, stagger: 0.24, ease: 'none' },
        0.22,
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
    // A work's caption comes in when the change into its picture is seven tenths through (the section's top at 30% of
    // the screen): a work is not a dimension, and only the changes into a dimension are waited for (spec 5.3). On a
    // touch screen it comes in quickly as well (spec 5.3.1).
    const caption = (sec: Element) =>
      gsap.from(sec.querySelectorAll('.work > div > *'), {
        y: 36,
        opacity: 0,
        duration: opts.touch ? 0.4 : 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sec,
          start: 'top 30%',
          toggleActions: 'play none none reverse',
        },
      });
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
      caption(sec);
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
    opening(q('#overworld'));
    reveals(q('#overworld'));
    TRANSITIONS.slice(1, 4).forEach(work);

    // ── nether ──
    change(TRANSITIONS[4]);
    opening(q('#nether'));
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
    // On a touch screen the facilities are sections of their own (NetherLedger.tsx): the picture changes as a scene
    // change does, scrubbed over the section's entry (a dissolve between the stacked pictures, the next one settling
    // in), its caption comes in after that, and nothing is pinned.
    const shots = gsap.utils.toArray<HTMLElement>('[data-ledger-sec]', root);
    if (shots.length) {
      const imgs = gsap.utils.toArray<HTMLElement>('[data-ledger]', root);
      shots.forEach((sec, i) => {
        if (i > 0)
          gsap
            .timeline({
              scrollTrigger: {
                trigger: sec,
                start: 'top bottom',
                end: 'top top',
                scrub: true,
              },
            })
            .fromTo(
              imgs[i - 1],
              { opacity: 1 },
              { opacity: 0, duration: 1, ease: 'none', immediateRender: false },
              0,
            )
            .fromTo(
              imgs[i],
              { opacity: 0, scale: 1.06 },
              {
                opacity: 1,
                scale: 1,
                duration: 1,
                ease: 'none',
                immediateRender: false,
                force3D: false,
              },
              0,
            );
        caption(sec);
        // the facility the world is on (the Nether's veil has that picture's strength): from where its change is half
        // way
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 50%',
          onEnter: () => opts.onLedger(i),
          onLeaveBack: () => opts.onLedger(Math.max(0, i - 1)),
        });
      });
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
    opening(q('#end'));
    reveals(q('#end'));
    // the second and third camera moves: the first one belongs to the build before them on the page
    TRANSITIONS.slice(6, 8).forEach((def, i) => work(def, i + 1));
    // the credits simply scroll over the stars
    change(TRANSITIONS[8]);

    // ── respawn ── the white-out, then the first day again
    // The respawn stands in its own place: its words are under the white while it rises, and come up, rising a
    // little, one after another, as it clears. The mascot comes with them; its floating is a CSS animation
    // (home.css). They are part of the wake's own timeline, which is normalised to length 1: they end by 1, or the
    // wake itself would be squeezed.
    const wake = change(TRANSITIONS[9]);
    const blocks = root.querySelectorAll('.respawn .call > *');
    wake?.set(blocks, { opacity: 0 }, 0).fromTo(
      blocks,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.36,
        stagger: 0.02,
        ease: 'power2.out',
        immediateRender: false,
      },
      0.5,
    );
    // The credits' last line stays where it stands on the screen while the white rises over it (the words of the
    // section that is leaving may stand over its change), and is gone under the white when that is whole. It is
    // carried by half a screen over the first half of the wake, which is half a screen of scroll: the window's
    // size, so measured again with every refresh. (On a timeline of its own, over the same range: invalidating the
    // wake's, which holds the scenes, on every refresh left the last build's caption showing.)
    const fin = q('.credits .fin');
    // (on a touch screen it is not held: it scrolls away with the page, and is gone under the white when that is whole)
    if (wake && fin && opts.touch) wake.set(fin, { opacity: 0 }, 0.5);
    else if (wake && fin) {
      const held: gsap.core.Timeline = gsap
        .timeline({
          scrollTrigger: {
            trigger: q(TRANSITIONS[9].trigger),
            start: 'top bottom',
            end: 'top top',
            scrub: true,
            // the half screen is read again at the next render
            onRefreshInit: () => held.invalidate(),
          },
        })
        .fromTo(
          fin,
          { y: 0 },
          {
            y: () => window.innerHeight * 0.5,
            duration: 0.5,
            ease: 'none',
            immediateRender: false,
          },
          0,
        )
        .set(fin, { opacity: 0 }, 0.5)
        // as long as the change itself: the set above is half way through it
        .set({}, {}, 1);
    }

    // ── later tasks append here, in page order ──
    // Rule: one section at a time, top to bottom, and everything a section needs (its scene change, its drift,
    // its pin, its reveals(section)) is created together. Where a trigger is measured does not depend on it (the
    // sort at every refresh puts them in the page's order), but a section's own triggers are easier to read together.

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
    // the length each opening's text column was given at its foot
    root
      .querySelectorAll<HTMLElement>('.open > :first-child')
      .forEach((el) => (el.style.paddingBottom = ''));
    // whatever Lenis left on the document: the next page scrolls natively
    document.documentElement.classList.remove(
      'lenis',
      'lenis-smooth',
      'lenis-stopped',
      'lenis-scrolling',
    );
  };
};
