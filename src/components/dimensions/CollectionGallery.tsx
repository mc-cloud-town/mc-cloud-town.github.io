'use client';

import {
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { afterEntrance } from '@/lib/dimensions/entrance';
import { addressOf, type Work } from '@/lib/dimensions/works';
import { Toolbar } from './Toolbar';

const WORDS = 'dimensions.collection';

/** How the list last changed: `in` is its arrival (it rises, as the log does); 0 and 1 are the two takes of a change of filter (it settles). */
type Run = 'in' | 0 | 1;

/** The works as pictures, with the tags and the search that narrow them. A work opens through `onOpen`. */
export const CollectionGallery = ({
  works,
  loading,
  error,
  retry,
  tags,
  onTags,
  onOpen,
}: {
  works: Work[] | null;
  loading: boolean;
  error: unknown;
  retry: () => void;
  /** the tags the list is narrowed to (from the address) */
  tags: string[];
  onTags: (tags: string[]) => void;
  onOpen: (work: Work) => void;
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  // every tag of the list, and whatever else the address narrows by (the old page let a reader type any word)
  const chips = useMemo(
    () => [...new Set([...(works ?? []).flatMap((w) => w.tags), ...tags])],
    [works, tags],
  );
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (works ?? []).filter(
      (w) =>
        tags.every((tag) => w.tags.includes(tag) || w.title.includes(tag)) &&
        (!q ||
          [w.title, ...w.tags, ...w.creators].some((s) =>
            s.toLowerCase().includes(q),
          )),
    );
  }, [works, tags, query]);

  // A change of filter, wherever it came from (a chip, the search, a tag of an open work): the list settles in
  // again without being rebuilt, each take under its own copy of the keyframes (collection.css).
  const filter = `${tags.join(',')}|${query}`;
  const [seen, setSeen] = useState(filter);
  const [run, setRun] = useState<Run>('in');
  if (filter !== seen) {
    setSeen(filter);
    setRun((r) => (r === 0 ? 1 : 0));
  }

  const open = (work: Work) => (e: ReactMouseEvent<HTMLAnchorElement>) => {
    // with a modifier or another button it is the browser's own: a new tab on the work's address
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    onOpen(work);
  };

  return (
    <>
      <Toolbar
        count={
          works
            ? t(`${WORDS}.count`, { n: shown.length, total: works.length })
            : ''
        }
      >
        <input
          className='search'
          type='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(`${WORDS}.search`)}
          aria-label={t(`${WORDS}.search`)}
        />
        {chips.length > 0 && (
          <div
            className='chips'
            role='group'
            data-filter='tag'
            aria-label={t(`${WORDS}.tags`)}
          >
            <button
              type='button'
              data-v=''
              aria-pressed={tags.length === 0}
              onClick={() => tags.length > 0 && onTags([])}
            >
              {t(`${WORDS}.allTags`)}
            </button>
            {chips.map((tag) => (
              <button
                key={tag}
                type='button'
                data-v={tag}
                aria-pressed={tags.includes(tag)}
                // several may be on at once: a work must carry them all
                onClick={() =>
                  onTags(
                    tags.includes(tag)
                      ? tags.filter((x) => x !== tag)
                      : [...tags, tag],
                  )
                }
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </Toolbar>

      {loading && (
        <p className='empty' data-state='loading' data-t='body'>
          {t(`${WORDS}.loading`)}
        </p>
      )}
      {Boolean(error) && (
        <p
          className='empty'
          data-state='error'
          data-t='body'
          ref={afterEntrance}
        >
          {t(`${WORDS}.error`)}{' '}
          <button type='button' className='pill' onClick={retry}>
            {t(`${WORDS}.retry`)}
          </button>
        </p>
      )}

      {shown.length > 0 && (
        <ol className='works' data-run={run} ref={afterEntrance}>
          {shown.map((w, i) => (
            <li
              className='work'
              key={w.id}
              data-work={w.id}
              // the first few arrive one after another, the rest with the last of them
              style={{ '--i': Math.min(i, 6) } as CSSProperties}
            >
              {/* its room is kept by the frame, so nothing moves when the picture comes */}
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading='lazy' src={w.cover} alt='' />
              </figure>
              <p className='meta mono' data-t='note'>
                {w.date && <span>{w.date}</span>}
                {w.creators.map((c, j) => (
                  <span key={`${j}:${c}`}>{c}</span>
                ))}
              </p>
              <h2 className='serif' data-t='title'>
                {/* a link to the work's own address: this page opens it in place, a new tab opens it there */}
                <a href={addressOf({ work: w.id })} onClick={open(w)}>
                  {w.title}
                </a>
              </h2>
              {w.tags.length > 0 && (
                <p className='tags' data-t='note'>
                  {w.tags.map((tag, j) => (
                    <span key={`${j}:${tag}`}>{tag}</span>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {works && shown.length === 0 && (
        <p
          className='empty'
          data-state='empty'
          data-t='body'
          ref={afterEntrance}
        >
          {t(works.length > 0 ? `${WORDS}.empty` : `${WORDS}.none`)}
        </p>
      )}
    </>
  );
};
