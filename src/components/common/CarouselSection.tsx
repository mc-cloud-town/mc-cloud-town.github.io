import React from 'react';
import { Carousel } from 'antd';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import styled, { css } from 'styled-components';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { IImageContent } from '@/types/IImageContent.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { fadeIn } from '@/styles/animation.ts';

const Section = styled.section`
  background-color: #b1dde6;
  padding: 50px 20px;

  @media (max-width: 400px) {
    padding: 50px 5px;
  }
`;

const SectionTitle = styled.h2<{ $fadeIn: boolean }>`
  text-align: center;
  color: inherit;
  margin-bottom: 40px;
  font-weight: bolder;
  opacity: 0;
  
  ${(props) =>
    props.$fadeIn && css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const CarouselContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px 0;
`;

const CarouselWrapper = styled.div`
  flex: 1;
  max-width: 30%;

  @media (max-width: 1024px) {
    max-width: 45%;
  }

  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

const StyledCarousel = styled(Carousel)<{ $fadeIn: boolean }>`
  opacity: 0;

  ${(props) =>
    props.$fadeIn && css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const ImageWrapper = styled.div`
  width: 100%;
  padding-top: 56.25%;
  position: relative;
  overflow: hidden;
  cursor: pointer;

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
      border-radius: 10px;
    }
  }
`;

interface CarouselSectionProps {
  title: string;
  imageContentsSections: IImageContent[][];
}

/**
 * Carousel section component, display multiple carousels as cards, each carousel contains multiple images
 * @param title - Section title
 * @param imageContentsSections - Array of image content arrays
 * @constructor CarouselSection - React Function Component
 */
const CarouselSection: React.FC<CarouselSectionProps> = ({ title, imageContentsSections }: CarouselSectionProps) => {
  const { ref, animate } = useAnimateOnScroll();

  return (
    <Section ref={ref}>
      <SectionTitle $fadeIn={animate}>{title}</SectionTitle>
      <CarouselContainer>
        {imageContentsSections.map((imageContentSections, index) => (
          <CarouselWrapper key={index}>
            <StyledCarousel
              key={index}
              autoplaySpeed={5000}
              autoplay={true}
              $fadeIn={animate}
            >
              {imageContentSections.map((imageContent, idx) => (
                <ImageWrapper key={idx} onClick={imageContent.clickEvent}>
                  <LazyLoadImage
                    alt={imageContent.title}
                    effect="blur"
                    src={getImageUrl(imageContent.imageUrl)}
                  />
                </ImageWrapper>
              ))}
            </StyledCarousel>
          </CarouselWrapper>
        ))}
      </CarouselContainer>
    </Section>
  );
};

export default CarouselSection;
