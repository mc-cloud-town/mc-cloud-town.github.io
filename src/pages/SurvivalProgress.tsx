import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';
import { useEffect, useState } from 'react';

import PageHeader from '#/common/PageHeader.tsx';
import Timeline from '#/survivalProgress/TimeLine.tsx';

import useApi from '@/hooks/useApi.ts';
import { ICollection } from '@/types/ICollection.ts';
import { STATIC_DATA_API } from '@/constants';
import { StatusShowingGroup } from '#/common/StatusShowingGroup.tsx';

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const LoadingBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--gradient-hero);
  background-size: 200% 200%;
  animation: ${gradientShift} 15s ease infinite;
  z-index: 0;
`;

const GradientOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.4) 100%
  );
  z-index: 1;
  pointer-events: none;
`;

const FloatingOrb = styled.div<{
  $size: number;
  $delay: number;
  $left: string;
  $top: string;
}>`
  position: fixed;
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 70%
  );
  border-radius: 50%;
  left: ${(props) => props.$left};
  top: ${(props) => props.$top};
  animation: ${float} ${(props) => 6 + props.$delay}s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay}s;
  pointer-events: none;
  z-index: 2;
`;

const GridPattern = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.03) 1px,
      transparent 1px
    ),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: ${pulse} 4s ease-in-out infinite;
  z-index: 2;
  pointer-events: none;
`;
const LoadingContainer = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
  z-index: 5;
`;

const PageWrapper = styled.div`
  position: relative;
  background: transparent;
  min-height: 100vh;
`;

const SurvivalProgress = () => {
  const { t, i18n } = useTranslation();
  const { data, loading, error } = useApi<ICollection[]>(
    `${STATIC_DATA_API}/${i18n.language}/survivalProgress.json`,
  );
  const [showLoadingBg, setShowLoadingBg] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const shareIndex = parseInt(params.get('index') ?? '-1');

  // Add transparent class to body while on this page
  useEffect(() => {
    document.body.classList.add('transparent-bg');
    return () => {
      document.body.classList.remove('transparent-bg');
    };
  }, []);

  // Hide loading background with delay after data loads
  useEffect(() => {
    if (data && data.length > 0) {
      // Preload first image, then fade out loading overlay
      const firstImage = data[data.length - 1]?.imageUrl;
      if (firstImage) {
        const img = new Image();
        img.onload = () => {
          // Add slight delay for smooth transition
          setTimeout(() => setShowLoadingBg(false), 200);
        };
        img.src = `${STATIC_DATA_API}/images/${firstImage}`;
      } else {
        setTimeout(() => setShowLoadingBg(false), 200);
      }
    }
  }, [data]);

  return (
    <PageWrapper>
      {/* Loading background - stays on top until images load, then fades out */}
      <LoadingContainer $visible={showLoadingBg}>
        <LoadingBackground />
        <GradientOverlay />
        <GridPattern />
        <FloatingOrb $size={300} $delay={0} $left='10%' $top='20%' />
        <FloatingOrb $size={200} $delay={2} $left='80%' $top='60%' />
        <FloatingOrb $size={150} $delay={1} $left='70%' $top='15%' />
        <FloatingOrb $size={100} $delay={3} $left='20%' $top='70%' />
      </LoadingContainer>
      <PageHeader
        backgroundComponent={<></>}
        headerTextArray={[t('survivalProgress.title')]}
        subHeaderContentArray={[t('survivalProgress.description')]}
        transparent={true}
      />
      <StatusShowingGroup error={error} loading={loading} />
      {data && (
        <Timeline items={[...data].reverse()} activeIndex={shareIndex} />
      )}
    </PageWrapper>
  );
};

export default SurvivalProgress;
