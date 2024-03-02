import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';

import useApi from '@/hooks/useApi';
import openSource from '@/assets/openSource/openSource.jpg';
import { IRepoType } from '@/types/IRepoType.ts';
import { GITHUB_API } from '@/constants';
import { RepoCard } from 'react-repo-card-v2';

const RepoBlockList = styled.div`
  background: #6f9b9c;
  padding: 30px;
`;

const FlexContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
`;

const RepoCardContainer = styled.div`
  width: 30%;
  min-width: 280px;
  margin: 0 auto;
`;

const OpenSourcePage = () => {
  const { t } = useTranslation();
  const { data, loading, error } = useApi<IRepoType[]>(GITHUB_API);

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={openSource} />}
        headerTextArray={[t('opensource.title')]}
        subHeaderContentArray={[t('opensource.description')]}
      />
      <RepoBlockList>
        <FlexContainer>
          {error && <p>{t('error')}</p>}
          {loading && <p>{t('loading')}</p>}
          {Array.isArray(data) && data.map((repo) => !repo.name.startsWith('.') && (
            <RepoCardContainer key={repo.id}>
              <RepoCard repository={repo} showIssues={false} />
            </RepoCardContainer>
          ))}
        </FlexContainer>
      </RepoBlockList>
    </>
  );
};

export default OpenSourcePage;
