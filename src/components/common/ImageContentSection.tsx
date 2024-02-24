import { Button } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import useScroll from '@/hooks/useScroll.ts';

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

const Image = styled.img`
  width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 0 10px 0 #000000;
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
 * @param imageUrl {string} - The image url.
 * @param title {string} - The title of the section.
 * @param subTitle {string} - The subtitle of the section. (Optional)
 * @param paragraph {string} - The paragraph of the section. (Optional)
 * @param features {string[]} - The list of features. (Optional)
 * @param buttonLink {string} - The link of the button. (Optional)
 * @param buttonText {string} - The text of the button. (Optional)
 * @constructor ImageContentSection
 */
const ImageContentSection = (
  {
    imageUrl,
    title,
    subTitle,
    paragraph,
    features,
    buttonLink,
    buttonText
  }: {
    imageUrl: string;
    title: string;
    subTitle?: string;
    paragraph?: string;
    features?: string[];
    buttonLink?: string;
    buttonText?: string;
  }) => {
  const { y, lastY } = useScroll();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (y === lastY) return;
    if (y > lastY && y > 100) {
      setAnimate(true);
    }
  }, [y, lastY]);

  return (
    <SectionContainer>
      <Container className={animate ? 'fadeIn' : ''}>
        <Image src={imageUrl} alt={title} />
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
