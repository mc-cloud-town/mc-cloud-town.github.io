import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import Timeline from '#/survivalProgress/TimeLine.tsx';

import { IImageContent } from '@/types/IImageContent.ts';

const SurvivalProgress = () => {
  const { t } = useTranslation();

  const params = new URLSearchParams(window.location.search);
  const shareIndex = parseInt(params.get('index') ?? '-1');

  return (
    <>
      <PageHeader
        backgroundComponent={<></>}
        headerTextArray={[t('survivalProgress.title')]}
        subHeaderContentArray={[t('survivalProgress.description')]}
      />
      <Timeline
        items={
          t('survivalProgress.data', { returnObjects: true }) as IImageContent[]
        }
        activeIndex={shareIndex}
      />
    </>
  );
};

export default SurvivalProgress;
