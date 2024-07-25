import React, { useRef, useState } from 'react';
import { Button, Carousel, Image, Modal, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { CarouselRef } from 'antd/lib/carousel';
import { DownloadOutlined, PlayCircleOutlined } from '@ant-design/icons';

import { ICollection } from '@/types/ICollection.ts';
import ShareModal from '#/common/ShareModal.tsx';
import stopVideo from '@/utils/stopVideo.ts';
import { STATIC_DATA_API } from '@/constants';

const StyledTitle = styled.h2`
  font-size: 24px;
  font-weight: bolder;
`;

const StyledSubTitle = styled.h3`
  font-size: 20px;
  font-weight: bold;
`;

const StyledCarousel = styled(Carousel)`
  .slick-slide {
    text-align: center;
  }
`;

const ImageWrapper = styled.div`
  height: 400px;
  text-align: center;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 300px;
  }

  @media (max-width: 480px) {
    height: 175px;
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

const Thumbnail = styled.img<{ $isSelected: boolean }>`
  width: 80px;
  height: 60px;
  cursor: pointer;
  box-shadow: none;
  object-fit: cover;

  ${({ $isSelected }) =>
    $isSelected &&
    `
    box-shadow: 0 0 5px 2px #6f9b9c;
  `}
  &:hover {
    box-shadow: 0 0 5px 2px #6f9b9c;
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
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const VideoWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const VideoIframe = styled.iframe`
  width: 100%;
  height: 400px;
  border: 0;
  background-color: black;

  @media (max-width: 768px) {
    height: 300px;
  }

  @media (max-width: 480px) {
    height: 175px;
  }
`;

const PlayIconOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  cursor: pointer;

  &:hover {
    color: #6f9b9c;
    transition: color 0.3s ease;
  }
`;

const ThumbnailWithOverlay = styled.div`
  position: relative;
  width: 80px;
  height: 60px;
`;

const PreviewImage = styled(Image)`
  object-fit: cover;
  width: 100%;
  height: 400px !important;

  @media (max-width: 768px) {
    height: 300px !important;
  }

  @media (max-width: 480px) {
    height: 175px !important;
  }
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
  item: ICollection;
  index: number;
  onClose: () => void;
  pageType: 'architecture' | 'redstone';
  handleTagChange: (tags: string[]) => void;
}

const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  item,
  index,
  onClose,
  pageType,
  handleTagChange,
}) => {
  const { t } = useTranslation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const carouselRef = useRef<CarouselRef>(null);

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
    carouselRef.current?.goTo(index, false);
  };

  const closeModal = () => {
    stopVideo();
    onClose();
  };

  const onTagClick = (tag: string) => {
    handleTagChange([tag]);
    closeModal();
  };

  const carouselItems = [
    ...(item.videosUrl ?? []).map((video, index) => (
      <VideoWrapper key={`video-wrapper-${index}`}>
        <VideoIframe
          id='video'
          key={`video-${index}`}
          src={video.url}
          allowFullScreen
        />
      </VideoWrapper>
    )),
    ...(item.galleryImagesUrl ?? []).map((url, index) => (
      <div key={`image-${index}`}>
        <ImageWrapper>
          <PreviewImage
            src={`${STATIC_DATA_API}/images/${url}`}
            alt={`Gallery image ${index}`}
          />
        </ImageWrapper>
      </div>
    )),
  ];

  const thumbnails = [
    ...(item.videosUrl ?? []).map((video, index) => (
      <ThumbnailWithOverlay key={`video-thumb-${index}`}>
        <Thumbnail
          src={`${STATIC_DATA_API}/images/${video.thumbnailUrl}`}
          alt={`Video thumbnail ${index}`}
          onClick={() => handleThumbnailClick(index)}
          $isSelected={selectedImageIndex === index}
        />
        <PlayIconOverlay onClick={() => handleThumbnailClick(index)}>
          <PlayCircleOutlined />
        </PlayIconOverlay>
      </ThumbnailWithOverlay>
    )),
    ...(item.galleryImagesUrl ?? []).map((url, index) => (
      <Thumbnail
        key={`image-thumb-${index}`}
        src={`${STATIC_DATA_API}/images/${url}`}
        alt={`Image thumbnail ${index + (item.videosUrl?.length ?? 0)}`}
        onClick={() =>
          handleThumbnailClick(index + (item.videosUrl?.length ?? 0))
        }
        $isSelected={
          selectedImageIndex === index + (item.videosUrl?.length ?? 0)
        }
      />
    )),
  ];

  const ModalFooter = (
    <>
      {item.downloadUrl && (
        <Button
          icon={<DownloadOutlined />}
          href={item.downloadUrl}
          target='_blank'
        >
          {t('download')}
        </Button>
      )}
      <ShareModal
        url={`${window.location.host}${import.meta.env.BASE_URL}${pageType}Collection?share=${index}`}
        title={item.title}
      />
    </>
  );

  return (
    <Modal
      title={
        <StyledTitle>
          {item.title} - {item.date}
        </StyledTitle>
      }
      open={isOpen}
      onOk={onClose}
      onCancel={closeModal}
      width={800}
      footer={ModalFooter}
    >
      <Image.PreviewGroup>
        <StyledCarousel
          ref={carouselRef}
          afterChange={setSelectedImageIndex}
          infinite={false}
        >
          {carouselItems}
        </StyledCarousel>
      </Image.PreviewGroup>

      <ThumbnailWrapper>{thumbnails}</ThumbnailWrapper>

      <TagContainer>
        {item.tags?.map((tag, index) => (
          <StyledTag
            key={index}
            color={getTagColor(tag)}
            onClick={() => onTagClick(tag)}
          >
            {tag}
          </StyledTag>
        ))}
      </TagContainer>
      <StyledSubTitle>{t('creator')}</StyledSubTitle>
      <ul>
        {item.creator.map((creator, index) => (
          <li key={index}>{creator}</li>
        ))}
      </ul>
      {item.introductions && (
        <StyledSubTitle>{t('introduction')}</StyledSubTitle>
      )}
      <div>
        {item.introductions?.map((intro, index) => <p key={index}>{intro}</p>)}
      </div>
      {item.credits && <StyledSubTitle>{t('credit')}</StyledSubTitle>}
      <ul>
        {item.credits?.map((credit, index) => (
          <li key={index}>
            {credit.url ? (
              <a href={credit.url} target='_blank' rel='noreferrer'>
                {credit.name}
              </a>
            ) : (
              credit.name
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default CollectionModal;
