import { useTranslation } from 'react-i18next';
import { WarningOutlined } from '@ant-design/icons';
import { Input, Spin } from 'antd';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import MemberCase from '#/members/MemberCase.tsx';

import useApi from '@/hooks/useApi.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { MEMBER_API } from '@/constants';
import { IMembers } from '@/types/IMember.ts';

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

const SearchContainer = styled.div`
  margin-bottom: 50px;
  display: flex;
  justify-content: center;
`;

const StyledInput = styled(Input)`
  max-width: 400px;
`;

const MembersPage = () => {
  const { data, loading, error } = useApi<IMembers>(MEMBER_API);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = useMemo(() => {
    const groups = ['member', 'trial'];

    const d = Object.fromEntries(
      Object.entries(data || {})
        .filter(([category]) => groups.includes(category))
        .map(([category, items]) => {
          return [
            category,
            items.filter((item) =>
              item.name.includes(searchTerm.toLowerCase()),
            ),
          ];
        }),
    );
    console.log(d);

    return d;
  }, [data, searchTerm]);

  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderImage imageUrl={getImageUrl(t('members.imageUrl'))} />
        }
        headerTextArray={[t('members.title')]}
        subHeaderContentArray={[t('members.description')]}
      />
      <Container>
        <SearchContainer>
          <StyledInput
            placeholder={t('members.searchPlaceholder')}
            variant={'filled'}
            onChange={(e) => setSearchTerm(e.target.value)}
            size={'large'}
            name={'Search Members'}
          />
        </SearchContainer>
        {error && (
          <StatusContainer>
            <WarningOutlined style={{ fontSize: '24px', color: '#feffe6' }} />
            <span>{t('error')}</span>
          </StatusContainer>
        )}
        {loading && (
          <StatusContainer>
            <Spin size="large" />
            <span>{t('loading')}</span>
          </StatusContainer>
        )}
        {!loading && !error && (
          <MemberCase members={filteredMembers} searchMode={!!searchTerm} />
        )}
      </Container>
    </>
  );
};

export default MembersPage;
