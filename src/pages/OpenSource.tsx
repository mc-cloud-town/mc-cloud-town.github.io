import { useTranslation } from 'react-i18next';
import { Row } from 'antd';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import RepoCard from '#/openSource/openSourceDate.tsx';

import useApi from '@/hooks/useApi';
import openSource from '@/assets/openSource/openSource.jpg';

const RepoBlockList = styled.div`
  background: #96bee6;
  padding: 30px;
`;
const OpenSourcePage = () => {
  const { t } = useTranslation();
  const { data, loading, error } = useApi(
    'https://api.github.com/orgs/mc-cloud-town/repos',
  );
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
              .map((repo) => <RepoCard repo={repo} />)}
        </Row>
      </RepoBlockList>
    </>
  );
};

export default OpenSourcePage;
