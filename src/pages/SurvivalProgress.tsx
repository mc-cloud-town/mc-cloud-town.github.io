import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';

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
    </>
  );
};

export default SurvivalProgress;