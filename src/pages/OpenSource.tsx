import styled from 'styled-components';
import { Dict } from 'styled-components/dist/types';
import { UseApi } from '@/hooks/useApi';
import { Card } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const { Meta } = Card;
const Repoblocklist = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
`;

const CardOut = styled.div``


const OpsnSourcePage = () => {
  const { data, loading, error } = UseApi(
    'https://api.github.com/orgs/mc-cloud-town/repos',
  );
  return (
    <>
      <Repoblocklist>
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
      </Repoblocklist>
    </>
  );
};

export default OpsnSourcePage;
