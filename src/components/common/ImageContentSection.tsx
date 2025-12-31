import React from 'react';
import { Button, Flex } from 'antd';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { IImageContent } from '@/types/IImageContent.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { fadeIn } from '@/styles/animation.ts';

const SectionContainer = styled.section<{
  $dark: boolean;
  $right: boolean;
}>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 100px 60px;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);

  /* Decorative gradient accent */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--border-color),
      transparent
    );
  }

  ${(props) =>
    props.$dark &&
    css`
      background: var(--bg-secondary);
    `};

  @media (max-width: 900px) {
    flex-direction: column;
    padding: 80px 40px;
  }

  @media (max-width: 600px) {
    padding: 60px 24px;
  }

  ${(props) =>
    props.$right &&
    css`
      flex-direction: row-reverse;

      @media (max-width: 900px) {
        flex-direction: column;
      }
    `};
`;

const Container = styled.div<{ $fadeIn: boolean }>`
  flex: 1;
  padding: 20px;
  max-width: 600px;
  opacity: 0;

  @media (max-width: 900px) {
    padding: 0;
    margin-bottom: 32px;
    max-width: 100%;

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
  padding-top: 56.25%;
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  box-shadow: var(--shadow-lg);
  transition:
    transform var(--transition-slow),
    box-shadow var(--transition-slow);

  &:hover {
    transform: scale(1.02);
    box-shadow: var(--shadow-xl);
  }

  /* LazyLoadImage wrapper span */
  & > span {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
  }

  img {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
    transition: transform var(--transition-slow);
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const TextButtonContainer = styled.div`
  max-width: 550px;
`;

const Title = styled.h2`
  margin-bottom: var(--spacing-md);
  font-weight: 700;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  color: var(--text-primary);
  line-height: 1.2;
`;

const SubTitle = styled.h3`
  margin-bottom: var(--spacing-md);
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-secondary);
`;

const Paragraph = styled.p`
  margin-bottom: var(--spacing-lg);
  color: var(--text-secondary);
  line-height: 1.7;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: var(--spacing-xl);
`;

const FeatureItem = styled.li`
  position: relative;
  margin-bottom: var(--spacing-md);
  padding-left: 28px;
  text-align: left;
  color: var(--text-secondary);
  line-height: 1.6;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    width: 8px;
    height: 8px;
    background: var(--gradient-accent);
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    left: 3px;
    top: 18px;
    width: 2px;
    height: calc(100% + 4px);
    background: var(--border-color);
  }

  &:last-child::after {
    display: none;
  }
`;

const StyledButton = styled(Button)`
  border-radius: var(--radius-md) !important;
  font-weight: 600;
  height: 44px;
  padding: 0 24px;
  transition: all var(--transition-base);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--glow-primary);
  }
`;

interface ImageContentSectionProps {
  imageContent: IImageContent;
  imageOnRight?: boolean;
  darkMode?: boolean;
}

/**
 * Modern ImageContentSection component with glass effects and smooth animations.
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
                <FeatureItem key={index}>{feature}</FeatureItem>
              ))}
          </FeatureList>
          <Flex wrap='wrap' gap='small'>
            {imageContent.buttons &&
              imageContent.buttons.map((button, index) =>
                button.link ? (
                  <Link key={index} to={button.link}>
                    <StyledButton type={button.type || 'primary'}>
                      {button.text}
                    </StyledButton>
                  </Link>
                ) : (
                  <StyledButton
                    key={index}
                    type={button.type || 'primary'}
                    href={button.href}
                    target={
                      button.href?.startsWith('http') ||
                      button.href?.startsWith('//')
                        ? '_blank'
                        : undefined
                    }
                    onClick={button.action}
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
