import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';

import getImageUrl from '@/utils/getImageUrl.ts';
import { ICollection } from '@/types/ICollection.ts';
import { useEffect, useState } from 'react';
import CardsSection from '#/common/CardsSection.tsx';
import CollectionModal from '#/collection/CollectionModal.tsx';

const ArchitectureCollection = () => {
  const { t } = useTranslation();
  const imageContents: ICollection[] = t('architectureCollection.collections', { returnObjects: true });

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

  const imageUrl = t('architectureCollection.imageUrl') == 'architectureCollection.imageUrl' ?
    imageContents[Math.floor(Math.random() * imageContents.length)].imageUrl : t('architectureCollection.imageUrl');

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
        headerTextArray={[t('architectureCollection.title')]}
      />
      <CardsSection title={t('architectureCollection.title')} darkMode={true}
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

export default ArchitectureCollection;
