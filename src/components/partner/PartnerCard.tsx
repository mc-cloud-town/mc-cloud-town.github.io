import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Col, Modal } from 'antd';
import { Card } from 'antd';
import styled, { css } from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import PartnerLink from '#/partner/PartnerLink.tsx';

import { IPartnership } from '@/types/IPartnership.ts';
import { STATIC_DATA_API } from '@/constants';
import { fadeIn } from '@/styles/animation.ts';
import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';

const StyledCard = styled(Card)<{ $fadeIn: boolean }>`
  margin: 16px;
  background-color: #f1f1f1;
  text-align: center;
  opacity: 0;

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const StyleCardMeta = styled(Card.Meta)`
  text-align: center;
`;

const ImageWrapper = styled.div`
  width: 100%;
  height: 224px;
  padding: 24px;

  & > span > img {
    border-radius: 50% !important;
    max-width: 176px;
    object-fit: cover;
  }
`;

const ModalTitle = styled.span`
  text-align: center;
  font-size: x-large;
`;

const TextDiv = styled.div`
  margin-bottom: 20px;
`;

const StyleIntroduce = styled.div`
  font-size: medium;
`;

const StyleModal = styled(Modal)`
  text-align: center;
`;

const StyleIframe = styled.iframe`
  border: none;
  width: 700px;
  height: 390px;
  background: black;

  @media only screen and (max-width: 620px) {
    width: 100%;
    max-width: 560px;
    height: 300px;
  }

  @media only screen and (max-width: 345px) {
    width: 100%;
    max-width: 300px;
    height: 170px;
  }
`;

const StyleVideo = styled.div`
  display: flex;
  justify-content: center;
`;

const PartnerCard = (partnerData: IPartnership) => {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const { animate, ref } = useAnimateOnScroll();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Col xs={24} sm={20} md={16} lg={12} xl={8}>
        <StyledCard
          ref={ref}
          $fadeIn={animate}
          hoverable
          onClick={showModal}
          cover={
            <ImageWrapper>
              <LazyLoadImage
                src={`${STATIC_DATA_API}/images/${partnerData.Image}`}
                alt={partnerData.Partner}
                effect='blur'
              />
            </ImageWrapper>
          }
        >
          <StyleCardMeta title={<h1>{partnerData.Partner}</h1>} />
        </StyledCard>
      </Col>
      <StyleModal
        width={720}
        centered={true}
        destroyOnClose={true}
        title={
          <ModalTitle>
            {partnerData.ModalTitle}
            {partnerData.LongPartnership &&
              ` 【${t('partner.longtime.title')}】`}
          </ModalTitle>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={<PartnerLink partnerLink={partnerData.Link} />}
      >
        <TextDiv>
          {partnerData.Introduce && (
            <StyleIntroduce>
              {Array.isArray(partnerData.Introduce)
                ? partnerData.Introduce.map((introduce, index) => (
                    <p style={{ margin: '0 0 5px' }} key={index}>
                      {introduce}
                    </p>
                  ))
                : partnerData.Introduce}
            </StyleIntroduce>
          )}
        </TextDiv>
        {partnerData.ShowVideo && (
          <StyleVideo>
            <StyleIframe
              id={'video'}
              src={partnerData.ShowVideo + '&autoplay=0&enablejsapi=1'}
              title='YouTube video player'
              allowFullScreen
            />
          </StyleVideo>
        )}
      </StyleModal>
    </>
  );
};

export default PartnerCard;
