import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import HeaderTimer from '#/common/HeaderTimer.tsx';
import ImageContentSection from '#/common/ImageContentSection.tsx';

import getImageUrl from '@/utils/getImageUrl.ts';

const JoinServer = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderImage imageUrl={getImageUrl(t('join.imageUrl'))} />
        }
        headerTextArray={[t('join.description')]}
        // eslint-disable-next-line react/jsx-key
        subHeaderContentArray={[<HeaderTimer />]}
      />
      <ImageContentSection
        imageContent={t('join.redstone', { returnObjects: true })}
        darkMode={true}
      />
      <ImageContentSection
        imageContent={t('join.build', { returnObjects: true })}
        imageOnRight={true}
      />
      <ImageContentSection
        imageContent={t('join.logistics', { returnObjects: true })}
        darkMode={true}
      />
    </>
  );
};
export default JoinServer;
