import { STATIC_DATA_API } from '@/constants';
import type { ICollection } from '@/types/ICollection';

/** The two collections: one page each, the same component. */
export type CollectionKind = 'redstone' | 'architecture';

/** One thing to look at in a work's sequence: a picture, or a video that is loaded only when it is asked for. */
export type WorkMedia =
  | { kind: 'image'; src: string }
  | { kind: 'video'; src: string; poster: string; watch: string };

export interface Work {
  /** The name of the work in an address: the same in every language, and whatever the order of the list. */
  id: string;
  /** Its place in the list, from 1. */
  no: number;
  title: string;
  /** YYYY.MM.DD */
  date: string;
  cover: string;
  creators: string[];
  tags: string[];
  introductions: string[];
  credits: { name: string; url?: string }[];
  download?: string;
  media: WorkMedia[];
}

const image = (path: string) => `${STATIC_DATA_API}/images/${path}`;

/** `redstoneCollection/360ftl_star_bow.png` names the work `360ftl_star_bow`. */
const idOf = (path: string) =>
  (path.split('/').pop() ?? '').replace(/\.[a-z0-9]+$/i, '');

/** A player's address (`youtube.com/embed/<id>`) as the page a reader can open; any other address as it is. */
const watchPage = (embed: string) => {
  const id = /youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/.exec(embed)?.[1];
  return id ? `https://www.youtube.com/watch?v=${id}` : embed;
};

/** The list as the pages use it. Every field but the title and the picture may be missing in the data. */
export const toWorks = (data: ICollection[]): Work[] => {
  const seen = new Map<string, number>();
  return data.map((x, i) => {
    // two works on the same picture: the later one says which it is
    const base = idOf(x.imageUrl) || `work-${i + 1}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const pictures = x.galleryImagesUrl?.length
      ? x.galleryImagesUrl
      : [x.imageUrl];
    return {
      id: n > 1 ? `${base}-${n}` : base,
      no: i + 1,
      title: x.title,
      date: (x.date ?? '').replace(/[-/]/g, '.'),
      cover: image(x.imageUrl),
      // "A,B" in one string of the data is two people
      creators: (x.creator ?? [])
        .flatMap((c) => c.split(/[,，、]/))
        .map((c) => c.trim())
        .filter(Boolean),
      tags: x.tags ?? [],
      introductions: x.introductions ?? [],
      credits: x.credits ?? [],
      download: x.downloadUrl || undefined,
      media: [
        ...pictures.map((p): WorkMedia => ({ kind: 'image', src: image(p) })),
        ...(x.videosUrl ?? []).map(
          (v): WorkMedia => ({
            kind: 'video',
            src: v.url,
            poster: image(v.thumbnailUrl),
            watch: watchPage(v.url),
          }),
        ),
      ],
    };
  });
};

/* ───────── the address ─────────
   What the page shows is in its address, and the address is the only place it is kept: `?work=<id>` is an open
   work, `?tag=a,b` the tags the list is narrowed to (the old page's own form). The page reads it, and hears of
   every change: the reader's steps through the history, and the page's own. */

const CHANGED = 'ctec:address';
/** Set on a history entry this page added for a work: closing that work is then a step back to the gallery. */
const OPENED_HERE = 'ctecWork';

export const onAddress = (listener: () => void) => {
  window.addEventListener('popstate', listener);
  window.addEventListener(CHANGED, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(CHANGED, listener);
  };
};
export const addressNow = () => window.location.search;
/** The served page has no address of its own: the gallery, with nothing open. */
export const addressServed = () => '';

export interface Address {
  work: string | null;
  tags: string[];
  /** The old share link: the place of a work in the list, from 0. */
  shared: number | null;
}

export const readAddress = (search: string): Address => {
  const q = new URLSearchParams(search);
  const old = q.get('share') ?? q.get('index');
  return {
    work: q.get('work'),
    tags: (q.get('tag') ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    shared: old !== null && /^\d+$/.test(old) ? Number(old) : null,
  };
};

/** The address of a state of this page: with a work open or not, narrowed to tags or not. */
export const addressOf = ({
  work,
  tags,
}: {
  work?: string | null;
  tags?: string[];
}) => {
  const q = new URLSearchParams();
  if (tags?.length) q.set('tag', tags.join(','));
  if (work) q.set('work', work);
  const s = q.toString();
  return window.location.pathname + (s ? `?${s}` : '');
};

const openedHere = () =>
  Boolean(
    (window.history.state as Record<string, unknown> | null)?.[OPENED_HERE],
  );

/**
 * Change the address without leaving the page. `push` adds a step (a work was opened: Back closes it), `replace`
 * rewrites the one the reader is on. Only this page's own mark is passed as the entry's state: the router adds
 * its own to whatever it is given, and takes a state that already has it for one of its own steps.
 */
export const setAddress = (url: string, how: 'push' | 'replace') => {
  if (how === 'push')
    window.history.pushState({ [OPENED_HERE]: true }, '', url);
  else
    window.history.replaceState(
      // still that entry only while it still names a work
      openedHere() && /[?&]work=/.test(url) ? { [OPENED_HERE]: true } : {},
      '',
      url,
    );
  window.dispatchEvent(new Event(CHANGED));
};

/**
 * Close the open work. Opened from the gallery, it is a step back to it (and Forward opens the work again);
 * arrived at by its address, there is no gallery to go back to, and the address becomes the gallery's.
 */
export const closeWork = (tags: string[]) => {
  if (openedHere()) window.history.back();
  else setAddress(addressOf({ tags }), 'replace');
};
