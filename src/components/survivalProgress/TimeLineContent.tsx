import useAnimateOnScroll from '@/hooks/useAnimateOnScroll.ts';
import getImageUrl from '@/utils/getImageUrl.ts';
import { fadeIn } from '@/styles/animation.ts';
import styled, { css } from 'styled-components';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const Image = styled.img`
  width: 80%;
  margin-bottom: 20px;
  border-radius: 10px;
`;

const TimelineItemContainer = styled.div<{ $animate: boolean }>`
  width: 100%;
  visibility: ${({ $animate }) => ($animate ? 'visible' : 'hidden')};
  animation: ${({ $animate }) => ($animate ? css`${fadeIn} 0.8s forwards` : 'none')};
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
      <Title level={4}>{title}</Title>
      <Text strong>{subTitle}</Text>
      <p>{paragraph}</p>
    </TimelineItemContainer>
  );
};

export default TimelineItemContent;
