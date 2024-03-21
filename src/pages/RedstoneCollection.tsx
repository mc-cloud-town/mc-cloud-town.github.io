import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import CardsSection from '#/common/CardsSection.tsx';
import CollectionModal from '#/collection/CollectionModal.tsx';

import { ICollection } from '@/types/ICollection.ts';

const data: ICollection = {
  title: '出生點設施',
  subTitle: '匯集 4 個紅石設施',
  imageUrl: 'homePage/CTEC_Building.webp',
  date: '2023-08-01',
  downloadUrl: 'https://discord.com/channels/933290709589577728/1001472836625518612/1220232556486725662',
  galleryImagesUrl: [
    'homePage/CTEC_Building.webp',
    'homePage/CTEC_Hardware.webp',
    'homePage/CTEC_Redstone.webp',
    'homePage/CTEC_Sort.webp',
  ],
  creator: [
    '專案經理:Fantasy_Sakura',
    '混凝土固化機作者:yisibite',
    '百萬倉庫作者:acaciachan',
    '自適應打包機:redberd'
  ],
  tags: ['紅石', '設施', '自動化', '出生點'],
  introductions: [
    '這個出生點設施匯集了 4 個紅石設施，包括混凝土固化機、百萬倉庫、自適應打包機和自動化糖蔗農場。',
    '這些設施都是由不同的作者製作，這個出生點設施的製作者是Fantasy_Sakura。'
  ],
};

const testData: ICollection[] = Array(7).fill(data);

const RedstoneCollection = () => {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ICollection | null>(null);

  const handleCardClick = (item: ICollection) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  }

  const bindEventImageContent: ICollection[] = testData.map((item) => ({
    ...item,
    clickEvent: () => handleCardClick(item),
  }));

  return (
    <>
      <PageHeader
        backgroundComponent={<></>}
        maskColor={'#6f9b9c'}
        headerTextArray={[t('redstoneCollection.title')]}
      />
      <CardsSection title={t('redstoneCollection.title')} darkMode={true} imageContentSections={bindEventImageContent} />
      <CollectionModal
        isOpen={isModalOpen}
        item={selectedItem}
        onClose={handleModalClose}
      />
    </>
  );
};

export default RedstoneCollection
