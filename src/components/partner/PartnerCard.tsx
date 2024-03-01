import { useState } from 'react';
import { Col, Modal } from 'antd';
import { Card } from 'antd';
import styled from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import PartnerLink from '#/partner/PartnerLink.tsx';

import getImageUrl from '@/utils/getImageUrl.ts';
import { IPartnership } from '@/types/IPartnership.ts';

const StyledCard = styled(Card)`
  margin: 16px;
  background-color: #f1f1f1;
  text-align: center;
`;

const StyleCardMeta = styled(Card.Meta)`
  text-align: center;
`;

const ImageWrapper = styled.div`
  width: 100%;
  padding: 24px;
`;

const ModalTitle = styled.h1`
  text-align: center;
`;

const TextDiv = styled.div`
  padding: 5%;
`;

const StyleIntroduce = styled.div`
  font-size: medium;
`;

const LongPartnership = styled.h2`
  text-align: center;
`;

const StyleModal = styled(Modal)`
  text-align: center;
  padding: 20px;
`;

const StyleIframe = styled.iframe`
  border: none;
`;

const StyleVideo = styled.div`
  display: flex;
  justify-content: center;
`;

const PartnerCard = (partnerData: IPartnership) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const stopYoutubeVideo = () => {
    const video: HTMLIFrameElement = document.getElementById(
      'video',
    ) as HTMLIFrameElement;
    video &&
      video.contentWindow?.postMessage(
        '{"event":"command", "func":"pauseVideo", "args":""}',
        '*',
      );
  };

  return (
    <Col xs={24} sm={20} md={16} lg={12} xl={8}>
      <StyledCard
        hoverable
        onClick={showModal}
        cover={
          <ImageWrapper>
            <LazyLoadImage
              style={{ borderRadius: '50%', width: '176px', height: '176px' }}
              src={getImageUrl(partnerData.Image)}
              alt={partnerData.Partner}
              effect="blur"
            />
          </ImageWrapper>
        }
      >
        <StyleCardMeta title={<h1>{partnerData.Partner}</h1>} />
      </StyledCard>
      <StyleModal
        width={720}
        centered={true}
        title={<ModalTitle>{partnerData.ModalTitle}</ModalTitle>}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={<PartnerLink partnerLink={partnerData.Link} />}
        afterClose={() => stopYoutubeVideo()}
      >
        {partnerData.LongPartnership && (
          <LongPartnership>長期合作夥伴</LongPartnership>
        )}
        <TextDiv>
          {partnerData.Introduce && (
            <StyleIntroduce>
              {Array.isArray(partnerData.Introduce)
                ? partnerData.Introduce.map((introduce, index) => <p key={index}>{introduce}</p>)
                : partnerData.Introduce}
            </StyleIntroduce>
          )}
        </TextDiv>
        {partnerData.ShowVideo && (
          <StyleVideo>
            <StyleIframe
              id={'video'}
              width="560"
              height="315"
              src={partnerData.ShowVideo + '&autoplay=0&enablejsapi=1'}
              title="YouTube video player"
              allowFullScreen
            />
          </StyleVideo>
        )}
      </StyleModal>
    </Col>
  );
};

export default PartnerCard;
