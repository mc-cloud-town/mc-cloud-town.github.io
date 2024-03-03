import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import MemberCase from '#/members/MemberCase.tsx';

import useApi from '@/hooks/useApi.ts';
import { MEMBER_API } from '@/constants';
import { IMember } from '@/types/IMember.ts';
import background from '@/assets/members/background.png';
import { WarningOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

const Container = styled.div`
  padding: 50px 40px;
  background-color: #ecf0f1;

  @media (max-width: 400px) {
    padding: 50px 10px;
  }
`;

const StatusContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  
  svg {
    color: #6f9b9c !important;
  }

  span {
    margin-left: 10px;
    color: #6f9b9c;
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
        {error && (
          <StatusContainer>
            <WarningOutlined style={{ fontSize: '24px', color: '#feffe6' }} />
            <span>{t('error')}</span>
          </StatusContainer>
        )}
        {loading && (
          <StatusContainer>
            <Spin size="large" spinning={true} />
            <span>{t('loading')}</span>
          </StatusContainer>
        )}
        {!loading && !error && data && <MemberCase members={data} />}
      </Container>
    </>
  );
};

export default MembersPage;
