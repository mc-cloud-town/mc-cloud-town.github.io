import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import CardsSection from '#/common/CardsSection.tsx';
import CollectionModal from '#/collection/CollectionModal.tsx';

import { ICollection } from '@/types/ICollection.ts';
import getImageUrl from '@/utils/getImageUrl.ts';

const CollectionPageBase  = ({ pageType }: { pageType: 'architecture' | 'redstone' }) => {
  const { t } = useTranslation();
  const imageContents: ICollection[] = t(`${pageType}Collection.collections`, { returnObjects: true });
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    item: ICollection;
    index: number;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareIndex = params.get('share') ?? params.get('index');
    if (shareIndex !== null) {
      const index = parseInt(shareIndex, 10);
      const item = imageContents[index];
      if (item) {
        setSelectedItem({ item, index });
        setIsModalOpen(true);
        navigate(`/${pageType}Collection`);
      }
    }
  }, [imageContents]);

  const imageUrl = t(`${pageType}Collection.imageUrl`) == `${pageType}Collection.imageUrl` ?
    imageContents[Math.floor(Math.random() * imageContents.length)].imageUrl : t(`${pageType}Collection.imageUrl`);

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
        headerTextArray={[t(`${pageType}Collection.title`)]}
      />
      <CardsSection title={t(`${pageType}Collection.title`)} darkMode={true}
                    imageContentSections={bindEventImageContents} />
      {selectedItem && (
        <CollectionModal
          isOpen={isModalOpen}
          index={selectedItem.index}
          item={selectedItem.item}
          onClose={handleModalClose}
          pageType={pageType}
        />
      )}
    </>
  );
};

export default CollectionPageBase;
