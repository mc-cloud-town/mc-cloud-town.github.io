import gsap from 'gsap';

/**
 * Call `fn` on the next tick of GSAP's clock, not in the one that is running. What is started in a tick starts at
 * that tick's time: after a long piece of work in it (the home page being built as it is handed over) the next
 * tick comes that much later, and an animation started before the work has lost that much of its length by then.
 * Started on the next tick it plays in full.
 * Returns the way to call it off.
 */
export const onNextTick = (fn: () => void): (() => void) => {
  const now = gsap.ticker.frame;
  const tick = () => {
    if (gsap.ticker.frame === now) return;
    gsap.ticker.remove(tick);
    fn();
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
};
