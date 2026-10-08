'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from '@/hooks/useApi';
import { STATIC_DATA_API } from '@/constants';
import type { IMembers } from '@/types/IMember';
import { Toolbar } from './Toolbar';

const GROUPS = ['member', 'trial'] as const;

export const MemberRoster = () => {
  const { t } = useTranslation();
  const { data, loading, error } = useApi<IMembers>(
    `${STATIC_DATA_API}/member.json`,
  );
  const [query, setQuery] = useState('');
  // flips with every change of the search: the roster settles in again without being rebuilt (inner.css)
  const [run, setRun] = useState(0);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GROUPS.map((key) => {
      const all = data?.[key] ?? [];
      return {
        key,
        total: all.length,
        people: all.filter((m) => m.name.toLowerCase().includes(q)),
      };
    });
  }, [data, query]);

  const total = groups.reduce((n, g) => n + g.total, 0);
  const shown = groups.reduce((n, g) => n + g.people.length, 0);

  return (
    <>
      <Toolbar
        count={data ? t('dimensions.members.count', { n: shown, total }) : ''}
      >
        <input
          className='search'
          type='search'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setRun((r) => 1 - r);
          }}
          placeholder={t('dimensions.members.search')}
          aria-label={t('dimensions.members.search')}
        />
      </Toolbar>

      {loading && (
        <p className='empty' data-state='loading' data-t='body'>
          {t('dimensions.members.loading')}
        </p>
      )}
      {error && (
        <p className='empty' data-state='error' data-t='body'>
          {t('dimensions.members.error')}{' '}
          <button
            type='button'
            className='pill'
            onClick={() => window.location.reload()}
          >
            {t('dimensions.members.retry')}
          </button>
        </p>
      )}

      {data &&
        groups
          .filter((g) => g.people.length > 0)
          .map((g) => (
            <section className='group' key={g.key}>
              <header>
                <h2 className='serif' data-t='title'>
                  {t(`dimensions.members.groups.${g.key}.title`)}
                </h2>
                <p data-t='body'>
                  {t(`dimensions.members.groups.${g.key}.line`)}
                </p>
                <span className='mono' data-t='note'>
                  {t('dimensions.members.groupCount', { n: g.total })}
                </span>
              </header>
              <ul className='people' data-run={run}>
                {g.people.map((m) => (
                  <li
                    className='person'
                    key={`${m.uuid}-${m.name}`}
                    data-t='body'
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading='lazy'
                      src={`https://mineskin.eu/helm/${m.uuid}/56.png`}
                      alt=''
                      width={28}
                      height={28}
                    />
                    <span>{m.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

      {data && shown === 0 && (
        <p className='empty' data-state='empty' data-t='body'>
          {t('dimensions.members.empty')}
        </p>
      )}
    </>
  );
};
