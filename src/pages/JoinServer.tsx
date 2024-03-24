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
      <a target=""></a>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={getImageUrl(t('join.imageUrl'))} />}
        maskColor={'#6f9b9c'}
        headerTextArray={[t('join.description')]}
        subHeaderContentArray={[<HeaderTimer />]}
      />
      <ImageContentSection
        imageContent={t('join.redstone', {returnObjects: true})}
        darkMode={true}
      ></ImageContentSection>
      <ImageContentSection
        imageContent={t('join.build', {returnObjects: true})}
        imageOnRight={true}
      ></ImageContentSection>
      <ImageContentSection
        imageContent={t('join.logistics', {returnObjects: true})}
        darkMode={true}
      ></ImageContentSection>
    </>
  );
};
export default JoinServer;
