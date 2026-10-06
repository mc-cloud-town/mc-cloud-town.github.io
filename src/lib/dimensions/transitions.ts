import type { TransitionDef } from '@/constants/scenes';

const layer = (root: HTMLElement, id: string) => {
  const el = root.querySelector<HTMLElement>(`.scene[data-scene="${id}"]`);
  if (!el) throw new Error(`scene "${id}" is not in the world`);
  return { el, zoom: el.querySelector<HTMLElement>('.zoom')! };
};

/**
 * Write one scene change into a normalised 0..1 timeline. Whole layers move with transform and opacity only.
 *   push     dissolve while pushing in
 *   curtain  next scene rises from the bottom edge
 *   slide    next scene comes in from the right
 *   portal   the portal canvas covers the screen, the scene swaps behind it
 *   fall     old scene spins away and shrinks, next one turns into place
 *   wake     white-out, then the world again
 */
export const addTransition = (
  tl: gsap.core.Timeline,
  root: HTMLElement,
  def: TransitionDef,
) => {
  const A = layer(root, def.from),
    B = layer(root, def.to);
  const im = { immediateRender: false },
    io = 'power2.inOut';

  if (def.fx === 'curtain' || def.fx === 'slide') {
    const p = def.fx === 'curtain' ? 'yPercent' : 'xPercent';
    // the layer moves in while its content moves the opposite way by the same amount: the picture stays put and is revealed
    // Not a set(): a zero-length step at the very start is not undone when the scroll comes back to it,
    // which would leave the layer switched on, parked just off screen.
    tl.fromTo(
      B.el,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.001, ease: 'none', ...im },
      0,
    )
      .fromTo(B.el, { [p]: 100 }, { [p]: 0, duration: 1, ease: io, ...im }, 0)
      .fromTo(
        B.zoom,
        { [p]: -100 },
        { [p]: 0, duration: 1, ease: io, ...im },
        0,
      )
      .fromTo(A.zoom, { [p]: 0 }, { [p]: -14, duration: 1, ease: io }, 0)
      .set(A.el, { autoAlpha: 0 }, 1);
  } else if (def.fx === 'portal' || def.fx === 'wake') {
    const cover = root.querySelector<HTMLElement>(
      def.fx === 'portal' ? '.portal' : '.flash',
    );
    tl.fromTo(
      cover,
      { autoAlpha: 0, scale: 1 },
      { autoAlpha: 1, scale: 1.25, duration: 0.5, ease: 'power2.in' },
      0,
    )
      .fromTo(
        A.zoom,
        { scale: 1 },
        { scale: 1.25, duration: 0.5, ease: 'power2.in' },
        0,
      )
      .set(A.el, { autoAlpha: 0 }, 0.5)
      .set(B.el, { autoAlpha: 1 }, 0.5)
      .fromTo(
        B.zoom,
        { scale: 1.3 },
        { scale: 1, duration: 0.5, ease: 'power3.out', ...im },
        0.5,
      )
      .to(
        cover,
        { autoAlpha: 0, scale: 1.5, duration: 0.5, ease: 'power2.out' },
        0.5,
      );
  } else if (def.fx === 'fall') {
    tl.fromTo(
      A.zoom,
      { scale: 1, rotate: 0 },
      { scale: 0.55, rotate: 24, duration: 1, ease: 'power2.in' },
      0,
    )
      .to(A.el, { autoAlpha: 0, duration: 0.5, ease: 'power1.in' }, 0.5)
      .fromTo(
        B.el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, ease: 'none', ...im },
        0.2,
      )
      .fromTo(
        B.zoom,
        { scale: 1.7, rotate: -40 },
        { scale: 1, rotate: 0, duration: 1, ease: 'power2.out', ...im },
        0,
      );
  } else {
    tl.fromTo(
      A.zoom,
      { scale: 1 },
      { scale: 1.22, duration: 1, ease: 'power2.in' },
      0,
    )
      .to(A.el, { autoAlpha: 0, duration: 0.6, ease: 'power1.in' }, 0.4)
      .fromTo(
        B.el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, ease: 'none', ...im },
        0.2,
      )
      .fromTo(
        B.zoom,
        { scale: 1.18 },
        { scale: 1, duration: 1, ease: 'power2.out', ...im },
        0,
      );
  }
};
