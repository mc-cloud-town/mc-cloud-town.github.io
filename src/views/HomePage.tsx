'use client';

import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import PageHeader from '#/common/PageHeader.tsx';
import ImageContentSection from '#/common/ImageContentSection.tsx';
import CardsSection from '#/common/CardsSection.tsx';
import CarouselSection from '#/common/CarouselSection.tsx';
import HeaderVideo from '#/common/HeaderVideo.tsx';
import HeaderTimer from '#/common/HeaderTimer.tsx';

import { IImageContent } from '@/types/IImageContent.ts';
import { STATIC_DATA_API } from '@/constants';
import useApi from '@/hooks/useApi.ts';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const { data: survivalProgress } = useApi<IImageContent[]>(
    `${STATIC_DATA_API}/${i18n.language}/survivalProgress.json`,
  );
  const { data: redstoneCollection } = useApi<IImageContent[]>(
    `${STATIC_DATA_API}/${i18n.language}/redstoneCollection.json`,
  );
  const { data: architectureCollection } = useApi<IImageContent[]>(
    `${STATIC_DATA_API}/${i18n.language}/architectureCollection.json`,
  );

  const router = useRouter();

  const createSections = (data: IImageContent[], route: string) => {
    if (route === 'survivalProgress') {
      const sliceIndex = Math.max(data.length - 3, 0);
      return data
        .slice(sliceIndex)
        .reverse()
        .map((item, index) => ({
          ...item,
          clickEvent: () => router.push(`/${route}/?index=${index}`),
        }));
    }

    const sliceIndex = Math.max(data.length - 3, 0);
    return data.slice(sliceIndex).map((item, index) => ({
      ...item,
      clickEvent: () => router.push(`/${route}/?index=${sliceIndex + index}`),
    }));
  };

  const imageContentsSections = [];

  if (survivalProgress) {
    imageContentsSections.push(
      createSections(survivalProgress, 'survivalProgress'),
    );
  }

  if (redstoneCollection) {
    imageContentsSections.push(
      createSections(redstoneCollection, 'redstoneCollection'),
    );
  }

  if (architectureCollection) {
    imageContentsSections.push(
      createSections(architectureCollection, 'architectureCollection'),
    );
  }

  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderVideo
            {...(t('home.backgroundVideo', {
              returnObjects: true,
            }) as { youtubeId: string; start: number })}
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
          <Link href='/join/'>
            <Button color='primary' size='large' ghost={true}>
              {t('home.joinButton')}
            </Button>
          </Link>,
        ]}
        useTyped={true}
      />
      <ImageContentSection
        imageContent={t('home.about', { returnObjects: true }) as IImageContent}
      />
      <ImageContentSection
        imageContent={
          t('home.frostPursuit', { returnObjects: true }) as IImageContent
        }
        imageOnRight={true}
        darkMode={true}
      />
      <CardsSection
        title={t('home.feature.title')}
        type={'dark'}
        imageContentSections={
          t('home.feature.card', { returnObjects: true }) as IImageContent[]
        }
      />
      <CarouselSection
        title={t('home.carousel.title')}
        subtitles={
          t('home.carousel.subtitles', { returnObjects: true }) as string[]
        }
        imageContentsSections={imageContentsSections}
        useStaticDataApi={true}
      />
    </>
  );
};
export default HomePage;
