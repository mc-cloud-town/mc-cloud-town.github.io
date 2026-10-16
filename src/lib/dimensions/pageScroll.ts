/**
 * The page behind an open overlay stays where it is without touching `overflow` on the document
 * (that would take the scrollbar away and shift the whole layout). Whoever drives the scroll
 * itself — the home page's smooth scrolling — listens here and pauses while it is held.
 */
type Listener = (held: boolean) => void;

const listeners = new Set<Listener>();
/** How many hold the page right now (the sheet, a cut): it is let go when the last of them lets go. */
let holds = 0;

export const holdPageScroll = (held: boolean) => {
  const was = holds > 0;
  holds = Math.max(0, holds + (held ? 1 : -1));
  const now = holds > 0;
  if (was !== now) listeners.forEach((listener) => listener(now));
};

export const onPageScrollHold = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Keys that scroll a page, as a fraction of the height of what they scroll (±Infinity: to the very end). */
const SCROLL_KEYS: Record<string, number> = {
  ' ': 0.9,
  PageDown: 0.9,
  PageUp: -0.9,
  ArrowDown: 0.12,
  ArrowUp: -0.12,
  End: Infinity,
  Home: -Infinity,
};

/** Something that uses the scroll keys itself: a field, or the language list (its arrows move in the list). */
const isField = (el: EventTarget | null) =>
  el instanceof HTMLSelectElement ||
  el instanceof HTMLInputElement ||
  el instanceof HTMLTextAreaElement ||
  (el instanceof Element && Boolean(el.closest('.lang')));

export interface PageHold {
  /** Let the page go. Once: a second call does nothing. */
  release: () => void;
  /** Whoever holds the page has moved it on purpose: this is now the place it is kept at. */
  moved: () => void;
}

/**
 * Keep the page where it is, with nothing about its layout changed: the scrollbar stays, so `overflow` on the
 * document is never touched. Instead the wheel, touch and scroll keys go to `within` (the menu sheet, if it has
 * anything to scroll) or nowhere, and the smooth scroll waits (`holdPageScroll`). Several may hold the page at once.
 */
export const holdPage = (within?: HTMLElement | null): PageHold => {
  let y = window.scrollY;
  const room = (dy: number) =>
    Boolean(within) &&
    (dy < 0
      ? within!.scrollTop > 0
      : within!.scrollTop + within!.clientHeight < within!.scrollHeight - 1);
  const inside = (e: Event) =>
    Boolean(within) && e.target instanceof Node && within!.contains(e.target);

  const onWheel = (e: WheelEvent) => {
    if (!(inside(e) && room(e.deltaY))) e.preventDefault();
  };
  let touchY = 0;
  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches[0]?.clientY ?? 0;
  };
  const onTouchMove = (e: TouchEvent) => {
    const dy = touchY - (e.touches[0]?.clientY ?? touchY);
    if (!(inside(e) && room(dy)) && e.cancelable) e.preventDefault();
  };
  const onKey = (e: KeyboardEvent) => {
    const step = SCROLL_KEYS[e.key];
    if (step === undefined || isField(e.target)) return;
    // with Ctrl, Meta or Alt these are the browser's own shortcuts (history, tabs, zoom): not ours to take
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // on a button the space bar presses it; it never scrolls
    if (e.key === ' ' && e.target instanceof HTMLButtonElement) return;
    e.preventDefault();
    within?.scrollBy({
      top: Number.isFinite(step)
        ? (e.shiftKey && e.key === ' ' ? -step : step) * within.clientHeight
        : Math.sign(step) * within.scrollHeight,
    });
  };
  // whatever still gets through (dragging the scrollbar, auto-scroll): put the page back
  const onScroll = () => {
    if (window.scrollY !== y)
      window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  };

  holdPageScroll(true);
  document.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll);
  let held = true;
  return {
    release: () => {
      if (!held) return;
      held = false;
      document.removeEventListener('wheel', onWheel);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
      holdPageScroll(false);
    },
    moved: () => {
      y = window.scrollY;
    },
  };
};
