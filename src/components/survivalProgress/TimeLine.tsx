import React from 'react';
import { Timeline } from 'antd';
import styled from 'styled-components';

import { IImageContent } from '@/types/IImageContent';
import TimelineItemContent from '#/survivalProgress/TimeLineContent.tsx';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 0;
`;

const TimelineLargeDevice = styled(Timeline)`
  @media (max-width: 768px) {
    display: none;
  }
`;

const TimelineSmallDevice = styled(Timeline)`
  padding: 50px;
  @media (min-width: 768px) {
    display: none;
  }
  
  @media (max-width: 400px) {
    padding: 10px;
  }
`;

interface TimelineProps {
  items: IImageContent[];
}

const TimelineComponent: React.FC<TimelineProps> = ({ items }) => (
  <Container>
    <TimelineLargeDevice
      mode="alternate"
      items={items.map((item, index) => ({
        key: index,
        label: item.title,
        children: <TimelineItemContent {...item} />
      }))}
    />
    <TimelineSmallDevice
      items={items.map((item, index) => ({
        key: index,
        children: <TimelineItemContent {...item} />
      }))}
    />
  </Container>
);

export default TimelineComponent;
