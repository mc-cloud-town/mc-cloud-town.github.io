import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';

import getImageUrl from '@/utils/getImageUrl.ts';

const ArchitectureCollection = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={getImageUrl(t('buildingCollection.imageUrl'))} />}
        maskColor={'#6f9b9c'}
        headerTextArray={[t('buildingCollection.title')]}
      />
    </>
  );
};

export default ArchitectureCollection;
