'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useTranslation } from 'react-i18next';
import { STATIC_DATA_API } from '@/constants';
import {
  dimensionOf,
  type ProgressDimension,
} from '@/constants/progressDimensions';
import { afterEntrance } from '@/lib/dimensions/entrance';
import { formatDate, yearOf } from '@/lib/dimensions/format';
import type { IImageContent } from '@/types/IImageContent';
import { useDimension } from './DimensionProvider';
import { Toolbar } from './Toolbar';

/** A year chip needs a real year; entries with an unreadable date are still listed. */
const validYear = (y: string) => (/^\d{4}$/.test(y) ? y : '');

const DIMS: ProgressDimension[] = ['overworld', 'nether', 'end'];

/**
 * The milestone an address names, by its number (1 is the oldest), or none.
 * `#entry-<number>` is this page's own form. `?index=N` is the old page's share link: the N-th entry of its
 * list, which ran from the newest (0) to the oldest, as this one does.
 */
const entryAsked = (total: number): number | null => {
  const hash = /^#entry-(\d+)$/.exec(window.location.hash);
  const index = new URLSearchParams(window.location.search).get('index');
  const no = hash
    ? Number(hash[1])
    : index !== null && /^\d+$/.test(index)
      ? total - Number(index)
      : NaN;
  return no >= 1 && no <= total ? no : null;
};

/** Where an element begins on the page, by its own box (it may be rising into place just now). */
const pageTop = (el: HTMLElement) => {
  let top = 0;
  for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement)
    top += e.offsetTop;
  return top;
};
/** The space a line of the page keeps from what is stuck above it. */
const LANDING_GAP = 24;
/** The longest the entry is kept in place while the page settles around it. */
const KEEP_MS = 5000;
const frames = (n: number): Promise<void> =>
  new Promise((done) =>
    requestAnimationFrame(() =>
      n > 1 ? void frames(n - 1).then(done) : done(),
    ),
  );

export const ProgressLog = ({
  data,
  loading,
  error,
}: {
  data: IImageContent[] | null;
  loading: boolean;
  error: unknown;
}) => {
  const { t } = useTranslation();
  const { setDim } = useDimension();
  const [dim, setFilterDim] = useState<ProgressDimension | ''>('');
  const [year, setYear] = useState('');
  const [nowYear, setNowYear] = useState('');
  // flips with every change of filter: the list plays its entrance again without being rebuilt (inner.css)
  const [run, setRun] = useState(0);
  const pick = (changes: boolean, set: () => void) => () => {
    if (!changes) return;
    set();
    setRun((r) => 1 - r);
  };
  const list = useRef<HTMLOListElement>(null);

  // An address that names an entry. Read once, when the list is first there (it is the browser's alone: the
  // served page has no list), and again whenever the hash changes; another language's list does not ask again.
  const [asked, setAsked] = useState<{ no: number | null } | null>(null);
  if (data && asked === null) setAsked({ no: entryAsked(data.length) });
  const total = data?.length ?? 0;
  useEffect(() => {
    if (!total) return;
    const onHash = () => {
      const no = entryAsked(total);
      if (no === null) return;
      // every filter is opened, so the entry is in the list
      setFilterDim('');
      setYear('');
      setAsked({ no });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [total]);
  // The landing: at once and before the list is painted, so the entry is in its place when the list comes in
  // (a cut under the entrance, not a scroll the reader watches). Clear of the bar and the stuck toolbar.
  useLayoutEffect(() => {
    const no = asked?.no;
    if (!no) return;
    const el = document.getElementById(`entry-${no}`);
    if (!el) return;
    const tools = document.querySelector<HTMLElement>('.dim .tools');
    const place = () => {
      const clear =
        (tools
          ? (parseFloat(getComputedStyle(tools).top) || 0) + tools.offsetHeight
          : 0) + LANDING_GAP;
      // the same place for the browser, should it go to the hash itself once the page has loaded
      el.style.setProperty('scroll-margin-top', `${clear}px`);
      const top = Math.max(0, pageTop(el) - clear);
      if (Math.abs(window.scrollY - top) >= 1)
        window.scrollTo({ top, behavior: 'instant' });
    };
    place();
    // While the page settles, the entry is kept where it was put. What stands above it still changes its height
    // (the fonts arrive and the lines wrap anew), and the browser moves the page on its own account (to keep
    // what is on screen, or to the hash when the page has loaded). Each is answered in the frame it happens in,
    // so the frame that shows the change shows the entry in its place. It ends when the page has settled, and
    // at once when the reader takes the page.
    const main = el.closest('main');
    const keep = new ResizeObserver(() => (el.isConnected ? place() : letGo()));
    const INPUT = [
      'wheel',
      'touchstart',
      'pointerdown',
      'mousedown',
      'keydown',
    ] as const;
    let kept = true;
    const letGo = () => {
      kept = false;
      keep.disconnect();
      clearTimeout(limit);
      window.removeEventListener('scroll', place);
      INPUT.forEach((type) => window.removeEventListener(type, letGo));
    };
    const limit = setTimeout(letGo, KEEP_MS);
    if (main) keep.observe(main);
    window.addEventListener('scroll', place, { passive: true });
    INPUT.forEach((type) =>
      window.addEventListener(type, letGo, { passive: true }),
    );
    // settled: the page has loaded, and the fonts the list needs (asked for once it is laid out) are in
    void Promise.all([
      new Promise<void>((done) =>
        document.readyState === 'complete'
          ? done()
          : window.addEventListener('load', () => done(), { once: true }),
      ),
      frames(2).then(() => document.fonts.ready),
    ])
      .then(() => frames(2))
      .then(() => kept && letGo());
    // The mark (inner.css) begins when the entry has come in. Asked for again, it plays again.
    let live = true;
    el.removeAttribute('data-landed');
    void Promise.allSettled(el.getAnimations().map((a) => a.finished)).then(
      () => live && el.setAttribute('data-landed', ''),
    );
    return () => {
      live = false;
      letGo();
    };
  }, [asked]);

  const items = useMemo(
    () =>
      (data ?? [])
        .map((x, i) => ({
          no: i + 1,
          year: validYear(yearOf(x.title)),
          date: formatDate(x.title),
          name: x.subTitle ?? '',
          image: `${STATIC_DATA_API}/images/${x.imageUrl}`,
          dim: dimensionOf(x.imageUrl),
        }))
        .reverse(),
    [data],
  );
  const years = useMemo(
    () => [...new Set(items.map((i) => i.year).filter(Boolean))],
    [items],
  );
  const shown = items.filter(
    (i) => (!dim || i.dim === dim) && (!year || i.year === year),
  );

  // The entry crossing the middle of the screen sets the big year and the accent colour.
  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          if (el.dataset.year) setNowYear(el.dataset.year);
          if (el.dataset.dim) setDim(el.dataset.dim as ProgressDimension);
        }),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    root.querySelectorAll('.entry').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown.length, dim, year, setDim]);

  // Always a year that is in the shown list; the count is over the shown entries only.
  const bigYear = shown.some((i) => i.year && i.year === nowYear)
    ? nowYear
    : shown.find((i) => i.year)?.year ?? '';
  const bigCount = shown.filter((i) => i.year === bigYear).length;

  return (
    <>
      <Toolbar
        count={
          data
            ? t('dimensions.progress.count', {
                n: shown.length,
                total: items.length,
              })
            : ''
        }
      >
        <div
          className='chips'
          role='group'
          data-filter='dim'
          aria-label={t('dimensions.progress.allDims')}
        >
          <button
            type='button'
            data-v=''
            aria-pressed={dim === ''}
            onClick={pick(dim !== '', () => setFilterDim(''))}
          >
            {t('dimensions.progress.allDims')}
          </button>
          {DIMS.map((d) => (
            <button
              key={d}
              type='button'
              data-v={d}
              aria-pressed={dim === d}
              onClick={pick(dim !== d, () => setFilterDim(d))}
            >
              {t(`dimensions.nav.${d}`)}
            </button>
          ))}
        </div>
        <div
          className='chips'
          role='group'
          data-filter='year'
          aria-label={t('dimensions.progress.allYears')}
        >
          <button
            type='button'
            data-v=''
            aria-pressed={year === ''}
            onClick={pick(year !== '', () => setYear(''))}
          >
            {t('dimensions.progress.allYears')}
          </button>
          {years.map((y) => (
            <button
              key={y}
              type='button'
              data-v={y}
              aria-pressed={year === y}
              onClick={pick(year !== y, () => setYear(y))}
            >
              {y}
            </button>
          ))}
        </div>
      </Toolbar>

      {loading && (
        <p className='empty' data-state='loading' data-t='body'>
          {t('dimensions.progress.loading')}
        </p>
      )}
      {error && (
        <p
          className='empty'
          data-state='error'
          data-t='body'
          ref={afterEntrance}
        >
          {t('dimensions.progress.error')}{' '}
          <button
            type='button'
            className='pill'
            onClick={() => window.location.reload()}
          >
            {t('dimensions.progress.retry')}
          </button>
        </p>
      )}

      {shown.length > 0 && (
        <div className='log' ref={afterEntrance}>
          {bigYear && (
            <div className='year' aria-hidden='true'>
              {/* a new node for a new year or a new filter: it rises into place instead of swapping */}
              <b key={`year:${bigYear}:${run}`}>{bigYear}</b>
              <small key={`count:${bigYear}:${run}`} data-t='note'>
                {t('dimensions.progress.perYear', { n: bigCount })}
              </small>
            </div>
          )}
          <ol className='entries' ref={list} data-run={run}>
            {shown.map((it, i) => (
              <li
                className='entry'
                id={`entry-${it.no}`}
                key={it.no}
                data-dim={it.dim}
                data-year={it.year}
                // the first few arrive one after another, the rest with the last of them
                style={{ '--i': Math.min(i, 6) } as CSSProperties}
              >
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img loading='lazy' src={it.image} alt={it.name} />
                </figure>
                <div>
                  <p className='meta mono' data-t='note'>
                    <span>{it.date}</span>
                    {it.dim && (
                      <span className={`dimtag ${it.dim}`}>
                        {t(`dimensions.nav.${it.dim}`)}
                      </span>
                    )}
                    <span className='no'>
                      {t('dimensions.progress.no', { n: it.no })}
                    </span>
                  </p>
                  <h2 className='serif' data-t='title'>
                    {it.name}
                  </h2>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {data && shown.length === 0 && (
        <p
          className='empty'
          data-state='empty'
          data-t='body'
          ref={afterEntrance}
        >
          {t('dimensions.progress.empty')}
        </p>
      )}
    </>
  );
};
