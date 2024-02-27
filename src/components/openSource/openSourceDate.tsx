import { Col } from 'antd';
import { Card } from 'antd';
import styled from 'styled-components';

import { IRepoType } from '@/types/IRepoType.ts';

const StyledCard = styled(Card)`
  background-color: white;
  margin: 10px;
`;

const RepoName = styled.span`
  font-weight: bold;
`;

const RepoCard = (
  {
    repo
  }: {
    repo: IRepoType
  }) => {
  return (
    <Col key={repo.name} xs={24} sm={12} md={8} lg={6} xl={4}>
      <StyledCard
        hoverable
        onClick={() => window.open(repo.html_url)}
      >
        <Card.Meta
          title={<RepoName>{repo.name}</RepoName>}
          description={<span>{repo.description}</span>}
        />
      </StyledCard>
    </Col>
  );
};

export default RepoCard;
