import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Card, Row, Col } from 'antd';
import openSource from '@/assets/openSource/openSource.jpg';
import languageColor from '@/assets/openSource/languageToColor.json';

import HeaderImage from '#/common/HeaderImage.tsx';
import PageHeader from '#/common/PageHeader.tsx';
import useApi from '@/hooks/useApi';

const { Meta } = Card;

const LangShow = styled.div`
  margin-top: 10px;
`;

const RepoBlockList = styled.div`
  background: #b1dde6;
  padding: 30px;
`;

const StyledCard = styled(Card)`
  background-color: #0d1117;
`;

type LanguageColor = {
  [key: string]: string;
};

const Color: LanguageColor = languageColor;

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
              .map((repo) => (
                <Col key={repo.name} xs={24} sm={12} md={8} lg={6} xl={4}>
                  <StyledCard
                    hoverable
                    style={{ marginBottom: 30 }}
                    onClick={() => window.open(repo.html_url)}
                  >
                    <Meta
                      title={
                        <span style={{ color: 'white' }}>{repo.name}</span>
                      }
                      description={
                        <span style={{ color: 'white' }}>
                          {repo.description}
                        </span>
                      }
                    />
                    <LangShow>
                      <LeftOutlined />
                      <span
                        style={{
                          color: Color[repo.language]
                            ? Color[repo.language]!
                            : 'white',
                        }}
                      >
                        {repo.language ? repo.language : 'Other'}
                      </span>
                      <RightOutlined />
                    </LangShow>
                  </StyledCard>
                </Col>
              ))}
        </Row>
      </RepoBlockList>
    </>
  );
};

export default OpenSourcePage;
