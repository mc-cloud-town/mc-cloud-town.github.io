import { JSX } from 'react';
import styled, { keyframes } from 'styled-components';
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
`;

const SubHeaderTextContainer = styled.div`
  font-weight: normal;
  color: white;
  font-size: 1.5rem;
  margin-top: 20px;
`;

const fadeInAnimation = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const AnimatedHeaderTextContainer = styled(HeaderTextContainer)`
  animation: ${fadeInAnimation} 1s ease-out forwards;
`;

const AnimatedSubHeaderTextContainer = styled(SubHeaderTextContainer)`
  animation: ${fadeInAnimation} 1.25s ease-out forwards;
`;

/**
 * Renders a PageHeader component with customizable background and header text.
 * This component can display the header text with dynamic typing animation
 * when `useTyped` is enabled.
 *
 * @param backgroundComponent {JSX.Element} - The JSX component used as a background (e.g., Video, Image).
 * @param titleTextArray {string[]} - An array of strings for header title.
 *   If `useTyped` is true, texts are displayed with typing animation via ReactTyped.
 * @param subHeaderContentArray {string[] | JSX.Element[]} - An array of strings or JSX elements for sub-header title.
 * @param useTyped {boolean} - Flag to enable/disable typing animation for displaying header text.
 * @constructor PageHeader - React Function Component
 */
const PageHeader = (
  {
    backgroundComponent,
    maskColor,
    headerTextArray,
    subHeaderContentArray,
    useTyped = false
  }: {
    backgroundComponent: JSX.Element,
    maskColor?: string,
    headerTextArray: string[],
    subHeaderContentArray?: (string | JSX.Element)[],
    useTyped?: boolean,
  }) => {
  const { y } = useScroll();
  const innerHeight = window.innerHeight;
  const maskAOpacity = 0.6 - (y / innerHeight) * 1.2;
  const maskBOpacity = y < innerHeight / 2 ? 0 : (y - innerHeight / 2) / (innerHeight / 3);
  return (
    <BackgroundHeader>
      <MaskA style={{ opacity: maskAOpacity }} />
      <MaskB style={{ opacity: maskBOpacity }} $masColor={maskColor ?? '#ecf0f1'} />
      <AnimatedHeaderTextContainer>
        <StyledH1>
          {useTyped ? (
            <ReactTyped
              strings={headerTextArray}
              typeSpeed={40}
              backSpeed={50}
              loop={true}
              showCursor={true}
              cursorChar="|"
              backDelay={1000}
            />
          ) : (
            <>
              {headerTextArray.map((text, index) =>
                <span key={index}>{text}</span>
              )}
            </>
          )}
        </StyledH1>
        {subHeaderContentArray && subHeaderContentArray.map((text, index) =>
          <AnimatedSubHeaderTextContainer key={index}>
            {text}
          </AnimatedSubHeaderTextContainer>
        )}
      </AnimatedHeaderTextContainer>
      <BackgroundContainer>
        {backgroundComponent}
      </BackgroundContainer>
    </BackgroundHeader>
  );
};

export default PageHeader;
