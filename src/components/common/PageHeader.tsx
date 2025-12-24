import React, { JSX } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { ReactTyped } from 'react-typed';
import { useTranslation } from 'react-i18next';
import useScroll from '@/hooks/useScroll.ts';

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

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
`;

const BackgroundHeader = styled.header<{ $transparent?: boolean }>`
  position: relative;
  height: 100vh;
  min-height: 600px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;

  /* Animated gradient background */
  background: ${(props) =>
    props.$transparent ? 'transparent' : 'var(--gradient-hero)'};
  background-size: 200% 200%;
  animation: ${(props) =>
    props.$transparent
      ? 'none'
      : css`
          ${gradientShift} 15s ease infinite
        `};
`;

const StyledH1 = styled.h1`
  font-size: inherit;
  font-weight: inherit;
  margin: 0;
`;

// Gradient overlay for depth
const GradientOverlay = styled.div`
  position: absolute;
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
`;

// Animated floating orbs
const FloatingOrb = styled.div<{
  $size: number;
  $delay: number;
  $left: string;
  $top: string;
}>`
  position: absolute;
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

// Grid pattern overlay
const GridPattern = styled.div`
  position: absolute;
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
`;

const MaskA = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  background-color: rgba(0, 0, 0, 0.2);
  transition: opacity 0.3s ease;
`;

const MaskB = styled(MaskA)<{ $masColor: string }>`
  z-index: 4;
  background: ${({ $masColor }) => $masColor};
  opacity: 0;
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scrollFadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
`;

const HeaderTextContainer = styled.div`
  padding: 0 20px;
  color: white !important;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  position: relative;
  text-align: center;
  z-index: 10;
  max-width: 900px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  span {
    color: white !important;
  }
`;

const SubHeaderTextContainer = styled.div`
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(1rem, 2vw, 1.4rem);
  margin-top: var(--spacing-lg);
  line-height: 1.6;

  /* Enhanced button styling */
  button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid rgba(255, 255, 255, 0.6) !important;
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(10px);
    font-weight: 600;
    padding: 0 32px;
    height: 48px;
    font-size: 1rem;
    border-radius: var(--radius-full) !important;

    &:hover {
      background: rgba(255, 255, 255, 0.25) !important;
      border-color: white !important;
      transform: translateY(-3px);
      box-shadow: 0 10px 40px rgba(255, 255, 255, 0.2);
    }
  }
`;

const AnimatedHeaderTextContainer = styled(HeaderTextContainer)`
  animation: ${fadeInUp} 1s ease-out forwards;

  /* Gradient text effect */
  .typed-cursor {
    color: var(--color-accent);
  }
`;

const AnimatedSubHeaderTextContainer = styled(SubHeaderTextContainer)<{
  $delay?: number;
}>`
  opacity: 0;
  animation: ${fadeInUp} 0.8s ease-out forwards;
  ${(props) =>
    props.$delay &&
    css`
      animation-delay: ${props.$delay}s;
    `}
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  white-space: nowrap;
  animation: ${scrollFadeInUp} 1s ease-out 1.5s forwards;
  opacity: 0;
  cursor: pointer;
  transition: color var(--transition-base);

  &:hover {
    color: white;
  }
`;

const ScrollLine = styled.div`
  width: 2px;
  height: 40px;
  background: linear-gradient(180deg, white, transparent);
  border-radius: 2px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

interface PageHeaderProps {
  backgroundComponent: JSX.Element;
  maskColor?: string;
  headerTextArray: string[];
  subHeaderContentArray?: (string | JSX.Element)[];
  useTyped?: boolean;
  transparent?: boolean;
}

/**
 * Modern hero PageHeader component with animated gradient background,
 * floating orbs, grid pattern, and smooth scroll indicator.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  backgroundComponent,
  maskColor,
  headerTextArray,
  subHeaderContentArray,
  useTyped = false,
  transparent = false,
}: PageHeaderProps) => {
  const { t } = useTranslation();
  const { y } = useScroll();
  const innerHeight = window.innerHeight;
  const maskAOpacity = Math.max(0, 0.4 - (y / innerHeight) * 0.8);
  const maskBOpacity =
    y < innerHeight / 2
      ? 0
      : Math.min(1, (y - innerHeight / 2) / (innerHeight / 3));

  const handleScrollDown = () => {
    window.scrollTo({ top: innerHeight, behavior: 'smooth' });
  };

  return (
    <BackgroundHeader $transparent={transparent}>
      {!transparent && <GradientOverlay />}
      {!transparent && <GridPattern />}

      {/* Floating decorative orbs */}
      {!transparent && (
        <FloatingOrb $size={300} $delay={0} $left='10%' $top='20%' />
      )}
      {!transparent && (
        <FloatingOrb $size={200} $delay={2} $left='80%' $top='60%' />
      )}
      {!transparent && (
        <FloatingOrb $size={150} $delay={1} $left='70%' $top='15%' />
      )}
      {!transparent && (
        <FloatingOrb $size={100} $delay={3} $left='20%' $top='70%' />
      )}

      {!transparent && <MaskA style={{ opacity: maskAOpacity }} />}
      {!transparent && (
        <MaskB
          style={{ opacity: maskBOpacity }}
          $masColor={maskColor ?? 'var(--bg-primary)'}
        />
      )}

      <AnimatedHeaderTextContainer>
        <StyledH1>
          {useTyped ? (
            <ReactTyped
              strings={headerTextArray}
              typeSpeed={40}
              backSpeed={50}
              loop={true}
              showCursor={true}
              cursorChar='|'
              backDelay={1500}
            />
          ) : (
            <>
              {headerTextArray.map((text, index) => (
                <span key={index}>{text}</span>
              ))}
            </>
          )}
        </StyledH1>
        {subHeaderContentArray &&
          subHeaderContentArray.map((text, index) => (
            <AnimatedSubHeaderTextContainer
              key={index}
              $delay={0.3 + index * 0.15}
            >
              {text}
            </AnimatedSubHeaderTextContainer>
          ))}
      </AnimatedHeaderTextContainer>

      <BackgroundContainer>{backgroundComponent}</BackgroundContainer>

      <ScrollIndicator onClick={handleScrollDown}>
        <span>{t('scroll')}</span>
        <ScrollLine />
      </ScrollIndicator>
    </BackgroundHeader>
  );
};

export default PageHeader;
