import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import Timeline from '#/survivalProgress/TimeLine.tsx';

import useApi from '@/hooks/useApi.ts';
import { ICollection } from '@/types/ICollection.ts';
import { STATIC_DATA_API } from '@/constants';
import { StatusShowingGroup } from '#/common/StatusShowingGroup.tsx';

const SurvivalProgress = () => {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useApi<ICollection[]>(
    `${STATIC_DATA_API}/${i18n.language}/survivalProgress.json`,
  );

  const params = new URLSearchParams(window.location.search);
  const shareIndex = parseInt(params.get('index') ?? '-1');

  return (
    <>
      <PageHeader
        backgroundComponent={<></>}
        headerTextArray={[t('survivalProgress.title')]}
        subHeaderContentArray={[t('survivalProgress.description')]}
      />
      <StatusShowingGroup error={error} loading={loading} />
      {data && (
        <Timeline items={[...data].reverse()} activeIndex={shareIndex} />
      )}
    </>
  );
};

export default SurvivalProgress;
