import { Col } from 'antd';
import { Card } from 'antd';
import styled from 'styled-components';

import { repoType } from '@/types/repoType';

const { Meta } = Card;

const StyledCard = styled(Card)`
  background-color: white;
`;

const RepoCard = ({ repo }: { repo: repoType }) => {
  return (
    <Col key={repo.name} xs={24} sm={12} md={8} lg={6} xl={4}>
      <StyledCard
        hoverable
        style={{ marginBottom: 30 }}
        onClick={() => window.open(repo.html_url)}
      >
        <Meta
          title={<span style={{ fontWeight: 'bold' }}>{repo.name}</span>}
          description={<span>{repo.description}</span>}
        />
      </StyledCard>
    </Col>
  );
};

export default RepoCard;
