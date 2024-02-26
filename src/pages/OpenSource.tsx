import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Dict } from 'styled-components/dist/types';
import { Card } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

import HeaderImage from '#/common/HeaderImage.tsx';
import PageHeader from '#/common/PageHeader.tsx';
import useApi from '@/hooks/useApi';

const { Meta } = Card;
const RepoBlockList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const LangShow = styled.div`
  margin-top: 10px;
`;

const CardOut = styled.div``;

const OpenSourcePage = () => {
  const { t } = useTranslation();
  const { data, loading, error } = useApi(
    'https://api.github.com/orgs/mc-cloud-town/repos',
  );
  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderImage imageUrl="https://frp.whitecloud.life/api/v1/pixiv/image/76831252" />
        }
        headerTextArray={[t('opensource.title')]}
        subHeaderContentArray={[t('opensource.description')]}
      />
      <RepoBlockList>
        {error && <p>Error</p>}
        {loading && <p>Loading</p>}
        {Array.isArray(data) &&
          data
            .filter((repo: Dict) => {
              return !repo.name.toString().startsWith('.');
            })
            .map((repo: Dict) => {
              return (
                <CardOut onClick={() => window.open(repo.html_url)}>
                  <Card hoverable style={{ width: 300 }}>
                    <Meta title={repo.name} description={repo.description} />
                    <LangShow>
                      <LeftOutlined />
                      <RightOutlined />
                      <span>{repo.language ? repo.language : 'Other'}</span>
                    </LangShow>
                  </Card>
                </CardOut>
              );
            })}
      </RepoBlockList>
    </>
  );
};

export default OpenSourcePage;
