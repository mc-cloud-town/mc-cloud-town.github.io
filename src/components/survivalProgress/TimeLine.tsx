import React, { useEffect, useState, useRef } from 'react';
import { Timeline } from 'antd';
import styled from 'styled-components';

import { IImageContent } from '@/types/IImageContent';
import TimelineItemContent from '#/survivalProgress/TimeLineContent.tsx';
import useScroll from '@/hooks/useScroll.ts';
import getImageUrl from '@/utils/getImageUrl.ts';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 0;
`;

const BackgroundContainer = styled.div<{ $bgImage: string }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${(props) => props.$bgImage});
  background-size: cover;
  background-position: center;
  z-index: -1;
  transition: background-image 0.5s ease-in-out;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
`;

interface TimelineProps {
  items: IImageContent[];
}

const TimelineComponent: React.FC<TimelineProps> = ({ items }) => {
  const { y } = useScroll();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeBgImage, setActiveBgImage] = useState<string>(items[0]?.imageUrl || '');

  useEffect(() => {
    const checkVisibility = () => {
      const windowBottom = y + window.innerHeight;

      for (let index = itemRefs.current.length - 1; index >= 0; index--) {
        const ref = itemRefs.current[index];
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const top = rect.top + window.scrollY;

          if (top < windowBottom - 200) {
            setActiveBgImage(items[index].imageUrl);
            break;
          }
        }
      }
    };

    checkVisibility();
  }, [y, items]);
  
  return (
    <>
      <BackgroundContainer $bgImage={getImageUrl(activeBgImage)} />
      <Container>
        <Timeline
          mode="alternate"
          items={items.map((item, index) => ({
            key: index,
            children: (
              <div ref={(el) => (itemRefs.current[index] = el)}>
                <TimelineItemContent {...item} />
              </div>
            ),
          }))}
        />
      </Container>
    </>
  );
};

export default TimelineComponent;
