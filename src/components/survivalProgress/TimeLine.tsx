import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Timeline } from 'antd';
import styled, { keyframes } from 'styled-components';
import { throttle } from 'lodash';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import TimelineItemContent from '#/survivalProgress/TimeLineContent.tsx';

import { IImageContent } from '@/types/IImageContent';
import useScroll from '@/hooks/useScroll.ts';
import { STATIC_DATA_API } from '@/constants';

const PageBackgroundLayer = styled.div<{
  $bgImage: string;
  $isActive: boolean;
}>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${(props) => props.$bgImage});
  background-size: cover;
  background-position: center;
  transition: opacity 0.5s ease-in-out;
  opacity: ${(props) => (props.$isActive ? 1 : 0)};
  z-index: -2;
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const PageBackgroundBase = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--gradient-hero);
  background-size: 200% 200%;
  animation: ${gradientShift} 15s ease infinite;
  z-index: -3;
`;

const PageBackgroundOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
  pointer-events: none;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 60px;
  position: relative;

  @media (max-width: 768px) {
    padding: 50px 20px;
  }
`;

const StyledTimeline = styled(Timeline)`
  width: 100%;

  /* Force light-colored timeline line for visibility against dark background */
  .ant-timeline-item-tail {
    border-left-color: rgba(255, 255, 255, 0.4) !important;
  }
`;

const AutoScrollButton = styled.button<{ $isPlaying: boolean; $show: boolean }>`
  position: fixed;
  bottom: 24px;
  right: 80px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  background: ${(props) =>
    props.$isPlaying
      ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
      : 'var(--glass-bg)'};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: ${(props) => (props.$isPlaying ? 'white' : 'var(--text-secondary)')};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);

  /* Appear animation like ScrollToTopButton */
  opacity: ${(props) => (props.$show ? 1 : 0)};
  visibility: ${(props) => (props.$show ? 'visible' : 'hidden')};
  transform: translateY(${(props) => (props.$show ? '0' : '20px')});

  &:hover {
    background: ${(props) =>
      props.$isPlaying
        ? 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))'
        : 'var(--color-primary)'};
    color: white;
    border-color: var(--color-primary);
    transform: ${(props) =>
      props.$show ? 'translateY(-4px)' : 'translateY(20px)'};
    box-shadow: var(--glow-primary);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    font-size: 18px;
  }

  @media (max-width: 768px) {
    bottom: 24px;
    /* Position: scroll-to-top is at right:24px with width:48px, so we need right:24+48+8=80px */
    right: 80px;
    /* Match scroll-to-top button height */
    height: 48px;
    padding: 0 14px;
    font-size: 12px;
    gap: 4px;

    svg {
      font-size: 16px;
    }
  }
`;

const ProgressContainer = styled.div`
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const ProgressBar = styled.div`
  width: 4px;
  height: 200px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.$progress}%;
  background: linear-gradient(
    to top,
    rgba(100, 200, 255, 0.9),
    rgba(150, 100, 255, 0.9)
  );
  border-radius: 4px;
  transition: height 0.1s linear;
`;

const ProgressLabel = styled.span<{ $isChinese: boolean }>`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
  writing-mode: vertical-rl;
  text-orientation: ${(props) => (props.$isChinese ? 'upright' : 'mixed')};
  transform: ${(props) => (props.$isChinese ? 'none' : 'rotate(180deg)')};
`;

interface TimelineProps {
  items: IImageContent[];
  activeIndex?: number;
}

const TimelineComponent: React.FC<TimelineProps> = ({ items, activeIndex }) => {
  const { t, i18n } = useTranslation();
  const { y } = useScroll();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [bgImage1, setBgImage1] = useState<string>(items[0]?.imageUrl || '');
  const [bgImage2, setBgImage2] = useState<string>('');
  const [activeLayer, setActiveLayer] = useState<1 | 2>(1);

  // Auto-scroll state
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(-1); // -1 means not started
  const [showButton, setShowButton] = useState(false); // Show button after scrolling
  const storyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedRef = useRef(false); // Track if story has been started (vs paused)

  // Story mode settings
  const PAUSE_DURATION = 3000; // Pause 3 seconds on each item

  // Show button after scrolling (like ScrollToTopButton)
  useEffect(() => {
    setShowButton(y > 400);
  }, [y]);

  // Calculate scroll progress
  useEffect(() => {
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (y / maxScroll) * 100 : 0;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  }, [y]);

  // Terminate story mode on user scroll
  useEffect(() => {
    const terminateStoryMode = () => {
      if (isAutoScrolling) {
        setIsAutoScrolling(false);
        if (storyTimeoutRef.current) {
          clearTimeout(storyTimeoutRef.current);
          storyTimeoutRef.current = null;
        }
        // Reset for next fresh start
        hasStartedRef.current = false;
        setCurrentStoryIndex(-1);
      }
    };

    window.addEventListener('wheel', terminateStoryMode, { passive: true });
    window.addEventListener('touchmove', terminateStoryMode, { passive: true });

    return () => {
      window.removeEventListener('wheel', terminateStoryMode);
      window.removeEventListener('touchmove', terminateStoryMode);
    };
  }, [isAutoScrolling]);

  // Story mode: scroll to next item (going upward - from bottom to top)
  const scrollToNextItem = useCallback(() => {
    if (!isAutoScrolling) return;

    const nextIndex = currentStoryIndex - 1;

    if (nextIndex < 0) {
      // Reached the top, stop story mode
      setIsAutoScrolling(false);
      hasStartedRef.current = false;
      setCurrentStoryIndex(-1);
      return;
    }

    const nextRef = itemRefs.current[nextIndex];
    if (nextRef) {
      nextRef.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      setCurrentStoryIndex(nextIndex);
    }
  }, [isAutoScrolling, currentStoryIndex]);

  // Schedule next scroll after index changes
  useEffect(() => {
    if (isAutoScrolling && currentStoryIndex >= 0) {
      storyTimeoutRef.current = setTimeout(() => {
        scrollToNextItem();
      }, PAUSE_DURATION);
    }

    return () => {
      if (storyTimeoutRef.current) {
        clearTimeout(storyTimeoutRef.current);
      }
    };
  }, [isAutoScrolling, currentStoryIndex, scrollToNextItem]);

  // Toggle auto-scroll (Start/Pause button)
  const toggleAutoScroll = useCallback(() => {
    if (isAutoScrolling) {
      // PAUSE: Just stop, keep current index for resume
      setIsAutoScrolling(false);
      if (storyTimeoutRef.current) {
        clearTimeout(storyTimeoutRef.current);
        storyTimeoutRef.current = null;
      }
      // Keep hasStartedRef.current = true so we know to resume, not restart
    } else {
      // Check if this is a fresh start or resume from pause
      const isPaused = hasStartedRef.current && currentStoryIndex >= 0;

      if (isPaused) {
        // RESUME: Continue from current position
        setIsAutoScrolling(true);

        // Scroll to current item first
        const currentRef = itemRefs.current[currentStoryIndex];
        if (currentRef) {
          currentRef.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      } else {
        // FRESH START: Go to last item (bottom) and begin
        setIsAutoScrolling(true);
        hasStartedRef.current = true;

        const startIndex = items.length - 1;
        setCurrentStoryIndex(startIndex);

        // Scroll to the starting item first
        const startRef = itemRefs.current[startIndex];
        if (startRef) {
          startRef.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [isAutoScrolling, items.length, currentStoryIndex]);

  useEffect(() => {
    const checkVisibility = throttle(() => {
      const windowBottom = y + window.innerHeight;
      for (let index = itemRefs.current.length - 1; index >= 0; index--) {
        const ref = itemRefs.current[index];
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const bottom = rect.bottom + window.scrollY;

          if (bottom < windowBottom) {
            const newImage = items[index].imageUrl;
            // Only update if the image is different
            if (
              (activeLayer === 1 && newImage !== bgImage1) ||
              (activeLayer === 2 && newImage !== bgImage2)
            ) {
              // Switch to the other layer with the new image
              if (activeLayer === 1) {
                setBgImage2(newImage);
                setActiveLayer(2);
              } else {
                setBgImage1(newImage);
                setActiveLayer(1);
              }
            }
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
  }, [y, items, bgImage1, bgImage2, activeLayer]);

  useEffect(() => {
    if (typeof activeIndex === 'number' && itemRefs.current[activeIndex]) {
      setTimeout(() => {
        itemRefs.current[activeIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 500);
    }
  }, [activeIndex]);

  const timelineMode = window.innerWidth < 768 ? 'left' : 'alternate';

  return (
    <>
      <PageBackgroundBase />
      <PageBackgroundLayer
        $bgImage={`${STATIC_DATA_API}/images/${bgImage1}`}
        $isActive={activeLayer === 1}
      />
      <PageBackgroundLayer
        $bgImage={`${STATIC_DATA_API}/images/${bgImage2}`}
        $isActive={activeLayer === 2}
      />
      <PageBackgroundOverlay />

      {/* Progress indicator */}
      <ProgressContainer>
        <ProgressLabel $isChinese={i18n.language.startsWith('zh')}>
          {t('survivalProgress.storyMode', 'Story')}
        </ProgressLabel>
        <ProgressBar>
          <ProgressFill $progress={scrollProgress} />
        </ProgressBar>
      </ProgressContainer>

      {/* Auto-scroll control button */}
      <AutoScrollButton
        $isPlaying={isAutoScrolling}
        $show={showButton || isAutoScrolling}
        onClick={toggleAutoScroll}
      >
        {isAutoScrolling ? (
          <>
            <PauseCircleOutlined />
            {t('survivalProgress.pause', 'Pause')}
          </>
        ) : hasStartedRef.current && currentStoryIndex >= 0 ? (
          <>
            <PlayCircleOutlined />
            {t('survivalProgress.continue', 'Continue')}
          </>
        ) : (
          <>
            <PlayCircleOutlined />
            {t('survivalProgress.storyMode', 'Story Mode')}
          </>
        )}
      </AutoScrollButton>

      <Container>
        <StyledTimeline
          mode={timelineMode}
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
