import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import MemberCase from '#/members/MemberCase.tsx';

import background from '@/assets/members/background.png';

const Container = styled.div`
  padding: 50px 40px;
  background-color: #ecf0f1;
  
  @media (max-width: 400px) {
    padding: 50px 10px;
  }
`;

const MembersPage = () => {
  const member =
    {
      id: 'test',
      name: 'test',
      introduction: '這是一個比較長的介紹,這是一個比較長的介紹,這是一個比較長的介紹'
    };

  const testMember = Array(21).fill(member);

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
      <Container>
        <MemberCase
          members={testMember}
        />
      </Container>
    </>
  );
};

export default MembersPage;
