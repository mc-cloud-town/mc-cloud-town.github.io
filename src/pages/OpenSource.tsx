import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';

import useApi from '@/hooks/useApi';
import getImageUrl from '@/utils/getImageUrl.ts';
import { IRepoType } from '@/types/IRepoType.ts';
import { GITHUB_API } from '@/constants';

import {
  RepoSection,
  Content,
  Grid,
  StatusContainer,
} from '#/openSource/OpenSourceStyles.ts';
import HeroSection from '#/openSource/HeroSection.tsx';
import RepoCard from '#/openSource/RepoCard.tsx';
import RepoCardSkeleton from '#/openSource/RepoCardSkeleton.tsx';

const OpenSourcePage = () => {
  const { t } = useTranslation();
  const { data, loading, error } = useApi<IRepoType[]>(GITHUB_API);

  const repos = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return [...data]
      .filter((repo) => !repo.name.startsWith('.'))
      .sort(
        (a, b) =>
          new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
      );
  }, [data]);

  const stats = useMemo(() => {
    // Determine stats during loading by assuming starting points if needed
    if (loading || !data) {
      return { totalCount: 0, activeCount: 0, totalStars: 0 };
    }
    const activeCount = repos.filter((repo) => !repo.archived).length;
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    return {
      totalCount: repos.length,
      activeCount,
      totalStars,
    };
  }, [repos, data, loading]);

  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderImage imageUrl={getImageUrl(t('opensource.imageUrl'))} />
        }
        headerTextArray={[t('opensource.title')]}
        subHeaderContentArray={[t('opensource.description')]}
      />
      <RepoSection>
        <Content>
          <HeroSection stats={stats} />

          {error && <StatusContainer>{t('error')}</StatusContainer>}

          {!error && (
            <Grid>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <RepoCardSkeleton key={`skeleton-${index}`} />
                  ))
                : repos.map((repo, index) => (
                    <RepoCard key={repo.id} repo={repo} index={index} />
                  ))}
            </Grid>
          )}
        </Content>
      </RepoSection>
    </>
  );
};

export default OpenSourcePage;
