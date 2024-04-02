import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import CardsSection from '#/common/CardsSection.tsx';
import CollectionModal from '#/collection/CollectionModal.tsx';

import { ICollection } from '@/types/ICollection.ts';
import HeaderImage from '#/common/HeaderImage.tsx';
import getImageUrl from '@/utils/getImageUrl.ts';

// To-Do: Remove this function after the data is available from the server
const generateRandomFileName = (prefix: string, suffix: string, min: number, max: number): string => {
  // Calculate a random number within the specified range
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  // Construct the file name using the prefix, random number, and suffix
  return `${prefix}${randomNumber}.${suffix}`;
};

const generateRandomData = (index: number): ICollection => {
  return {
    title: '出生點設施' + index,
    subTitle: '匯集 4 個紅石設施 ' + index,
    imageUrl: generateRandomFileName('survivalProgress/p', 'webp', 1, 37),
    date: '2023-08-01' + index,
    downloadUrl: 'https://discord.com/channels/933290709589577728/1001472836625518612/1220232556486725662',
    galleryImagesUrl: [
      generateRandomFileName('survivalProgress/p', 'webp', 1, 37),
      generateRandomFileName('survivalProgress/p', 'webp', 1, 37),
      generateRandomFileName('survivalProgress/p', 'webp', 1, 37),
      generateRandomFileName('survivalProgress/p', 'webp', 1, 37)
    ],
    videosUrl: [
      'https://www.youtube.com/embed/9W3QmzUZB8w?si=7txPXTR0PQuhavrR',
    ],
    videosThumbnailUrl: [
      generateRandomFileName('survivalProgress/p', 'webp', 1, 37),
    ],
    creator: [
      '專案經理:Fantasy_Sakura' + index,
      '混凝土固化機作者:yisibite' + index,
      '百萬倉庫作者:acaciachan' + index,
      '自適應打包機:redberd' + index
    ],
    tags: ['紅石', '設施', '自動化', '出生點', '出生點設施' + index],
    introductions: [
      '這個出生點設施匯集了 4 個紅石設施，包括混凝土固化機、百萬倉庫、自適應打包機和自動化糖蔗農場。' + index,
      '這些設施都是由不同的作者製作，這個出生點設施的製作者是Fantasy_Sakura。 ' + index
    ]
  };
};

const testData: ICollection[] = Array.from({ length: 10 }, (_, index) => generateRandomData(index));

const RedstoneCollection = () => {
  const { t } = useTranslation();
  // To-Do: Change this to fetch data after the data is available from the server
  const imageContents = testData;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    item: ICollection;
    index: number;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareIndex = params.get('share');
    if (shareIndex !== null) {
      const index = parseInt(shareIndex, 10);
      const item = testData[index];
      if (item) {
        setSelectedItem({ item, index });
        setIsModalOpen(true);
      }
    }
  }, []);

  const imageUrl = t('redstoneCollection.imageUrl') == 'redstoneCollection.imageUrl' ?
    imageContents[Math.floor(Math.random() * testData.length)].imageUrl : t('redstoneCollection.imageUrl');

  const handleCardClick = (item: ICollection, index: number) => {
    setSelectedItem({ item, index });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const bindEventImageContents: ICollection[] = imageContents.map((item, index) => ({
    ...item,
    clickEvent: () => handleCardClick(item, index)
  }));

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={getImageUrl(imageUrl)} />}
        maskColor={'#6f9b9c'}
        headerTextArray={[t('redstoneCollection.title')]}
      />
      <CardsSection title={t('redstoneCollection.title')} darkMode={true}
                    imageContentSections={bindEventImageContents} />
      {selectedItem && (
        <CollectionModal
          isOpen={isModalOpen}
          index={selectedItem.index}
          item={selectedItem.item}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

export default RedstoneCollection;
