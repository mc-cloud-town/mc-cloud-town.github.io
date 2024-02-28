import { Col } from 'antd';
import { Card } from 'antd';
import styled from 'styled-components';

import { IRepoType } from '@/types/IRepoType.ts';
import { PythonOutlined } from '@ant-design/icons';

const StyledCard = styled(Card)`
  margin: 10px;
  background-color: #f1f1f1;
`;

const StyleCardMeta = styled(Card.Meta)`
  text-align: center;
`;

const RepoName = styled.span`
  font-weight: bold;
`;

const StylePythonOutlined = styled(PythonOutlined)`
  font-size: 50px;
  padding: 10px;
`;

const RepoCard = ({ repo }: { repo: IRepoType }) => {
  return (
    <Col key={repo.name} xs={24} sm={12} md={8} lg={6} xl={4}>
      <StyledCard
        hoverable
        onClick={() => window.open(repo.html_url)}
        cover={<StylePythonOutlined />}
      >
        <StyleCardMeta title={<RepoName>{repo.name}</RepoName>} />
      </StyledCard>
    </Col>
  );
};

export default RepoCard;
