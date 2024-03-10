import { Typography } from 'antd';
import styled, { css } from 'styled-components';

import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { fadeIn } from '@/styles/animation.ts';

const { Title, Text } = Typography;

const Image = styled.img`
  width: 80%;
  margin-bottom: 20px;
  border-radius: 10px;
`;

const TimelineItemContainer = styled.div<{ $animate: boolean }>`
  width: 80%;
  visibility: ${({ $animate }) => ($animate ? 'visible' : 'hidden')};
  animation: ${({ $animate }) => ($animate ? css`${fadeIn} 0.8s forwards` : 'none')};
  color: #fff;
`;

const StyledTitle = styled(Title)`
  color: #fff !important;
`;

const StyledText = styled(Text)`
  color: #ddd !important;
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
      <p>{paragraph}</p>
    </TimelineItemContainer>
  );
};

export default TimelineItemContent;
