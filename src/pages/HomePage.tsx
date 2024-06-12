import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import PageHeader from '#/common/PageHeader.tsx';
import ImageContentSection from '#/common/ImageContentSection.tsx';
import CardsSection from '#/common/CardsSection.tsx';
import CarouselSection from '#/common/CarouselSection.tsx';
import HeaderVideo from '#/common/HeaderVideo.tsx';
import HeaderTimer from '#/common/HeaderTimer.tsx';

import { IImageContent } from '@/types/IImageContent.ts';

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const createSections = (key: string, route: string) => {
    const data = t(key, { returnObjects: true }) as IImageContent[];

    if (route === 'survivalProgress') {
      const sliceIndex = Math.max(data.length - 3, 0);
      return data
        .slice(sliceIndex)
        .reverse()
        .map((item, index) => ({
          ...item,
          clickEvent: () => navigate(`/${route}?index=${index}`),
        }));
    }

    const sliceIndex = Math.max(data.length - 3, 0);
    return data.slice(sliceIndex).map((item, index) => ({
      ...item,
      clickEvent: () => navigate(`/${route}?index=${sliceIndex + index}`),
    }));
  };

  const imageContentsSections = [
    createSections('survivalProgress.data', 'survivalProgress'),
    createSections(
      'architectureCollection.collections',
      'architectureCollection',
    ),
    createSections('redstoneCollection.collections', 'redstoneCollection'),
  ];

  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderVideo
            {...t('home.backgroundVideo', { returnObjects: true })}
          />
        }
        headerTextArray={[
          'Cloud Town Exquisite Craft',
          '雲鎮工藝 | CTEC',
          '云镇工艺 | CTEC',
        ]}
        subHeaderContentArray={[
          // eslint-disable-next-line react/jsx-key
          <span>{t('home.description')}</span>,
          // eslint-disable-next-line react/jsx-key
          <HeaderTimer />,
          // eslint-disable-next-line react/jsx-key
          <Link to='/join/'>
            <Button color='primary' size='large' ghost={true}>
              {t('home.joinButton')}
            </Button>
          </Link>,
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
        subtitles={
          t('home.carousel.subtitles', { returnObjects: true }) as string[]
        }
        imageContentsSections={imageContentsSections}
      />
    </>
  );
};
export default HomePage;
