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
  padding: 50px 40px;
  color: #fff;
  background-color: ${(props) => props.$token.colorPrimary};

  @media (max-width: 400px) {
    padding: 50px 10px;
  }
`;

const SelectWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
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
          type={'primary'}
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
