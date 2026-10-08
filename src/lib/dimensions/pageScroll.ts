/**
 * The page behind an open overlay stays where it is without touching `overflow` on the document
 * (that would take the scrollbar away and shift the whole layout). Whoever drives the scroll
 * itself — the home page's smooth scrolling — listens here and pauses while it is held.
 */
type Listener = (held: boolean) => void;

const listeners = new Set<Listener>();

export const holdPageScroll = (held: boolean) =>
  listeners.forEach((listener) => listener(held));

export const onPageScrollHold = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
