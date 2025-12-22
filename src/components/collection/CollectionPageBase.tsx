import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalToken, Select, SelectProps, theme } from 'antd';
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

const Container = styled.div<{ $token: GlobalToken }>`
  position: relative;
  overflow: hidden;
  padding: 60px 40px;
  color: #fff;

  /* Rich layered gradient background */
  background: radial-gradient(
      ellipse at 15% 85%,
      rgba(74, 139, 141, 0.4) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 85% 15%,
      rgba(150, 219, 230, 0.25) 0%,
      transparent 50%
    ),
    linear-gradient(
      135deg,
      ${(props) => props.$token.colorPrimary} 0%,
      #5a9b9c 25%,
      #4a8b8d 50%,
      #5a9b9c 75%,
      ${(props) => props.$token.colorPrimary} 100%
    );

  /* Glassmorphism inner glow */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);

  /* Decorative geometric accent */
  &::before {
    content: '';
    position: absolute;
    top: -100px;
    left: -100px;
    width: 400px;
    height: 400px;
    background: radial-gradient(
      circle,
      rgba(150, 219, 230, 0.15) 0%,
      transparent 60%
    );
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -150px;
    right: -150px;
    width: 500px;
    height: 500px;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.08) 0%,
      transparent 60%
    );
    pointer-events: none;
  }

  @media (max-width: 400px) {
    padding: 50px 15px;
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

  /* Glassmorphism styling for the select */
  .ant-select-selector {
    background: rgba(255, 255, 255, 0.15) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 12px !important;
    padding: 8px 16px !important;
    height: auto !important;
    min-height: 48px !important;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease !important;
  }

  .ant-select-selector:hover {
    border-color: rgba(255, 255, 255, 0.5) !important;
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .ant-select-selection-placeholder {
    color: rgba(255, 255, 255, 0.7) !important;
  }

  .ant-select-selection-item {
    background: rgba(255, 255, 255, 0.2) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    border-radius: 6px !important;
    color: #fff !important;
  }

  .ant-select-selection-item-remove {
    color: rgba(255, 255, 255, 0.8) !important;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: rgba(255, 255, 255, 0.6) !important;
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.15),
      0 0 0 2px rgba(150, 219, 230, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
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
  const { token } = theme.useToken();

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
        maskColor={token.colorPrimary}
        headerTextArray={[t(`${pageType}Collection.title`)]}
      />
      <Container $token={token}>
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
          type={'transparent'}
          imageContentSections={bindEventImageContents}
          useStaticDataApi={true}
        />
        <StatusShowingGroup error={error} loading={loading} />
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
