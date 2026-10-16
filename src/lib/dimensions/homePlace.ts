/**
 * Where the reader was on the home page, remembered per visit (per entry of the history), so that a step back
 * lands there again. The browser's own restoration cannot: it puts the page back before the pinned ledger has
 * added its screens and before the names of the credits are in, so the same number is another place.
 *
 * The place is kept as a section and a distance into it, not as a number of pixels from the top. The visit is
 * told apart by an id in `history.state`; the place itself is in `sessionStorage` under that id (it is written
 * while the reader scrolls, and the entry of the history is no longer the current one when the page is left).
 */

/** A place on the home page. */
export interface HomePlace {
  /** the section at the head of the screen, by its position in `main` */
  section: number;
  /** how far the head of the screen is into that section, and how tall the section was, in pixels */
  into: number;
  height: number;
  /** the pictures that were showing: the loader waits for these before it lifts on the place */
  pictures: string[];
}

const STATE_KEY = '__ctecHomeVisit';
const STORE_KEY = 'ctec-home-place:';

const idOf = (state: unknown): string | undefined => {
  const id = (state as Record<string, unknown> | null)?.[STATE_KEY];
  return typeof id === 'string' ? id : undefined;
};

/**
 * The visit this document was loaded on (a reload, or a step back from another site), read while the script
 * is loaded: the router writes its own state over the entry when it starts, and that drops what is ours.
 * `markHomeVisit` puts it back, once.
 */
let atLoad: string | undefined;
try {
  atLoad =
    typeof window === 'undefined' ? undefined : idOf(window.history.state);
} catch {
  atLoad = undefined;
}

const visit = () => {
  try {
    return idOf(window.history.state) ?? atLoad;
  } catch {
    return undefined;
  }
};

/**
 * Give this visit its id, if it has none yet. Called when the home page is in the document: a visit without
 * an id is a new one (a link, an address), and starts at the top.
 */
export const markHomeVisit = () => {
  try {
    const id =
      visit() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    // only a visit this document was loaded on can be the one read at load
    atLoad = undefined;
    if (idOf(window.history.state) === id) return;
    // no address: the router keeps its own part of the state and takes no notice of ours
    window.history.replaceState(
      { ...window.history.state, [STATE_KEY]: id },
      '',
    );
  } catch {
    // no history to write to (a sandboxed frame): the page simply starts at the top next time
  }
};

/** The place the reader was at on this visit, if this is a return to it. */
export const recallHomePlace = (): HomePlace | null => {
  try {
    const id = visit();
    const raw = id && window.sessionStorage.getItem(STORE_KEY + id);
    if (!raw) return null;
    const place = JSON.parse(raw) as Partial<HomePlace>;
    if (
      !Number.isInteger(place.section) ||
      typeof place.into !== 'number' ||
      typeof place.height !== 'number' ||
      !Array.isArray(place.pictures)
    )
      return null;
    return {
      section: place.section as number,
      into: place.into,
      height: place.height,
      pictures: place.pictures.filter((p) => typeof p === 'string'),
    };
  } catch {
    return null;
  }
};

export const rememberHomePlace = (place: HomePlace) => {
  try {
    const id = idOf(window.history.state);
    if (id)
      window.sessionStorage.setItem(STORE_KEY + id, JSON.stringify(place));
  } catch {
    // storage is full or off: nothing is remembered
  }
};
