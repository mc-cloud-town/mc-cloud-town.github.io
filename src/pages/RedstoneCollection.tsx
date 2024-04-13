import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import CardsSection from '#/common/CardsSection.tsx';
import CollectionModal from '#/collection/CollectionModal.tsx';

import { ICollection } from '@/types/ICollection.ts';
import HeaderImage from '#/common/HeaderImage.tsx';
import getImageUrl from '@/utils/getImageUrl.ts';

const RedstoneCollection = () => {
  const { t } = useTranslation();
  const imageContents: ICollection[] = t('redstoneCollection.collections', { returnObjects: true })

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
      const item = imageContents[index];
      if (item) {
        setSelectedItem({ item, index });
        setIsModalOpen(true);
      }
    }
  }, []);

  const imageUrl = t('redstoneCollection.imageUrl') == 'redstoneCollection.imageUrl' ?
    imageContents[Math.floor(Math.random() * imageContents.length)].imageUrl : t('redstoneCollection.imageUrl');

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
