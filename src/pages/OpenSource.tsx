import { RepoCard } from 'react-repo-card-v2';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';

import useApi from '@/hooks/useApi';
import getImageUrl from '@/utils/getImageUrl.ts';
import { IRepoType } from '@/types/IRepoType.ts';
import { GITHUB_API } from '@/constants';
import { StatusShowingGroup } from '#/common/StatusShowingGroup.tsx';
import { useTheme } from '@/hooks/useTheme';

const RepoBlockList = styled.div`
  background: var(--bg-secondary);
  padding: 60px 30px;
  min-height: 400px;
`;

const FlexContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const RepoCardContainer = styled.div`
  width: 30%;
  min-width: 300px;
  max-width: 400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    width: 100%;
    max-width: none;
  }
`;

const SectionTitle = styled.h2`
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 40px;
  font-weight: 700;
  font-size: clamp(1.5rem, 3vw, 2rem);
`;

const OpenSourcePage = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { data, loading, error } = useApi<IRepoType[]>(GITHUB_API);

  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderImage imageUrl={getImageUrl(t('opensource.imageUrl'))} />
        }
        headerTextArray={[t('opensource.title')]}
        subHeaderContentArray={[t('opensource.description')]}
      />
      <RepoBlockList>
        <SectionTitle>{t('opensource.title')}</SectionTitle>
        <FlexContainer>
          <StatusShowingGroup error={error} loading={loading} />
          {Array.isArray(data) &&
            data.map(
              (repo) =>
                !repo.name.startsWith('.') && (
                  <RepoCardContainer key={repo.id}>
                    <RepoCard
                      repository={repo}
                      showIssues={false}
                      darkMode={isDark}
                    />
                  </RepoCardContainer>
                ),
            )}
        </FlexContainer>
      </RepoBlockList>
    </>
  );
};

export default OpenSourcePage;
