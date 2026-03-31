import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InboxOutlined } from '@ant-design/icons';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import { StatusShowingGroup } from '#/common/StatusShowingGroup.tsx';

import useApi from '@/hooks/useApi.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { IRepoType } from '@/types/IRepoType.ts';
import { GITHUB_API } from '@/constants';

import {
  RepoSection,
  Content,
  Grid,
  EmptyState,
} from '#/openSource/OpenSourceStyles.ts';
import HeroSection from '#/openSource/HeroSection.tsx';
import RepoCard from '#/openSource/RepoCard.tsx';

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
    const activeCount = repos.filter((repo) => !repo.archived).length;
    const totalStars = repos.reduce(
      (sum, repo) => sum + repo.stargazers_count,
      0,
    );

    return {
      totalCount: repos.length,
      activeCount,
      totalStars,
    };
  }, [repos]);

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
          <HeroSection loading={loading || !!error} stats={stats} />
          <StatusShowingGroup error={error} loading={loading} />

          {!loading && !error && repos.length > 0 && (
            <Grid>
              {repos.map((repo, index) => (
                <RepoCard key={repo.id} repo={repo} index={index} />
              ))}
            </Grid>
          )}

          {!loading && !error && repos.length === 0 && (
            <EmptyState>
              <InboxOutlined style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--text-tertiary)' }} />
              {t('opensource.noRepositories')}
            </EmptyState>
          )}
        </Content>
      </RepoSection>
    </>
  );
};

export default OpenSourcePage;
