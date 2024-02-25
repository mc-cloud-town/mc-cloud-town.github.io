import { Carousel } from 'antd';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import styled, { keyframes } from 'styled-components';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { imageContent } from '@/types/imageContent.ts';
import getImageUrl from '@/utils/getImageUrl.ts';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Section = styled.section`
  background-color: #b1dde6;
  padding: 50px 20px;
  
  &.dark {
    background-color: #6f9b9c;
    color: #fff;
  }
`;

const SectionTitle = styled.h2`
  text-align: center;
  color: inherit;
  margin-bottom: 40px;
  font-weight: bolder;
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

const StyledCarousel = styled(Carousel)`
  opacity: 0;
  
  &.fadeIn {
    animation: ${fadeIn} 0.8s ease-out forwards;
  }
`;

const ImageWrapper = styled.div`
  & > span > img {
    width: 100%;
    border-radius: 10px;
  }
`;

const CarouselSection = (
  {
    title,
    imageContentsSections
  }: {
    title: string;
    imageContentsSections: imageContent[][];
  }) => {
  const { ref, animate } = useAnimateOnScroll();

  return (
    <Section ref={ref}>
      <SectionTitle className={animate ? 'fadeIn' : ''}>{title}</SectionTitle>
      <CarouselContainer>
        {imageContentsSections.map((imageContentSections, index) => (
          <CarouselWrapper key={index}>
            <StyledCarousel
              key={index}
              autoplaySpeed={5000}
              autoplay={true}
              className={animate ? 'fadeIn' : ''}
            >
              {imageContentSections.map((imageContent, idx) => (
                <ImageWrapper key={idx}>
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
