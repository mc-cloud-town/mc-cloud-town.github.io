import { Button } from 'antd';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { imageContent } from '@/types/imageContent.ts';

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

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ecf0f1;
  padding: 50px 20px;
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const Container = styled.div`
  flex: 1;
  padding: 20px;
  transition: opacity 0.8s ease-out;
  opacity: 0;

  &.fadeIn {
    animation: ${fadeIn} 0.8s ease-out forwards;
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  & > span > img {
    width: 100%;
    height: auto;
    border-radius: 10px;
    box-shadow: 0 0 10px 0 #000000;
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

/**
 * ImageContentSection component. Left side is an image, right side is text and button.
 * @param imageContent {imageContent} - The image content object.
 * @constructor ImageContentSection
 */
const ImageContentSection = (
  {
    imageContent
  }: {
    imageContent: imageContent
  }) => {
  const {
    imageUrl,
    title,
    subTitle,
    paragraph,
    features,
    buttonLink,
    buttonText,
  } = imageContent;

  const { animate, ref } = useAnimateOnScroll();

  return (
    <SectionContainer ref={ref}>
      <Container className={animate ? 'fadeIn' : ''}>
        <ImageWrapper>
          <LazyLoadImage src={imageUrl} alt={title} effect="blur" />
        </ImageWrapper>
      </Container>
      <Container className={animate ? 'fadeIn' : ''}>
        <TextButtonContainer>
          <Title>{title}</Title>
          {subTitle && <SubTitle>{subTitle}</SubTitle>}
          {paragraph && <Paragraph>{paragraph}</Paragraph>}
          <FeatureList>
            {features && features.map((feature, index) => (
              <FeatureItem key={index}>{feature}</FeatureItem>
            ))}
          </FeatureList>
          {buttonLink && buttonText && (
            <Link to={buttonLink}>
              <Button type="primary">{buttonText}</Button>
            </Link>
          )}
        </TextButtonContainer>
      </Container>
    </SectionContainer>
  );
};

export default ImageContentSection;
