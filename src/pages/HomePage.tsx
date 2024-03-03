import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import PageHeader from '#/common/PageHeader.tsx';
import ImageContentSection from '#/common/ImageContentSection.tsx';
import CardsSection from '#/common/CardsSection.tsx';
import CarouselSection from '#/common/CarouselSection.tsx';
import HeaderBackground from '#/homePage/header/HeaderBackground.tsx';
import HeaderTimer from '#/homePage/header/HeaderTimer.tsx';

import { IImageContent } from '@/types/IImageContent.ts';

interface IHomePageCard {
  imageUrl: string;
  title: string;
  description: string;
  button: string;
  buttonLink: string;
}

const HomePage = () => {
  const { t } = useTranslation();
  const features: string[] = t('home.about.features', { returnObjects: true });
  const aboutSectionImageContent: IImageContent = {
    imageUrl: t('home.about.imageUrl'),
    title: t('home.about.title'),
    subTitle: t('home.about.subTitle'),
    features: features,
    buttons: [
      {
        text: t('home.about.button'),
        link: '/survival',
      },
    ],
  };

  const cards: IHomePageCard[] = t('home.feature.card', { returnObjects: true });
  const featureSectionImageContents: IImageContent[] = cards.map((card) => {
    return {
      imageUrl: card.imageUrl,
      title: card.title,
      paragraph: card.description,
      buttons: [
        {
          text: card.button,
          link: `/${card.buttonLink}`,
        },
      ],
    };
  });

  console.log(featureSectionImageContents);

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderBackground />}
        headerTextArray={[
          'Cloud Town Exquisite Craft',
          '雲鎮工藝 | CTEC',
          '云镇工艺 | CTEC',
        ]}
        subHeaderContentArray={[
          <span>{t('home.description')}</span>,
          <HeaderTimer />,
          <Link to="/join">
            <Button color="primary" size="large" ghost={true}>
              {t('home.joinButton')}
            </Button>
          </Link>,
        ]}
        useTyped={true}
      />
      <ImageContentSection
        imageContent={aboutSectionImageContent}
      />
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
          featureSectionImageContents,
        ]}
      />
    </>
  );
};
export default HomePage;
