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
import { STATIC_DATA_API } from '@/constants';
import getImageUrl from '@/utils/getImageUrl.ts';
import useApi from '@/hooks/useApi.ts';
import { StatusShowingGroup } from '#/common/StatusShowingGroup.tsx';

const Container = styled.div`
  position: relative;
  overflow: hidden;
  padding: 60px 40px;
  background: var(--bg-secondary);
  color: var(--text-primary);

  @media (max-width: 400px) {
    padding: 50px 15px;
  }
`;

const InnerContainer = styled.div`
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  padding: 40px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 600px) {
    padding: 24px 16px;
    border-radius: var(--radius-lg);
  }
`;

const SelectWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
`;

const StyledSelect = styled(Select)<SelectProps>`
  max-width: 500px;
  width: 100%;

  /* Theme-aware styling for the select */
  .ant-select-selector {
    background: var(--bg-elevated) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: var(--radius-md) !important;
    padding: 8px 16px !important;
    height: auto !important;
    min-height: 48px !important;
    box-shadow: var(--shadow-sm) !important;
    transition: all var(--transition-base) !important;
  }

  .ant-select-selector:hover {
    border-color: var(--color-primary) !important;
    box-shadow: var(--shadow-md) !important;
  }

  .ant-select-selection-placeholder {
    color: var(--text-muted) !important;
  }

  .ant-select-selection-item {
    background: var(--color-primary-light) !important;
    border: 1px solid var(--color-primary) !important;
    border-radius: var(--radius-sm) !important;
    color: var(--color-primary) !important;
  }

  .ant-select-selection-item-remove {
    color: var(--color-primary) !important;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: var(--color-primary) !important;
    box-shadow:
      var(--shadow-md),
      0 0 0 2px var(--color-primary-light) !important;
  }
`;

const CollectionPageBase = ({
  pageType,
}: {
  pageType: 'architecture' | 'redstone';
}) => {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useApi<ICollection[]>(
    `${STATIC_DATA_API}/${i18n.language}/${pageType}Collection.json`,
  );

  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    item: ICollection;
    index: number;
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredContents, setFilteredContents] = useState<ICollection[]>(
    data ?? [],
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const shareIndex = params.get('share') ?? params.get('index');
    const tags = params.get('tag');

    if (shareIndex !== null) {
      const index = parseInt(shareIndex, 10);
      const item = data[index];
      if (item) {
        setSelectedItem({ item, index });
        setIsModalOpen(true);
        navigate(`/${pageType}Collection`);
      }

      if (tags !== null && tags !== '') {
        setSelectedTags(tags.split(','));
      }
    }
  }, [data, navigate, pageType]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (selectedTags.length === 0) {
      setFilteredContents(data);
    } else {
      const filtered = data.filter((item) =>
        selectedTags.every(
          (tag) => item.tags?.includes(tag) || item.title.includes(tag),
        ),
      );
      setFilteredContents(filtered);
    }
  }, [selectedTags, data]);

  const imageUrl =
    t(`${pageType}Collection.imageUrl`) === `${pageType}Collection.imageUrl` &&
    data
      ? data[Math.floor(Math.random() * data.length)].imageUrl
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
    if (!data) {
      return [];
    }

    return Array.from(new Set(data.flatMap((item) => item.tags || [])));
  }, [data]);

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
        headerTextArray={[t(`${pageType}Collection.title`)]}
      />
      <Container>
        <InnerContainer>
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
            type={'default'}
            imageContentSections={bindEventImageContents}
            useStaticDataApi={true}
          />
          <StatusShowingGroup error={error} loading={loading} />
        </InnerContainer>
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
