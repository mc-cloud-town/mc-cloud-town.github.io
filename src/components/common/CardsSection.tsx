import { Card, Button } from 'antd';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

import { imageContent } from '@/types/imageContent.ts';
import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
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
  background-color: #ecf0f1;
  padding: 50px 20px;

  &.dark {
    background-color: #6f9b9c;
    color: #fff;
  }
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

const StyledCard = styled(Card)`
  opacity: 0;
  flex: 1;
  min-width: 300px;
  text-align: left;

  max-width: 30%;

  @media (max-width: 1024px) {
    max-width: 45%;
  }

  @media (max-width: 768px) {
    max-width: 85%;
  }

  &.fadeIn {
    animation: ${fadeIn} 0.8s ease-out forwards;
  }
`;

const SectionTitle = styled.h2`
  opacity: 0;
  text-align: center;
  color: inherit;
  margin-bottom: 40px;
  font-weight: bolder;

  &.fadeIn {
    animation: ${fadeIn} 0.8s ease-out forwards;
  }
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

  & > span > img {
    width: 100%;
  }
`;

/**
 * Cards Section Component
 * @param title {string} - Title of the section
 * @param darkMode {boolean} - Enable dark mode (default: false)
 * @param imageContentSections {imageContent[]} - Array of imageContent
 * @constructor CardsSection - React Function Component
 */
const CardsSection = (
  {
    title,
    darkMode = false,
    imageContentSections
  }: {
    title: string;
    darkMode: boolean;
    imageContentSections: imageContent[];
  }) => {
  const { animate, ref } = useAnimateOnScroll();

  return (
    <Section ref={ref} className={darkMode ? 'dark' : ''}>
      <SectionTitle className={animate ? 'fadeIn' : ''}>{title}</SectionTitle>
      <CardContainer>
        {imageContentSections.map((section, index) => (
          <StyledCard
            key={index}
            className={animate ? 'fadeIn' : '' + (darkMode ? ' dark' : '')}
            hoverable
            cover={
              <ImageWrapper>
                <LazyLoadImage src={getImageUrl(section.imageUrl)} alt={section.title} effect="blur" />
              </ImageWrapper>
            }
          >
            <Title>{section.title}</Title>
            {section.subTitle && <SubTitle>{section.subTitle}</SubTitle>}
            {section.paragraph && <p>{section.paragraph}</p>}
            <FeatureList>
              {section.features?.map((feature, idx) => (
                <FeatureItem key={idx}>{feature}</FeatureItem>
              ))}
            </FeatureList>
            {section.buttonLink && section.buttonText && (
              <Link to={section.buttonLink}>
                <Button type="primary" ghost={darkMode}>{section.buttonText}</Button>
              </Link>
            )}
          </StyledCard>
        ))}
      </CardContainer>
    </Section>
  );
};

export default CardsSection;