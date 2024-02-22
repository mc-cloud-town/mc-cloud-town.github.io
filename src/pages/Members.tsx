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
    };

  // Generate a test member array (20 members)
  const testMember = Array(20).fill(ttmember);

  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={background} />}
        headerTextArray={[
          t('members.title'),
        ]}
        subHeaderContentArray={[
          t('members.description'),
        ]}
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
