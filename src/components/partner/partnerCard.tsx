import { Col, Modal } from 'antd';
import { Card } from 'antd';
import styled from 'styled-components';
import { IPartnership } from '@/types/IPartnership.ts';
import { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import getImageUrl from '@/utils/getImageUrl.ts';
import FooterCard from '#/partner/footer.tsx';

const StyledCard = styled(Card)`
  margin: 16px;
  background-color: #f1f1f1;
  text-align: center;
`;

const StyleCardMeta = styled(Card.Meta)`
  text-align: center;

  img {
    border-radius: 50%;
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  padding: 10px;

  & > span > img {
    width: 100%;
  }
`;

const ModalTitle = styled.h1`
  text-align: center;
`;

const StyleModal = styled(Modal)`
  text-align: center;
`;

const StyleIframe = styled.iframe`
  border: none;
`;

const StyleVideo = styled.div`
  display: flex;
  justify-content: center;
`;
const PartnerCard = (partnerData: IPartnership) => {
  const [isModalOpen, setIsModalOpen] = useState([false, false]);

  const toggleModal = (idx: number, target: boolean) => {
    setIsModalOpen((p) => {
      p[idx] = target;
      return [...p];
    });
  };

  return (
    <Col key={partnerData.Partner} xs={48} sm={24} md={16} lg={12} xl={8}>
      <StyledCard
        hoverable
        onClick={() => toggleModal(0, true)}
        cover={
          <ImageWrapper>
            <LazyLoadImage
              style={{ borderRadius: '50%' }}
              src={getImageUrl(partnerData.Image)}
              alt={partnerData.ImageTitle}
              effect="blur"
            />
          </ImageWrapper>
        }
      >
        <StyleCardMeta title={partnerData.Partner} />
      </StyledCard>
      <StyleModal
        width={1040}
        centered={true}
        title={<ModalTitle>{partnerData.ModalTitle}</ModalTitle>}
        open={isModalOpen[0]}
        onOk={() => toggleModal(0, false)}
        onCancel={() => toggleModal(0, false)}
        footer={<FooterCard partnerLink={partnerData.Link} />}
      >
        {Array.isArray(partnerData.Introduce)
          ? partnerData.Introduce.map((introduce) => <p>{introduce}</p>)
          : partnerData.Introduce}
        {partnerData.ShowVideo && (
          <StyleVideo>
            <StyleIframe
              width="560"
              height="315"
              src={partnerData.ShowVideo}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </StyleVideo>
        )}
      </StyleModal>
    </Col>
  );
};

export default PartnerCard;
