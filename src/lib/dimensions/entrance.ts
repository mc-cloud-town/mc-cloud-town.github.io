/**
 * The entrance of an inner page is CSS (inner.css, "the entrance"): it plays in the served page before any
 * script runs, and with scripts off. Only one thing needs the clock: a list whose data arrives while the header
 * is still coming in must wait for its turn, after the toolbar.
 */

/** When the list's turn comes, in milliseconds after the entrance began: as `.next` in inner.css. */
const LIST_AT = 680;
/** The longest a list takes to come in once its turn has come (inner.css: the last entry's stagger and rise). */
const LIST_IN = 1000;

/** How long what arrives now still has to wait for its turn in the entrance. Nothing, once the title has risen. */
const entranceWait = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
  // the title's own rise is the clock: it began with the entrance, and stands still while the entrance is held
  const rise = document
    .querySelector('.dim .head h1 span')
    ?.getAnimations()
    .find((a) => (a as CSSAnimation).animationName === 'dim-enter-line');
  if (!rise) return 0;
  return Math.max(0, Math.round(LIST_AT - Number(rise.currentTime ?? 0)));
};

/**
 * A ref for what is rendered when the data has come (the list, the groups, "nothing found", the error).
 * It hands the wait to the styles as `--wait`, which the entrances of everything inside add to their delay,
 * and takes it away again when they have played: a later change of the list starts at once.
 */
export const afterEntrance = (el: HTMLElement | null) => {
  if (!el) return;
  const wait = entranceWait();
  if (wait === 0) return;
  el.style.setProperty('--wait', `${wait}ms`);
  window.setTimeout(() => el.style.removeProperty('--wait'), wait + LIST_IN);
};
