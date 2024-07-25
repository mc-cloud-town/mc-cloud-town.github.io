import { Typography } from 'antd';
import styled, { css } from 'styled-components';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import { fadeIn } from '@/styles/animation.ts';
import { STATIC_DATA_API } from '@/constants';

const { Title, Text } = Typography;

const ImageWrapper = styled.div`
  width: 100%;
  margin-bottom: 20px;
  border-radius: 10px;
  background-color: #ccc;
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    display: block;
    padding-top: 56.25%;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  position: absolute;
  top: 0;
  left: 0;
`;

const TimelineItemContainer = styled.div<{ $animate: boolean }>`
  width: 95%;
  visibility: ${({ $animate }) => ($animate ? 'visible' : 'hidden')};
  animation: ${({ $animate }) =>
    $animate
      ? css`
          ${fadeIn} 0.8s forwards
        `
      : 'none'};
  color: #fff;
`;

const StyledTitle = styled(Title)`
  font-size: 1.75rem;
  color: #fff !important;
`;

const StyledText = styled(Text)`
  font-size: 1.5rem;
  color: #ddd !important;
`;

const StyledParagraph = styled.p`
  font-size: 1rem;
  color: grey;
`;

const TimelineItemContent = ({
  imageUrl,
  title,
  subTitle,
  paragraph,
}: {
  imageUrl: string;
  title: string;
  subTitle?: string;
  paragraph?: string;
}) => {
  const { animate, ref } = useAnimateOnScroll();

  return (
    <TimelineItemContainer $animate={animate} ref={ref}>
      <ImageWrapper>
        <Image src={`${STATIC_DATA_API}/images/${imageUrl}`} alt={title} />
      </ImageWrapper>
      <StyledTitle level={4}>{title}</StyledTitle>
      <StyledText strong>{subTitle}</StyledText>
      <StyledParagraph>{paragraph}</StyledParagraph>
    </TimelineItemContainer>
  );
};

export default TimelineItemContent;
