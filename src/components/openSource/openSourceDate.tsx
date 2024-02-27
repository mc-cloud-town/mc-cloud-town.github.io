import { Col } from 'antd';
import { Card } from 'antd';
import styled from 'styled-components';

import { repoType } from '@/types/repoType';

const { Meta } = Card;

const StyledCard = styled(Card)`
  background-color: #f1f1f1;
  margin-bottom: 30;
`;

const RepoName = styled.span`
  font-weight: bold;
`;

const RepoDescription = styled.span`
  color: #999999;
`;

const RepoCard = ({ repo }: { repo: repoType }) => {
  return (
    <Col key={repo.name} xs={24} sm={12} md={8} lg={6} xl={4}>
      <StyledCard hoverable onClick={() => window.open(repo.html_url)}>
        <Meta
          title={<RepoName>{repo.name}</RepoName>}
          description={<RepoDescription>{repo.description}</RepoDescription>}
        />
      </StyledCard>
    </Col>
  );
};

export default RepoCard;
