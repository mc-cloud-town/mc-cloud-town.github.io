import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectProps } from 'antd';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import CardsSection from '#/common/CardsSection.tsx';
import CollectionModal from '#/collection/CollectionModal.tsx';

import { ICollection } from '@/types/ICollection.ts';
import getImageUrl from '@/utils/getImageUrl.ts';

const Container = styled.div`
  padding: 50px 40px;
  background-color: #6f9b9c;

  @media (max-width: 400px) {
    padding: 50px 10px;
  }
`;

const SelectWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledSelect = styled(Select)<SelectProps>`
  max-width: 400px;
  width: 100%;
`;

const CollectionPageBase = ({
  pageType,
}: {
  pageType: 'architecture' | 'redstone';
}) => {
  const { t } = useTranslation();
  const imageContents: ICollection[] = useMemo(
    () => t(`${pageType}Collection.collections`, { returnObjects: true }),
    [t, pageType],
  );
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    item: ICollection;
    index: number;
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredContents, setFilteredContents] =
    useState<ICollection[]>(imageContents);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareIndex = params.get('share') ?? params.get('index');
    const tags = params.get('tag');

    if (shareIndex !== null) {
      const index = parseInt(shareIndex, 10);
      const item = imageContents[index];
      if (item) {
        setSelectedItem({ item, index });
        setIsModalOpen(true);
        navigate(`/${pageType}Collection`);
      }

      if (tags !== null && tags !== '') {
        setSelectedTags(tags.split(','));
      }
    }
  }, [imageContents, navigate, pageType]);

  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredContents(imageContents);
    } else {
      const filtered = imageContents.filter((item) =>
        selectedTags.every(
          (tag) => item.tags?.includes(tag) || item.title.includes(tag),
        ),
      );
      setFilteredContents(filtered);
    }
  }, [selectedTags, imageContents]);

  const imageUrl =
    t(`${pageType}Collection.imageUrl`) === `${pageType}Collection.imageUrl`
      ? imageContents[Math.floor(Math.random() * imageContents.length)].imageUrl
      : t(`${pageType}Collection.imageUrl`);

  const handleCardClick = (item: ICollection, index: number) => {
    setSelectedItem({ item, index });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleTagChange = (value: string[]) => {
    setSelectedTags(value);
    navigate({
      pathname: `/${pageType}Collection`,
      search: `?tag=${value.join(',')}`,
    });
  };

  const allTags = useMemo(() => {
    return Array.from(
      new Set(imageContents.flatMap((item) => item.tags || [])),
    );
  }, [imageContents]);

  const tagOptions = allTags.map((tag) => ({ value: tag, label: tag }));

  const bindEventImageContents: ICollection[] = filteredContents.map(
    (item, index) => ({
      ...item,
      clickEvent: () => handleCardClick(item, index),
    }),
  );

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={getImageUrl(imageUrl)} />}
        maskColor={'#6f9b9c'}
        headerTextArray={[t(`${pageType}Collection.title`)]}
      />
      <Container>
        <SelectWrapper>
          <StyledSelect
            size={'large'}
            mode='tags'
            placeholder={t(`${pageType}Collection.searchPlaceholder`)}
            value={selectedTags}
            onChange={handleTagChange}
            options={tagOptions}
          />
        </SelectWrapper>
        <CardsSection
          title={t(`${pageType}Collection.title`)}
          darkMode={true}
          imageContentSections={bindEventImageContents}
        />
        {selectedItem && (
          <CollectionModal
            isOpen={isModalOpen}
            index={selectedItem.index}
            item={selectedItem.item}
            onClose={handleModalClose}
            pageType={pageType}
            handleTagChange={handleTagChange}
          />
        )}
      </Container>
    </>
  );
};

export default CollectionPageBase;
