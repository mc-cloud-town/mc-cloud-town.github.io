'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STATIC_DATA_API } from '@/constants';
import {
  dimensionOf,
  type ProgressDimension,
} from '@/constants/progressDimensions';
import { formatDate, yearOf } from '@/lib/dimensions/format';
import type { IImageContent } from '@/types/IImageContent';
import { useDimension } from './DimensionProvider';
import { Toolbar } from './Toolbar';

/** A year chip needs a real year; entries with an unreadable date are still listed. */
const validYear = (y: string) => (/^\d{4}$/.test(y) ? y : '');

const DIMS: ProgressDimension[] = ['overworld', 'nether', 'end'];

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
  const list = useRef<HTMLOListElement>(null);

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
            onClick={() => setFilterDim('')}
          >
            {t('dimensions.progress.allDims')}
          </button>
          {DIMS.map((d) => (
            <button
              key={d}
              type='button'
              data-v={d}
              aria-pressed={dim === d}
              onClick={() => setFilterDim(d)}
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
            onClick={() => setYear('')}
          >
            {t('dimensions.progress.allYears')}
          </button>
          {years.map((y) => (
            <button
              key={y}
              type='button'
              data-v={y}
              aria-pressed={year === y}
              onClick={() => setYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </Toolbar>

      {loading && (
        <p className='empty' data-t='body'>
          {t('dimensions.progress.loading')}
        </p>
      )}
      {error && (
        <p className='empty' data-t='body'>
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
        <div className='log'>
          {bigYear && (
            <div className='year' aria-hidden='true'>
              <b>{bigYear}</b>
              <small data-t='note'>
                {t('dimensions.progress.perYear', { n: bigCount })}
              </small>
            </div>
          )}
          <ol className='entries' ref={list}>
            {shown.map((it) => (
              <li
                className='entry'
                key={it.no}
                data-dim={it.dim}
                data-year={it.year}
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
        <p className='empty' data-t='body'>
          {t('dimensions.progress.empty')}
        </p>
      )}
    </>
  );
};
