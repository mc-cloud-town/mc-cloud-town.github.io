import React from 'react';
import { Card, Button, Flex } from 'antd';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import { IImageContent } from '@/types/IImageContent.ts';
import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { fadeIn } from '@/styles/animation.ts';
import { STATIC_DATA_API } from '@/constants';

const Section = styled.section<{
  $type: 'default' | 'dark' | 'primary' | 'transparent';
}>`
  background: ${(props) =>
    props.$type === 'transparent'
      ? 'transparent'
      : props.$type === 'dark'
        ? 'var(--bg-secondary)'
        : props.$type === 'primary'
          ? 'var(--bg-tertiary)'
          : 'var(--bg-primary)'};

  /* Set text color for dark/primary/transparent modes */
  color: ${(props) =>
    props.$type === 'dark' ||
    props.$type === 'primary' ||
    props.$type === 'transparent'
      ? '#fff'
      : 'var(--text-primary)'};

  padding: ${(props) =>
    props.$type === 'transparent' ? '20px 0' : '50px 20px'};
  position: relative;
  z-index: 1;
`;

const CardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;

  @media (min-width: 768px) {
    align-items: stretch;
  }
`;

const StyledCard = styled(Card)<{
  $fadeIn: boolean;
}>`
  opacity: 0;
  flex: 1;
  min-width: 300px;
  text-align: left;
  cursor: default;
  max-width: 30%;

  @media (max-width: 1024px) {
    max-width: 45%;
  }

  @media (max-width: 768px) {
    max-width: 85%;
  }

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const SectionTitle = styled.h2<{ $fadeIn: boolean }>`
  opacity: 0;
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 40px;
  font-weight: bolder;

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const Title = styled.h3`
  margin-bottom: 20px;
  font-weight: bolder;
`;

const SubTitle = styled.h4`
  margin-bottom: 20px;
  font-weight: bold;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 20px;
`;

const FeatureItem = styled.li`
  position: relative;
  margin-bottom: 10px;
  padding-left: 20px;
  text-align: left;

  &:before {
    content: '•';
    position: absolute;
    left: 0;
    color: #6f9b9c;
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  padding-top: 56.25%;
  position: relative;
  overflow: hidden;

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

const StyledButton = styled(Button)`
  & > span {
    font-size: 18px;
    font-weight: bold;
    text-decoration: underline;
  }
`;

interface CardsSectionProps {
  title: string;
  type?: 'default' | 'dark' | 'primary' | 'transparent';
  imageContentSections: IImageContent[];
  useStaticDataApi?: boolean;
}

/**
 * Cards section component, for rendering multiple cards with image, title, subtitle, paragraph, features, and buttons
 * @param title - Section title
 * @param darkMode - Dark mode flag
 * @param imageContentSections - Array of image content sections
 * @param useStaticDataApi - Flag to use static data API, otherwise use the image in assets
 * @constructor
 */
const CardsSection: React.FC<CardsSectionProps> = ({
  title,
  type = 'default',
  imageContentSections,
  useStaticDataApi = false,
}) => {
  const { animate, ref } = useAnimateOnScroll();

  return (
    <Section ref={ref} $type={type}>
      <SectionTitle $fadeIn={animate}>{title}</SectionTitle>
      <CardContainer>
        {imageContentSections.map((section, index) => (
          <StyledCard
            key={index}
            $fadeIn={animate}
            hoverable
            cover={
              <ImageWrapper>
                <LazyLoadImage
                  src={
                    useStaticDataApi
                      ? `${STATIC_DATA_API}/images/${section.imageUrl}`
                      : getImageUrl(section.imageUrl)
                  }
                  alt={section.title}
                  effect='blur'
                />
              </ImageWrapper>
            }
            onClick={section.clickEvent}
          >
            <Title>{section.title}</Title>
            {section.subTitle && <SubTitle>{section.subTitle}</SubTitle>}
            {section.paragraph && <p>{section.paragraph}</p>}
            <FeatureList>
              {section.features?.map((feature, idx) => (
                <FeatureItem key={idx}>{feature}</FeatureItem>
              ))}
            </FeatureList>
            <Flex wrap='wrap' gap='small' align='center'>
              {section.buttons &&
                section.buttons.map((button, idx) =>
                  button.link ? (
                    <Link key={idx} to={button.link}>
                      <Button
                        type={button.type || 'primary'}
                        ghost={type === 'dark'}
                      >
                        {button.text}
                      </Button>
                    </Link>
                  ) : (
                    <StyledButton
                      key={idx}
                      type={button.type || 'primary'}
                      ghost={
                        button.type !== 'link' &&
                        button.type !== 'text' &&
                        type === 'dark'
                      }
                      href={button.href}
                      target={button.href ? '_blank' : ''}
                      onClick={button.action}
                    >
                      {button.text}
                    </StyledButton>
                  ),
                )}
            </Flex>
          </StyledCard>
        ))}
      </CardContainer>
    </Section>
  );
};

export default CardsSection;
