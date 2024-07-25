import React from 'react';
import { Carousel } from 'antd';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import styled, { css } from 'styled-components';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { IImageContent } from '@/types/IImageContent.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { fadeIn } from '@/styles/animation.ts';
import { STATIC_DATA_API } from '@/constants';

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
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const SectionSubtitle = styled.h3<{ $fadeIn: boolean }>`
  text-align: center;
  font-weight: bold;
  margin-top: 20px;
  opacity: 0;
  color: #6f9b9c;
  border-radius: 10px;

  ${(props) =>
    props.$fadeIn &&
    css`
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
    margin-bottom: 40px;
  }

  &:last-child {
    margin-bottom: 0;
  }

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
  subtitles?: string[];
  imageContentsSections: IImageContent[][];
  useStaticDataApi?: boolean;
}

/**
 * Carousel section component, display multiple carousels as cards, each carousel contains multiple images
 * @param title - Section title
 * @param subtitles - Section subtitles
 * @param imageContentsSections - Array of image content arrays
 * @param useStaticDataApi - Flag to use static data api
 * @constructor CarouselSection - React Function Component
 */
const CarouselSection: React.FC<CarouselSectionProps> = ({
  title,
  subtitles: sectionSubtitle = [],
  imageContentsSections,
  useStaticDataApi = false,
}: CarouselSectionProps) => {
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
                    effect='blur'
                    src={
                      useStaticDataApi
                        ? `${STATIC_DATA_API}/images/${imageContent.imageUrl}`
                        : getImageUrl(imageContent.imageUrl)
                    }
                  />
                </ImageWrapper>
              ))}
            </StyledCarousel>
            <SectionSubtitle $fadeIn={animate}>
              {sectionSubtitle[index]}
            </SectionSubtitle>
          </CarouselWrapper>
        ))}
      </CarouselContainer>
    </Section>
  );
};

export default CarouselSection;
