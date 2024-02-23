import styled from 'styled-components';
import { Dict } from 'styled-components/dist/types';
import { Card } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

import useApi from '@/hooks/useApi';

const { Meta } = Card;
const RepoBlockList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
`;

const CardOut = styled.div``;


const OpenSourcePage = () => {
  const { data, loading, error } = useApi(
    'https://api.github.com/orgs/mc-cloud-town/repos'
  );
  return (
    <>
      <RepoBlockList>
        {error && <p>Error</p>}
        {loading && <p>Loading</p>}
        {Array.isArray(data) &&
          data.map((repo: Dict) => {
            return (
              <CardOut onClick={() => window.open(repo.html_url)}>
                <Card hoverable>
                  <Meta title={repo.name} description={repo.description} />
                  <LeftOutlined />
                  <RightOutlined />
                  <span>{repo.language}</span>
                </Card>
              </CardOut>
            );
          })}
      </RepoBlockList>
    </>
  );
};

export default OpenSourcePage;
