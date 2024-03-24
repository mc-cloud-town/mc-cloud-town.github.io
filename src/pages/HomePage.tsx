import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import PageHeader from '#/common/PageHeader.tsx';
import ImageContentSection from '#/common/ImageContentSection.tsx';
import CardsSection from '#/common/CardsSection.tsx';
import CarouselSection from '#/common/CarouselSection.tsx';
import HeaderVideo from '#/common/HeaderVideo.tsx';
import HeaderTimer from '#/common/HeaderTimer.tsx';

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderVideo {...t('home.backgroundVideo', { returnObjects: true })} />}
        headerTextArray={[
          'Cloud Town Exquisite Craft',
          '雲鎮工藝 | CTEC',
          '云镇工艺 | CTEC'
        ]}
        subHeaderContentArray={[
          <span>{t('home.description')}</span>,
          <HeaderTimer />,
          <Link to="/join">
            <Button color="primary" size="large" ghost={true}>
              {t('home.joinButton')}
            </Button>
          </Link>
        ]}
        useTyped={true}
      />
      <ImageContentSection
        imageContent={t('home.about', { returnObjects: true })}
      />
      <CardsSection
        title={t('home.feature.title')}
        darkMode={true}
        imageContentSections={t('home.feature.card', { returnObjects: true })}
      />
      <CarouselSection
        title={t('home.carousel.title')}
        imageContentsSections={[
          t('home.feature.card', { returnObjects: true }),
          t('home.feature.card', { returnObjects: true }),
          t('home.feature.card', { returnObjects: true })
        ]}
      />
    </>
  );
};
export default HomePage;
