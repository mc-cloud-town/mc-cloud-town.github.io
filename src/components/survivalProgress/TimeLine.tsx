import React, { useEffect, useState, useRef } from 'react';
import { Timeline } from 'antd';
import styled from 'styled-components';
import { throttle } from 'lodash';

import TimelineItemContent from '#/survivalProgress/TimeLineContent.tsx';

import { IImageContent } from '@/types/IImageContent';
import useScroll from '@/hooks/useScroll.ts';
import getImageUrl from '@/utils/getImageUrl.ts';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 60px;

  @media (max-width: 768px) {
    padding: 50px 20px;
  }
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

const StyledTimeline = styled(Timeline)`
  width: 100%;
`;

interface TimelineProps {
  items: IImageContent[];
  activeIndex?: number;
}

const TimelineComponent: React.FC<TimelineProps> = ({ items, activeIndex }) => {
  const { y } = useScroll();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeBgImage, setActiveBgImage] = useState<string>(items[0]?.imageUrl || '');

  useEffect(() => {
    const checkVisibility = throttle(() => {
      const windowBottom = y + window.innerHeight;
      for (let index = itemRefs.current.length - 1; index >= 0; index--) {
        const ref = itemRefs.current[index];
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const bottom = rect.bottom + window.scrollY;

          if (bottom < windowBottom) {
            setActiveBgImage(items[index].imageUrl);
            break;
          }
        }
      }
    }, 100);

    checkVisibility();

    window.addEventListener('resize', checkVisibility);
    return () => {
      window.removeEventListener('resize', checkVisibility);
      checkVisibility.cancel();
    };
  }, [y, items]);

  useEffect(() => {
    if (typeof activeIndex === 'number' && itemRefs.current[activeIndex]) {
      setTimeout(() => {
          itemRefs.current[activeIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 500);
    }
  }, [activeIndex]);

  const timelineMode = window.innerWidth < 768 ? 'left' : 'alternate';

  return (
    <>
      <BackgroundContainer $bgImage={getImageUrl(activeBgImage)} />
      <Container>
        <StyledTimeline
          mode={timelineMode}
          items={items.map((item, index) => ({
            key: index,
            children: (
              <div ref={(el) => (itemRefs.current[index] = el)}>
                <TimelineItemContent {...item} />
              </div>
            )
          }))}
        />
      </Container>
    </>
  );
};

export default TimelineComponent;
