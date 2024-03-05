import { Row, Col } from 'antd';

import { IMember } from '@/types/IMember.ts';
import 'react-lazy-load-image-component/src/effects/blur.css';
import MemberCard from '#/members/MemberCard.tsx';
import styled from 'styled-components';
import { useMemo } from 'react';
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

const MemberCase = ({ members }: { members: IMember[] }) => {
  const { t } = useTranslation();

  const memoizedGroupMap = useMemo(() => {
    return members.reduce((acc: IMemberGroup, member: IMember) => {
      if (!acc[member.group]) {
        acc[member.group] = [];
      }
      acc[member.group].push(member);
      return acc;
    }, {});
  }, [members]);

  return (
    <>
      {Object.keys(memoizedGroupMap).map((group) => (
        <GroupRow key={group} gutter={[16, 16]}>
          <Col span={24}>
            <SectionTitle>{t(`members.${group}Group.title`)}</SectionTitle>
            <SectionSubtitle>{t(`members.${group}Group.subTitle`)}</SectionSubtitle>
          </Col>
          {memoizedGroupMap[group].map((member, index) => (
            <Col key={index} span={24} sm={12} md={12} lg={8}>
              <MemberCard member={member} />
            </Col>
          ))}
        </GroupRow>
      ))}
    </>
  );
};

export default MemberCase;
