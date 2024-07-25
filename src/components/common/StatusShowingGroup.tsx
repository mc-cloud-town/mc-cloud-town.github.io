import React from 'react';
import { WarningOutlined } from '@ant-design/icons';
import { Spin, Typography } from 'antd';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const StatusContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  i {
    background-color: #feffe6 !important;
  }

  span {
    margin-left: 10px;
    color: #feffe6;
  }
`;

interface StatusShowingGroupProps {
  error: { message: string } | null;
  loading: boolean;
}

export const StatusShowingGroup: React.FC<StatusShowingGroupProps> = ({
  error,
  loading,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {error && (
        <StatusContainer>
          <WarningOutlined style={{ fontSize: '24px', color: '#feffe6' }} />
          <Typography.Text>{t('error')}</Typography.Text>
        </StatusContainer>
      )}
      {loading && (
        <StatusContainer>
          <Spin size='large' spinning={true} />
          <Typography.Text>{t('loading')}</Typography.Text>
        </StatusContainer>
      )}
    </>
  );
};
