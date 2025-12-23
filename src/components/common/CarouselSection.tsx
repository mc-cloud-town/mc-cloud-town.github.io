import React from 'react';
import { Carousel } from 'antd';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import styled, { css } from 'styled-components';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { IImageContent } from '@/types/IImageContent.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { slideUpSpring, fadeIn } from '@/styles/animation.ts';
import { STATIC_DATA_API } from '@/constants';

const Section = styled.section`
  background: var(--bg-secondary);
  padding: 100px 40px;
  position: relative;
  overflow-x: hidden;

  /* Decorative border */
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

  @media (max-width: 600px) {
    padding: 60px 16px;
  }
`;

const SectionTitle = styled.h2<{ $fadeIn: boolean }>`
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 60px;
  font-weight: 700;
  opacity: 0;
  font-size: clamp(1.75rem, 3vw, 2.5rem);

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const SectionSubtitle = styled.h3<{ $fadeIn: boolean }>`
  text-align: center;
  font-weight: 600;
  margin-top: 16px;
  opacity: 0;
  color: var(--text-secondary);
  font-size: 1rem;
  padding: 8px 16px;
  background: var(--color-primary-light);
  border-radius: var(--radius-full);
  display: inline-block;
  width: 100%;

  ${(props) =>
    props.$fadeIn &&
    css`
      animation: ${fadeIn} 0.8s ease-out forwards;
    `};
`;

const CarouselContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const CarouselWrapper = styled.div<{ $index?: number }>`
  opacity: 0;
  animation: ${slideUpSpring} 0.6s ease-out forwards;
  animation-delay: ${(props) => (props.$index || 0) * 0.15}s;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
`;

const StyledCarousel = styled(Carousel)<{ $fadeIn: boolean }>`
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-slow);
  background: var(--bg-tertiary);
  max-width: 100%;

  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--glow-primary), var(--shadow-xl);
  }

  .slick-dots {
    bottom: 16px;

    li {
      margin: 0 4px;

      button {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5) !important;
        opacity: 1;
        transition: all var(--transition-base);

        &::before {
          display: none;
        }
      }

      &.slick-active button {
        width: 24px;
        border-radius: var(--radius-full);
        background: var(--color-primary) !important;
      }
    }
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  padding-top: 56.25%;
  position: relative;
  overflow: hidden;
  cursor: pointer;

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
    transition: transform 0.5s ease-out;
  }

  &:hover img {
    transform: scale(1.08);
  }
`;

const ImageCaption = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40px 20px 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  text-align: center;
  pointer-events: none;
`;

interface CarouselSectionProps {
  title: string;
  subtitles?: string[];
  imageContentsSections: IImageContent[][];
  useStaticDataApi?: boolean;
}

/**
 * Modern carousel section with grid layout, custom dots, and glassmorphism effects.
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
          <CarouselWrapper key={index} $index={index}>
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
                  {imageContent.title && (
                    <ImageCaption>{imageContent.title}</ImageCaption>
                  )}
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
