import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderBackground from '#/homePage/header/HeaderBackground.tsx';
import HeaderTimer from '#/homePage/header/HeaderTimer.tsx';
import ImageContentSection from '#/common/ImageContentSection.tsx';

import CTEC_Sort_7 from '@/assets/homePage/CTEC_Sort_7.png';

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderBackground />}
        headerTextArray={[
          'Cloud Town Exquisite Craft',
          '雲鎮工藝 | CTEC',
          '云镇工艺 | CTEC'
        ]}
        subHeaderContentArray={[
          <span>{t('home.description')}</span>,
          <HeaderTimer />,
          <Link to="/join">
            <Button
              color="primary"
              size="large"
              ghost={true}
            >
              {t('home.joinButton')}
            </Button>
          </Link>
        ]}
        useTyped={true}
      />
      <ImageContentSection
        title={t('home.about.title')}
        subTitle={t('home.about.subTitle')}
        features={[
          t('home.about.features.0'),
          t('home.about.features.1'),
          t('home.about.features.2'),
          t('home.about.features.3'),
          t('home.about.features.4'),
        ]}
        buttonLink="/survival"
        buttonText={t('home.about.button')}
        imageUrl={CTEC_Sort_7}
      />
    </>
  );
};

export default HomePage;
