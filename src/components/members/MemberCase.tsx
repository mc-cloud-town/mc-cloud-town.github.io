import { Row, Col } from 'antd';

import { IMember } from '@/types/IMember.ts';
import 'react-lazy-load-image-component/src/effects/blur.css';
import MemberCard from '#/members/MemberCard.tsx';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const SectionTitle = styled.h2`
  text-align: center;
  color: inherit;
  margin-bottom: 20px;
  font-weight: bolder;
`;

const SectionSubtitle = styled.h3`
  text-align: center;
  color: inherit;
  margin: 20px 0;
  font-weight: bolder;
`;

const GroupRow = styled(Row)`
  margin-bottom: 50px;

  &last-child {
    margin-bottom: 0;
  }
`;

interface IMemberGroup {
  [key: string]: IMember[];
}

interface MemberCaseProps {
  searchMode: boolean;
  memberGroups: IMemberGroup;
}

const MemberCase = ({ memberGroups, searchMode }: MemberCaseProps) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Show when all members ar empty */}
      {Object.values(memberGroups).every((members) => members.length === 0) && (
        <SectionTitle>{t('members.noResult')}</SectionTitle>
      )}
      {Object.entries(memberGroups).map(([group, members]) => (
        <GroupRow key={group} gutter={[16, 16]}>
          {members.length > 0 && (
            <Col span={24}>
              <SectionTitle>{t(`members.${group}Group.title`)}</SectionTitle>
              <SectionSubtitle>
                {t(`members.${group}Group.subTitle`)}
              </SectionSubtitle>
            </Col>
          )}
          {members.length > 0 &&
            members.map((member, index) => (
              <Col key={index} span={24} sm={12} md={12} lg={8}>
                <MemberCard member={member} searchMode={searchMode} />
              </Col>
            ))}
        </GroupRow>
      ))}
    </>
  );
};

export default MemberCase;
