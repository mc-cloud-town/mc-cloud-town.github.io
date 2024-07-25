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
        backgroundComponent={
          <HeaderImage imageUrl={getImageUrl(t('opensource.imageUrl'))} />
        }
        maskColor={'#6f9b9c'}
        headerTextArray={[t('opensource.title')]}
        subHeaderContentArray={[t('opensource.description')]}
      />
      <RepoBlockList>
        <FlexContainer>
          <StatusShowingGroup error={error} loading={loading} />
          {Array.isArray(data) &&
            data.map(
              (repo) =>
                !repo.name.startsWith('.') && (
                  <RepoCardContainer key={repo.id}>
                    <RepoCard repository={repo} showIssues={false} />
                  </RepoCardContainer>
                ),
            )}
        </FlexContainer>
      </RepoBlockList>
    </>
  );
};

export default OpenSourcePage;
