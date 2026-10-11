'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from '@/hooks/useApi';
import { GITHUB_API } from '@/constants';
import { GITHUB_ORG_URL, OPEN_SOURCE_ROLES } from '@/constants/openSourceRoles';
import type { IRepoType } from '@/types/IRepoType';
import { afterEntrance } from '@/lib/dimensions/entrance';
import { Toolbar } from './Toolbar';

/** What the page reads of a repository. */
type Repo = Pick<
  IRepoType,
  | 'id'
  | 'name'
  | 'html_url'
  | 'description'
  | 'language'
  | 'stargazers_count'
  | 'forks_count'
  | 'fork'
  | 'archived'
  | 'topics'
  | 'pushed_at'
>;

const number = (n: number) => n.toLocaleString('en-US');
/** `2025-03-04T05:06:07Z` as 2025.03.04 */
const day = (iso: string) => iso.slice(0, 10).replace(/-/g, '.');
const byPushed = (a: Repo, b: Repo) => b.pushed_at.localeCompare(a.pushed_at);

const STATS = ['total', 'languages', 'stars', 'forks'] as const;

/**
 * The organisation's repositories, grouped as the home page's credits group them; what has no group yet comes
 * last, the most recently worked on first. GitHub's public API is asked without a sign-in and refuses after a
 * number of requests an hour: a refusal is said as what it is, with a retry and the way to GitHub itself.
 */
export const OpenSourceList = () => {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useApi<Repo[]>(
    `${GITHUB_API}?per_page=100`,
  );
  const [query, setQuery] = useState('');
  // flips with every change of the search: the lists settle in again without being rebuilt (openSource.css)
  const [run, setRun] = useState(0);
  const search = (value: string) => {
    setQuery(value);
    setRun((r) => 1 - r);
  };

  // (the organisation's own settings repository, `.github`, is not a project)
  const repos = useMemo(
    () =>
      Array.isArray(data) ? data.filter((r) => !r.name.startsWith('.')) : null,
    [data],
  );

  const groups = useMemo(() => {
    const all = repos ?? [];
    const q = query.trim().toLowerCase();
    const matches = (r: Repo) =>
      [r.name, r.description ?? '', ...(r.topics ?? [])].some((text) =>
        text.toLowerCase().includes(q),
      );
    const filed = new Set(OPEN_SOURCE_ROLES.flatMap(([, names]) => names));
    return [
      ...OPEN_SOURCE_ROLES.map(([key, names]) => ({
        key,
        title: `dimensions.end.credits.roles.${key}`,
        all: names.flatMap((name) => all.find((r) => r.name === name) ?? []),
      })),
      {
        key: 'other',
        title: 'dimensions.openSource.other',
        all: all.filter((r) => !filed.has(r.name)).sort(byPushed),
      },
    ].map((g) => ({ ...g, shown: g.all.filter(matches) }));
  }, [repos, query]);

  const total = repos?.length ?? 0;
  const shown = groups.reduce((n, g) => n + g.shown.length, 0);
  const stats = {
    total,
    languages: new Set((repos ?? []).map((r) => r.language).filter(Boolean))
      .size,
    stars: (repos ?? []).reduce((n, r) => n + r.stargazers_count, 0),
    forks: (repos ?? []).reduce((n, r) => n + r.forks_count, 0),
  };

  return (
    <>
      <Toolbar
        count={
          repos ? t('dimensions.openSource.count', { n: shown, total }) : ''
        }
      >
        <input
          className='search'
          type='search'
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder={t('dimensions.openSource.search')}
          aria-label={t('dimensions.openSource.search')}
        />
      </Toolbar>

      {loading && (
        <p className='empty' data-state='loading' data-t='body'>
          {t('dimensions.openSource.loading')}
        </p>
      )}
      {error && (
        <p
          className='empty os-failed'
          data-state='error'
          data-t='body'
          ref={afterEntrance}
        >
          {t('dimensions.openSource.error')}{' '}
          <button type='button' className='pill' onClick={reload}>
            {t('dimensions.openSource.retry')}
          </button>
          <a
            className='pill'
            href={GITHUB_ORG_URL}
            target='_blank'
            rel='noopener noreferrer'
          >
            {t('dimensions.openSource.github')}{' '}
            <span aria-hidden='true'>↗</span>
          </a>
        </p>
      )}

      {repos && total > 0 && (
        <div className='os-stats' ref={afterEntrance}>
          <dl>
            {STATS.map((key) => (
              <div key={key}>
                <dt className='mono' data-t='note'>
                  {t(`dimensions.openSource.stats.${key}`)}
                </dt>
                <dd className='serif'>{number(stats[key])}</dd>
              </div>
            ))}
          </dl>
          <a
            className='pill'
            href={GITHUB_ORG_URL}
            target='_blank'
            rel='noopener noreferrer'
          >
            {t('dimensions.openSource.github')}{' '}
            <span aria-hidden='true'>↗</span>
          </a>
        </div>
      )}

      {groups
        .filter((g) => g.shown.length > 0)
        .map((g) => (
          <section className='group' key={g.key} ref={afterEntrance}>
            <header>
              <h2 className='serif' data-t='title'>
                {t(g.title)}
              </h2>
              <span className='mono' data-t='note'>
                {t('dimensions.openSource.groupCount', { n: g.all.length })}
              </span>
            </header>
            <ul className='repos' data-run={run}>
              {g.shown.map((r) => (
                <li key={r.id}>
                  <a
                    className='repo'
                    href={r.html_url}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <span className='name' data-t='body'>
                      {r.name}
                    </span>
                    <span className='about' data-t='body'>
                      {r.description ||
                        t('dimensions.openSource.noDescription')}
                    </span>
                    <span className='meta mono' data-t='note'>
                      <span>
                        {r.language ??
                          t('dimensions.openSource.unknownLanguage')}
                      </span>
                      <span>★ {number(r.stargazers_count)}</span>
                      {r.fork && (
                        <span className='tag'>
                          {t('dimensions.openSource.fork')}
                        </span>
                      )}
                      {r.archived && (
                        <span className='tag'>
                          {t('dimensions.openSource.archived')}
                        </span>
                      )}
                      <span className='when'>{day(r.pushed_at)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}

      {repos && total === 0 && (
        <p
          className='empty'
          data-state='empty'
          data-t='body'
          ref={afterEntrance}
        >
          {t('dimensions.openSource.none')}
        </p>
      )}
      {repos && total > 0 && shown === 0 && (
        <p
          className='empty'
          data-state='empty'
          data-t='body'
          ref={afterEntrance}
        >
          {t('dimensions.openSource.empty')}{' '}
          <button type='button' className='pill' onClick={() => search('')}>
            {t('dimensions.openSource.clear')}
          </button>
        </p>
      )}
    </>
  );
};
