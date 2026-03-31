import React from 'react';
import { WarningOutlined } from '@ant-design/icons';
import { Spin, Typography } from 'antd';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const StatusContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 48px 0;
  color: var(--text-secondary);

  .anticon {
    color: var(--color-primary);
  }

  .ant-spin-dot-item {
    background-color: var(--color-primary);
  }

  .ant-typography {
    color: inherit;
    margin-bottom: 0;
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
          <WarningOutlined style={{ fontSize: '24px' }} />
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
