'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';

import useApi from '@/hooks/useApi.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { IRepoType } from '@/types/IRepoType.ts';
import { GITHUB_API } from '@/constants';

import {
  Container,
  Grid,
  Section,
  TextButton,
  TextLink,
} from '#/openSource/OpenSourceStyles.ts';
import Intro from '#/openSource/Intro.tsx';
import Filters, { SortKey } from '#/openSource/Filters.tsx';
import RepoCard, { RepoCardPlaceholder } from '#/openSource/RepoCard.tsx';

const ORG_URL = 'https://github.com/mc-cloud-town';
const PLACEHOLDER_COUNT = 6;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
  text-align: center;

  p {
    margin: 0;
    color: var(--text-tertiary);
    font-size: 1.1rem;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 28px;
`;

const byPushedAt = (a: IRepoType, b: IRepoType) =>
  new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();

const sorters: Record<SortKey, (a: IRepoType, b: IRepoType) => number> = {
  updated: byPushedAt,
  stars: (a, b) => b.stargazers_count - a.stargazers_count || byPushedAt(a, b),
  name: (a, b) => a.name.localeCompare(b.name),
};

const OpenSourcePage = () => {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useApi<IRepoType[]>(
    `${GITHUB_API}?per_page=100`,
  );

  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('updated');
  const deferredQuery = useDeferredValue(query);

  const repos = useMemo(
    () =>
      Array.isArray(data)
        ? data.filter((repo) => !repo.name.startsWith('.'))
        : [],
    [data],
  );

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    repos.forEach((repo) => {
      if (repo.language) {
        counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
      }
    });

    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [repos]);

  const stats = useMemo(
    () => ({
      total: repos.length,
      languages: languages.length,
      stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      forks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
    }),
    [repos, languages],
  );

  const visibleRepos = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();

    return repos
      .filter((repo) => !language || repo.language === language)
      .filter(
        (repo) =>
          !keyword ||
          [repo.name, repo.description ?? '', ...(repo.topics ?? [])].some(
            (text) => text.toLowerCase().includes(keyword),
          ),
      )
      .sort(sorters[sort]);
  }, [repos, language, deferredQuery, sort]);

  const renderRepos = () => {
    if (error) {
      return (
        <Message>
          <p>{t('error')}</p>
          <Actions>
            <TextButton type='button' onClick={reload}>
              {t('opensource.retry')}
            </TextButton>
            <TextLink href={ORG_URL} target='_blank' rel='noreferrer'>
              {t('opensource.viewOnGithub')}
            </TextLink>
          </Actions>
        </Message>
      );
    }

    if (loading) {
      return (
        <Grid aria-busy='true' aria-label={t('loading')}>
          {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
            <RepoCardPlaceholder key={index} />
          ))}
        </Grid>
      );
    }

    if (repos.length === 0) {
      return (
        <Message>
          <p>{t('opensource.noRepositories')}</p>
        </Message>
      );
    }

    return (
      <>
        <Filters
          query={query}
          onQueryChange={setQuery}
          language={language}
          onLanguageChange={setLanguage}
          languages={languages}
          total={repos.length}
          sort={sort}
          onSortChange={setSort}
        />
        {visibleRepos.length > 0 ? (
          <Grid>
            {visibleRepos.map((repo, index) => (
              <RepoCard key={repo.id} repo={repo} index={index} />
            ))}
          </Grid>
        ) : (
          <Message aria-live='polite'>
            <p>{t('opensource.noMatch')}</p>
            <TextButton
              type='button'
              onClick={() => {
                setQuery('');
                setLanguage(null);
              }}
            >
              {t('opensource.clearFilters')}
            </TextButton>
          </Message>
        )}
      </>
    );
  };

  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderImage imageUrl={getImageUrl(t('opensource.imageUrl'))} />
        }
        headerTextArray={[t('opensource.title')]}
        subHeaderContentArray={[t('opensource.description')]}
      />
      <Section>
        <Container>
          <Intro loading={loading || !!error} orgUrl={ORG_URL} stats={stats} />
        </Container>
      </Section>
      <Section $tone='muted'>
        <Container>{renderRepos()}</Container>
      </Section>
    </>
  );
};

export default OpenSourcePage;
