import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import MemberCase from '#/members/MemberCase.tsx';

import background from '@/assets/members/background.png';

const MemberPageDiv = styled.div`
  background-color: #ecf0f1;
`;

const MembersPage = () => {
  const ttmember =
  {
      id: 'test',
      name: 'test',
      introduction: '這是一個比較長的介紹,這是一個比較長的介紹,這是一個比較長的介紹'
  }
  const testMember = []
  for (let i = 0; i < 20; i++) {
    testMember.push(ttmember)
  }

  const { t } = useTranslation();

  const headerTextArray = [
    t('members.title'),
    t('members.description'),
  ];

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={background} />}
        headerTextArray={headerTextArray}
      />
      <MemberPageDiv>
        <MemberCase
          members={testMember}
        />
      </MemberPageDiv>
    </>
  );
};

export default MembersPage;
