import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import Timeline from '#/survivalProgress/TimeLine.tsx';

import { IImageContent } from '@/types/IImageContent.ts';

const SurvivalProgress = () => {
  const { t } = useTranslation();

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
      />
    </>
  );
};

export default SurvivalProgress;
