import styled, { css } from 'styled-components';
import { MailOutlined, YoutubeOutlined, DiscordOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import getImageUrl from '@/utils/getImageUrl.ts';
import { IImageContent } from '@/types/IImageContent.ts';
import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { fadeIn } from '@/styles/animation.tsx';

const ContactSection = styled.div`
  text-align: center;
  padding: 50px 60px;
  background-color: #6f9b9c;
  color: white;

  @media (max-width: 400px) {
    padding: 50px 10px;
  }
`;

const ContactTitle = styled.h1<{ $fadeIn: boolean }>`
  font-weight: bolder;
  opacity: 0;
  
  ${(props) =>
    props.$fadeIn && css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const ContactInfo = styled.h3<{ $fadeIn: boolean }>`
  margin-bottom: 20px;
  opacity: 0;
  
  ${(props) =>
    props.$fadeIn && css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const StyledButton = styled(Button)<{ $fadeIn: boolean }>`
  margin: 0 10px;
  opacity: 0;

  ${(props) =>
    props.$fadeIn && css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const ImageContainer = styled.div<{ $fadeIn: boolean }>`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  opacity: 0;

  ${(props) =>
    props.$fadeIn && css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const BrandImageWrapper = styled.div`
  width: 100%;
  max-width: 250px;

  & > span > img {
    width: 100%;
  }
`;

const Contact = (
  {
    contactInfo
  }: {
    contactInfo: IImageContent;
  }) => {
  const { animate, ref } = useAnimateOnScroll();

  return (
    <ContactSection ref={ref}>
      <ContactTitle $fadeIn={animate}>{contactInfo.title}</ContactTitle>
      <ImageContainer $fadeIn={animate}>
        <BrandImageWrapper>
          <LazyLoadImage
            src={getImageUrl(contactInfo.imageUrl)}
            alt="Brand Icon"
            effect="blur"
          />
        </BrandImageWrapper>
      </ImageContainer>
      <ContactInfo $fadeIn={animate}>{contactInfo.subTitle}</ContactInfo>
      <Flex justify="center" wrap="wrap" gap={10}>
        {
          contactInfo.buttons?.map((button, index) => {
            return (
              <StyledButton
                $fadeIn={animate}
                key={index}
                type="default"
                size="large"
                href={button.link}
                target={button.link?.startsWith('mailto') ? '' : '_blank'}
                ghost={true}
              >
                {
                  button.link?.startsWith('mailto') && <MailOutlined />
                }
                {
                  button.link?.startsWith('https://www.youtube.com') && <YoutubeOutlined />
                }
                {
                  button.link?.startsWith('https://discordapp.com/') && <DiscordOutlined />
                }
                {button.text}
              </StyledButton>
            );
          })
        }
      </Flex>
    </ContactSection>
  );
};

export default Contact;
