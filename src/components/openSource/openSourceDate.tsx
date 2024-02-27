import { Col } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { LanguageColorType } from '@/types/languageColor.ts';
const { Meta } = Card;

import languageColor from '@/assets/openSource/colors.json';
import styled from 'styled-components';
import { repoType } from '@/types/repoType';

const LangShow = styled.div`
  margin-top: 10px;
`;

const StyledCard = styled(Card)`
  background-color: #0d1117;
`;

const Color: LanguageColorType = languageColor;

const RepoCard = ({ repo }: { repo: repoType }) => {
  const language = repo.language;

  return (
    <Col key={repo.name} xs={24} sm={12} md={8} lg={6} xl={4}>
      <StyledCard
        hoverable
        style={{ marginBottom: 30 }}
        onClick={() => window.open(repo.html_url)}
      >
        <Meta
          title={<span style={{ color: 'white' }}>{repo.name}</span>}
          description={
            <span style={{ color: 'white' }}>{repo.description}</span>
          }
        />
        <LangShow>
          <LeftOutlined />
          <span style={{ color: Color[language]?.color ?? 'white' }}>
            {language ? language : 'Other'}
          </span>
          <RightOutlined />
        </LangShow>
      </StyledCard>
    </Col>
  );
};

export default RepoCard;
