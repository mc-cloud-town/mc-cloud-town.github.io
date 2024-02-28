import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import MemberCase from '#/members/MemberCase.tsx';

import useApi from '@/hooks/useApi.ts';
import { MEMBER_API } from '@/constants';
import { IMember } from '@/types/IMember.ts';
import background from '@/assets/members/background.png';

const Container = styled.div`
  padding: 50px 40px;
  background-color: #ecf0f1;

  @media (max-width: 400px) {
    padding: 50px 10px;
  }
`;

const MembersPage = () => {
  const { data, loading, error } = useApi<IMember[]>(MEMBER_API);
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={background} />}
        headerTextArray={[t('members.title')]}
        subHeaderContentArray={[t('members.description')]}
      />
      <Container>
        {loading && <p>{t('loading')}</p>}
        {error && <p>{error.message}</p>}
        {!loading && !error && data && <MemberCase members={data} />}
      </Container>
    </>
  );
};

export default MembersPage;
