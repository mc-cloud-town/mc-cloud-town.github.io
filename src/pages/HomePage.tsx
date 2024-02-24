import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderBackground from '#/homePage/header/HeaderBackground.tsx';
import HeaderTimer from '#/homePage/header/HeaderTimer.tsx';
import ImageContentSection from '#/common/ImageContentSection.tsx';

import { imageContent } from '@/types/imageContent.ts';
import CTEC_Sort_7 from '@/assets/homePage/CTEC_Sort_7.png';
import CardsSection from '#/common/CardsSection.tsx';
import CarouselSection from '#/common/CarouselSection.tsx';

const HomePage = () => {
    const { t } = useTranslation();
    const aboutSectionImageContent: imageContent = {
      imageUrl: CTEC_Sort_7,
      title: t('home.about.title'),
      subTitle: t('home.about.subTitle'),
      features: [
        t('home.about.features.0'),
        t('home.about.features.1'),
        t('home.about.features.2'),
        t('home.about.features.3'),
        t('home.about.features.4')
      ],
      buttonLink: '/survival',
      buttonText: t('home.about.button')
    };

    const featureSectionImageContents: imageContent[] = [
      {
        imageUrl: CTEC_Sort_7,
        title: t('home.feature.card.0.title'),
        paragraph: t('home.feature.card.0.description'),
        buttonLink: '/building',
        buttonText: t('home.feature.card.0.button')
      },
      {
        imageUrl: CTEC_Sort_7,
        title: t('home.feature.card.1.title'),
        paragraph: t('home.feature.card.1.description'),
        buttonLink: '/redstone',
        buttonText: t('home.feature.card.1.button')
      },
      {
        imageUrl: CTEC_Sort_7,
        title: t('home.feature.card.2.title'),
        paragraph: t('home.feature.card.2.description'),
        buttonLink: '/hardware',
        buttonText: t('home.feature.card.2.button')
      }
    ];

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
        <ImageContentSection imageContent={aboutSectionImageContent} />
        <CardsSection
          title={t('home.feature.title')}
          darkMode={true}
          imageContentSections={featureSectionImageContents}
        />
        <CarouselSection
          title={t('home.carousel.title')}
          imageContentsSections={[
            featureSectionImageContents,
            featureSectionImageContents,
            featureSectionImageContents
          ]}
        />
      </>
    );
  }
;

export default HomePage;
