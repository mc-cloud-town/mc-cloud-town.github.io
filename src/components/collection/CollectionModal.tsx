import React, { useRef } from 'react';
import { Button, Carousel, Image, Modal, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { CarouselRef } from 'antd/lib/carousel';
import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';

import { ICollection } from '@/types/ICollection.ts';
import getImageUrl from '@/utils/getImageUrl.ts';

const StyledTitle = styled.h2`
  font-size: 24px;
  font-weight: bolder;
`;

const StyledSubTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
`;

const StyledCarousel = styled(Carousel)`
  .slick-slide img {
    margin: auto;
  }
`;

const ThumbnailWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Thumbnail = styled.img`
  width: 80px;
  height: 60px;
  cursor: pointer;
  border: 2px solid transparent;

  &:hover {
    border-color: #6f9b9c;
  }
`;

const TagContainer = styled.div`
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StyledTag = styled(Tag)`
  margin-bottom: 8px;
`;

const StyledImage = styled(Image)`
  width: 100%;
`;

const getTagColor = (tag: string): string => {
  switch (tag) {
    case '紅石':
      return '#f50';
    case '設施':
      return '#2db7f5';
    case '自動化':
      return '#87d068';
    case '出生點':
      return '#108ee9';
    default:
      return '#ccc';
  }
};

interface CollectionModalProps {
  isOpen: boolean;
  item: ICollection | null;
  onClose: () => void;
}

const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, item, onClose }) => {
  const { t } = useTranslation();
  const carouselRef = useRef<CarouselRef>(null);

  if (!item) return null;

  const handleThumbnailClick = (index: number) => {
    carouselRef.current?.goTo(index);
  };

  const ModalFooter = (
    <>
      <Button icon={<DownloadOutlined />} href={item.downloadUrl} target="_blank">
        {t('download')}
      </Button>
      <Button icon={<ShareAltOutlined />} onClick={() => console.log('Share')}>
        {t('share')}
      </Button>
    </>
  );

  return (
    <Modal
      title={<StyledTitle>{item.title}</StyledTitle>}
      open={isOpen}
      onOk={onClose}
      onCancel={onClose}
      width={800}
      footer={ModalFooter}
    >
      <StyledCarousel ref={carouselRef}>
        {item.galleryImagesUrl?.map((url, index) => (
          <div key={index}>
            <StyledImage src={getImageUrl(url)} alt={`Gallery image ${index + 1}`} />
          </div>
        ))}
      </StyledCarousel>

      <ThumbnailWrapper>
        {item.galleryImagesUrl?.map((url, index) => (
          <Thumbnail
            key={index}
            src={getImageUrl(url)}
            alt={`Thumbnail ${index + 1}`}
            onClick={() => handleThumbnailClick(index)}
          />
        ))}
      </ThumbnailWrapper>
      <TagContainer>
        {item.tags?.map((tag, index) => (
          <StyledTag key={index} color={getTagColor(tag)}>{tag}</StyledTag>
        ))}
      </TagContainer>
      <StyledSubTitle>{item.subTitle}</StyledSubTitle>
      <ul>
        {item.creator.map((creator, index) => (
          <li key={index}>{creator}</li>
        ))}
      </ul>
      <div>
        {item.introductions.map((intro, index) => (
          <p key={index}>{intro}</p>
        ))}
      </div>
    </Modal>
  );
};

export default CollectionModal;
