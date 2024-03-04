import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import Timeline from '#/survivalProgress/timeline';

import background from '@/assets/survivalProgress/background.jpg';

const SurvivalProgress = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={background} />}
        headerTextArray={[
          t('survivalProgress.title')
        ]}
        subHeaderContentArray={[
          t('survivalProgress.description'),
        ]}
      />
      <Timeline />

    </>
  );
};

export default SurvivalProgress;