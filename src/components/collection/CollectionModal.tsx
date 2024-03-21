import React, { useState } from 'react';
import { Button, Image, Modal, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
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

const ImageWrapper = styled.div`
  padding: 24px 0;
  text-align: center;
`;

const StyledImage = styled(Image)`
  max-width: 100%;
`;

const ThumbnailWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 16px 0;
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
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  if (!item) return null;

  const displayImageUrl = selectedImageUrl || (item.galleryImagesUrl?.[0] || '');

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
      <h3>{item.date}</h3>
      <ImageWrapper>
        <StyledImage src={getImageUrl(displayImageUrl)} alt="Gallery main image" />
      </ImageWrapper>
      <ThumbnailWrapper>
        {item.galleryImagesUrl?.map((url, index) => (
          <Thumbnail key={index} src={getImageUrl(url)} alt={`Thumbnail ${index + 1}`}
                     onClick={() => setSelectedImageUrl(url)} />
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
