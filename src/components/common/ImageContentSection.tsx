import React from 'react';
import { Button, Flex } from 'antd';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { IImageContent } from '@/types/IImageContent.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { fadeIn } from '@/styles/animation.ts';

const SectionContainer = styled.div<{
  $dark: boolean;
  $right: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 80px 60px;
  position: relative;
  overflow: hidden;

  /* Enhanced light mode with layered gradient and subtle texture */
  background: radial-gradient(
      ellipse at 20% 80%,
      rgba(111, 155, 156, 0.08) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 80% 20%,
      rgba(150, 219, 230, 0.1) 0%,
      transparent 50%
    ),
    linear-gradient(180deg, #f5f7f8 0%, #e8eef0 35%, #dfe6e8 65%, #ecf0f1 100%);

  /* Subtle top/bottom borders for depth */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05);

  /* Decorative geometric accent */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 300px;
    background: radial-gradient(
      circle,
      rgba(111, 155, 156, 0.06) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  ${(props) =>
    props.$dark &&
    `
    /* Enhanced dark mode with rich layered gradients */
    background: 
      radial-gradient(ellipse at 30% 100%, rgba(74, 139, 141, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 0%, rgba(150, 219, 230, 0.2) 0%, transparent 50%),
      linear-gradient(135deg, #5a8586 0%, #6f9b9c 25%, #5d8889 50%, #6f9b9c 75%, #5a8586 100%);
    color: #fff;
    
    /* Glassmorphism inner glow */
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
    
    /* Ensure links are visible in dark mode */
    a {
      color: #b1dde6 !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    a:hover {
      color: #fff !important;
    }
    
    &::before {
      background: radial-gradient(circle, rgba(150, 219, 230, 0.15) 0%, transparent 70%);
    }
  `};

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 60px 20px;
  }

  @media (max-width: 678px) {
    padding: 50px 30px;
  }

  @media (max-width: 400px) {
    padding: 50px 20px;
  }

  ${(props) =>
    props.$right &&
    `
    flex-direction: row-reverse;
  `};
`;

const Container = styled.div<{ $fadeIn: boolean }>`
  flex: 1;
  padding: 20px;
  transition: opacity 0.8s ease-out;
  opacity: 0;

  @media (max-width: 678px) {
    padding: 0;
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const ImageWrapper = styled.div`
  width: 100%;
  min-width: 320px;
  padding-top: 56.25%;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 0 10px 0 #000000;
  background-color: white;

  & > span {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    & > img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
`;

const TextButtonContainer = styled.div`
  max-width: 600px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-weight: bolder;
`;

const SubTitle = styled.h3`
  margin-bottom: 20px;
  font-weight: bold;
`;

const Paragraph = styled.p`
  margin-bottom: 20px;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 20px;
`;

const FeatureItem = styled.li<{ $darkMode: boolean }>`
  position: relative;
  margin-bottom: 10px;
  padding-left: 20px;
  text-align: left;

  &:before {
    content: '•';
    position: absolute;
    left: 0;
    color: #6f9b9c;

    ${(props) =>
      props.$darkMode &&
      `
      color: #fff;
    `};
  }
`;

const StyledButton = styled(Button)<{ $darkMode: boolean }>`
  & > span {
    font-size: 18px;
    font-weight: bold;
    text-decoration: underline;
  }

  ${(props) =>
    props.$darkMode &&
    `
    color: #fff;
  `};
`;

interface ImageContentSectionProps {
  imageContent: IImageContent;
  imageOnRight?: boolean;
  darkMode?: boolean;
}

/**
 * ImageContentSection component
 * @param imageContent - Image content data
 * @param imageOnRight - Image position
 * @param darkMode - Dark mode
 * @constructor ImageContentSection - React Function Component
 */
const ImageContentSection: React.FC<ImageContentSectionProps> = ({
  imageContent,
  imageOnRight = false,
  darkMode = false,
}: ImageContentSectionProps) => {
  const { animate, ref } = useAnimateOnScroll();

  return (
    <SectionContainer ref={ref} $dark={darkMode} $right={imageOnRight}>
      <Container $fadeIn={animate}>
        <ImageWrapper>
          <LazyLoadImage
            src={getImageUrl(imageContent.imageUrl)}
            alt={imageContent.title}
            effect='blur'
          />
        </ImageWrapper>
      </Container>
      <Container $fadeIn={animate}>
        <TextButtonContainer>
          <Title>{imageContent.title}</Title>
          {imageContent.subTitle && (
            <SubTitle>{imageContent.subTitle}</SubTitle>
          )}
          {imageContent.paragraph && (
            <Paragraph>{imageContent.paragraph}</Paragraph>
          )}
          <FeatureList>
            {imageContent.features &&
              imageContent.features.map((feature, index) => (
                <FeatureItem key={index} $darkMode={darkMode}>
                  {feature}
                </FeatureItem>
              ))}
          </FeatureList>
          <Flex wrap='wrap' gap='small'>
            {imageContent.buttons &&
              imageContent.buttons.map((button, index) =>
                button.link ? (
                  <Link key={index} to={button.link}>
                    <Button
                      type={button.type || (darkMode ? 'default' : 'primary')}
                      ghost={darkMode}
                    >
                      {button.text}
                    </Button>
                  </Link>
                ) : (
                  <StyledButton
                    key={index}
                    type={button.type || (darkMode ? 'default' : 'primary')}
                    ghost={
                      button.type !== 'link' &&
                      button.type !== 'text' &&
                      darkMode
                    }
                    href={button.href}
                    target={button.href ? '_blank' : ''}
                    onClick={button.action}
                    $darkMode={darkMode}
                  >
                    {button.text}
                  </StyledButton>
                ),
              )}
          </Flex>
        </TextButtonContainer>
      </Container>
    </SectionContainer>
  );
};

export default ImageContentSection;
