import styled, { css } from 'styled-components';
import {
  MailOutlined,
  YoutubeOutlined,
  DiscordOutlined,
} from '@ant-design/icons';
import { Button, Flex } from 'antd';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import getImageUrl from '@/utils/getImageUrl.ts';
import { IImageContent } from '@/types/IImageContent.ts';
import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { fadeIn } from '@/styles/animation.ts';

const ContactSection = styled.div`
  text-align: center;
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 60px 40px;
  border-radius: var(--radius-xl);
  margin: 40px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);

  @media (max-width: 600px) {
    margin: 20px;
    padding: 40px 20px;
    border-radius: var(--radius-lg);
  }
`;

const ContactTitle = styled.h1<{ $fadeIn: boolean }>`
  font-weight: bolder;
  opacity: 0;
  margin-bottom: 20px;
  color: var(--color-primary);
  font-size: clamp(1.5rem, 3vw, 2rem);

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const ContactInfo = styled.h3<{ $fadeIn: boolean }>`
  margin-bottom: 24px;
  opacity: 0;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--text-secondary);
  font-weight: 500;

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const StyledButton = styled(Button)<{ $fadeIn: boolean }>`
  margin: 0 10px;
  opacity: 0;

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const ImageContainer = styled.div<{ $fadeIn: boolean }>`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  opacity: 0;

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const BrandImageWrapper = styled.div`
  width: 100%;
  max-width: 250px;

  & > span > img {
    width: 100%;
    transition: filter var(--transition-base);
  }

  /* Invert for dark mode visibility */
  [data-theme='dark'] & > span > img {
    filter: brightness(0) invert(0.9);
  }
`;

const Contact = ({ contactInfo }: { contactInfo: IImageContent }) => {
  const { animate, ref } = useAnimateOnScroll();

  return (
    <ContactSection ref={ref}>
      <ContactTitle $fadeIn={animate}>{contactInfo.title}</ContactTitle>
      <ImageContainer $fadeIn={animate}>
        <BrandImageWrapper>
          <LazyLoadImage
            src={getImageUrl(contactInfo.imageUrl)}
            alt='Brand Icon'
            effect='blur'
          />
        </BrandImageWrapper>
      </ImageContainer>
      <ContactInfo $fadeIn={animate}>{contactInfo.subTitle}</ContactInfo>
      <Flex justify='center' wrap='wrap' gap={10}>
        {contactInfo.buttons?.map((button, index) => {
          return (
            <StyledButton
              $fadeIn={animate}
              key={index}
              type='primary'
              size='large'
              href={button.link}
              target={button.link?.startsWith('mailto') ? '' : '_blank'}
            >
              {button.link?.startsWith('mailto') && <MailOutlined />}
              {button.link?.startsWith('https://www.youtube.com') && (
                <YoutubeOutlined />
              )}
              {button.link?.startsWith('https://discordapp.com/') && (
                <DiscordOutlined />
              )}
              {button.text}
            </StyledButton>
          );
        })}
      </Flex>
    </ContactSection>
  );
};

export default Contact;
