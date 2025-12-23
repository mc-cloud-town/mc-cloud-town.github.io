import React, { JSX } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { ReactTyped } from 'react-typed';
import useScroll from '@/hooks/useScroll.ts';

const BackgroundContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  z-index: -999;
`;

const BackgroundHeader = styled.header`
  position: relative;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledH1 = styled.h1`
  font-size: inherit;
  font-weight: inherit;
`;

// Enhanced gradient mask overlay - keeps dark overlay for text readability
const MaskA = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  z-index: -998;
  background-color: black;
  opacity: 0.6;
`;

const MaskB = styled(MaskA)<{ $masColor: string }>`
  z-index: -997;
  background: ${({ $masColor }) => $masColor};
  opacity: 0;
`;

const HeaderTextContainer = styled.div`
  padding: 0 20px;
  font-weight: bolder;
  color: white;
  font-size: 2.5rem;
  position: absolute;
  text-align: center;
  z-index: 3;
  text-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
`;

const SubHeaderTextContainer = styled.div`
  font-weight: normal;
  color: white;
  font-size: 1.5rem;
  margin-top: 20px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);

  /* Enhanced button styling within */
  button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid rgba(255, 255, 255, 0.8) !important;
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(255, 255, 255, 0.25) !important;
      border-color: white !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(255, 255, 255, 0.2);
    }
  }
`;

const fadeInAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AnimatedHeaderTextContainer = styled(HeaderTextContainer)`
  animation: ${fadeInAnimation} 1s ease-out forwards;

  /* Add subtle float effect after initial animation */
  &::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 3px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.6),
      transparent
    );
    border-radius: 2px;
  }
`;

const AnimatedSubHeaderTextContainer = styled(SubHeaderTextContainer)<{
  $delay?: number;
}>`
  opacity: 0;
  animation: ${fadeInAnimation} 0.8s ease-out forwards;
  ${(props) =>
    props.$delay &&
    css`
      animation-delay: ${props.$delay}s;
    `}
`;

interface PageHeaderProps {
  backgroundComponent: JSX.Element;
  maskColor?: string;
  headerTextArray: string[];
  subHeaderContentArray?: (string | JSX.Element)[];
  useTyped?: boolean;
}

/**
 * Renders a PageHeader component with customizable background and header text.
 * This component can display the header text with dynamic typing animation
 * when `useTyped` is enabled.
 *
 * @param backgroundComponent - The JSX component used as a background (e.g., HeaderVideo, HeaderImage).
 * @param maskColor - The color of the mask overlay when scrolling down to match the down part of the background.
 * @param headerTextArray - An array of strings for header title. If `useTyped` is true, texts are displayed with typing animation via ReactTyped.
 * @param subHeaderContentArray - An array of strings or JSX elements for sub-header title.
 * @param useTyped - Flag to enable/disable typing animation for displaying header text.
 * @constructor PageHeader - React Function Component
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  backgroundComponent,
  maskColor,
  headerTextArray,
  subHeaderContentArray,
  useTyped = false,
}: PageHeaderProps) => {
  const { y } = useScroll();
  const innerHeight = window.innerHeight;
  const maskAOpacity = 0.6 - (y / innerHeight) * 1.2;
  const maskBOpacity =
    y < innerHeight / 2 ? 0 : (y - innerHeight / 2) / (innerHeight / 3);
  return (
    <BackgroundHeader>
      <MaskA style={{ opacity: maskAOpacity }} />
      <MaskB
        style={{ opacity: maskBOpacity }}
        $masColor={maskColor ?? '#ecf0f1'}
      />
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
              backDelay={1000}
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
            <AnimatedSubHeaderTextContainer key={index}>
              {text}
            </AnimatedSubHeaderTextContainer>
          ))}
      </AnimatedHeaderTextContainer>
      <BackgroundContainer>{backgroundComponent}</BackgroundContainer>
    </BackgroundHeader>
  );
};

export default PageHeader;
