import { Typography } from 'antd';
import styled, { css } from 'styled-components';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { fadeIn } from '@/styles/animation.ts';

const { Title, Text } = Typography;

const Image = styled.img`
  width: 100%;
  margin-bottom: 20px;
  border-radius: 10px;
`;

const TimelineItemContainer = styled.div<{ $animate: boolean }>`
  width: 95%;
  visibility: ${({ $animate }) => ($animate ? 'visible' : 'hidden')};
  animation: ${({ $animate }) => ($animate ? css`${fadeIn} 0.8s forwards` : 'none')};
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

const TimelineItemContent = (
  {
    imageUrl,
    title,
    subTitle,
    paragraph
  }: {
    imageUrl: string;
    title: string;
    subTitle?: string;
    paragraph?: string;
  }) => {
  const { animate, ref } = useAnimateOnScroll();

  return (
    <TimelineItemContainer $animate={animate} ref={ref}>
      <Image src={getImageUrl(imageUrl)} alt={title} />
      <StyledTitle level={4}>{title}</StyledTitle>
      <StyledText strong>{subTitle}</StyledText>
      <StyledParagraph>{paragraph}</StyledParagraph>
    </TimelineItemContainer>
  );
};

export default TimelineItemContent;
