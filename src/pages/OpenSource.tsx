import { useTranslation } from 'react-i18next';
import { Row } from 'antd';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import Repo from '#/openSource/openSourceDate.tsx';

import useApi from '@/hooks/useApi';
import openSource from '@/assets/openSource/openSource.jpg';
import { IRepoType } from '@/types/IRepoType.ts';

const RepoBlockList = styled.div`
  background: #6f9b9c;
  padding: 30px;
`;
const OpenSourcePage = () => {
  const { t } = useTranslation();
  const {
    data,
    loading,
    error,
  }: {
    data: IRepoType[] | null;
    loading: boolean;
    error: { message: string } | null;
  } = useApi('https://api.github.com/orgs/mc-cloud-town/repos');

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={openSource} />}
        headerTextArray={[t('opensource.title')]}
        subHeaderContentArray={[t('opensource.description')]}
      />
      <RepoBlockList>
        <Row justify="center" gutter={30}>
          {error && <p>Error</p>}
          {loading && <p>Loading</p>}
          {Array.isArray(data) &&
            data
              .filter((repo) => !repo.name.toString().startsWith('.'))
              .map((repo) => <Repo key={repo.name} repo={repo} />)}
        </Row>
      </RepoBlockList>
    </>
  );
};

export default OpenSourcePage;
