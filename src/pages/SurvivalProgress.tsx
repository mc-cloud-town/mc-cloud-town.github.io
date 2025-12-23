import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useEffect } from 'react';

import PageHeader from '#/common/PageHeader.tsx';
import Timeline from '#/survivalProgress/TimeLine.tsx';

import useApi from '@/hooks/useApi.ts';
import { ICollection } from '@/types/ICollection.ts';
import { STATIC_DATA_API } from '@/constants';
import { StatusShowingGroup } from '#/common/StatusShowingGroup.tsx';

const PageWrapper = styled.div`
  position: relative;
  background: transparent;
  min-height: 100vh;
`;

const SurvivalProgress = () => {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useApi<ICollection[]>(
    `${STATIC_DATA_API}/${i18n.language}/survivalProgress.json`,
  );

  const params = new URLSearchParams(window.location.search);
  const shareIndex = parseInt(params.get('index') ?? '-1');

  // Add transparent class to body while on this page
  useEffect(() => {
    document.body.classList.add('transparent-bg');
    return () => {
      document.body.classList.remove('transparent-bg');
    };
  }, []);

  return (
    <PageWrapper>
      <PageHeader
        backgroundComponent={<></>}
        headerTextArray={[t('survivalProgress.title')]}
        subHeaderContentArray={[t('survivalProgress.description')]}
        transparent={true}
      />
      <StatusShowingGroup error={error} loading={loading} />
      {data && (
        <Timeline items={[...data].reverse()} activeIndex={shareIndex} />
      )}
    </PageWrapper>
  );
};

export default SurvivalProgress;
