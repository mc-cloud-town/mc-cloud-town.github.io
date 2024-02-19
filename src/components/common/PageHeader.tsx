import { JSX } from 'react';
import styled from 'styled-components';
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

const MaskB = styled(MaskA)`
  z-index: -997;
  background: white;
  opacity: 0;
`;

const HeaderTextContainer = styled.div`
  font-weight: bolder;
  color: white;
  font-size: 2rem;
  position: absolute;
  text-align: center;
  z-index: 3;
`;

const SubHeaderText = styled.h2`
  font-weight: normal;
  color: white;
  font-size: 1.5rem;
  margin-top: 20px;
`;


/**
 * Renders a PageHeader component with customizable background and header text.
 * This component can display the header text with dynamic typing animation
 * when `useTyped` is enabled.
 *
 * @param backgroundComponent {JSX.Element} - The JSX component used as a background (e.g., Video, Image).
 * @param headerTextArray {string[]} - An array of strings for header text.
 *   If `useTyped` is true, texts are displayed with typing animation via ReactTyped.
 *   If `useTyped` is false, the first string is the main header and others are subheaders, displayed without typing animation.
 * @param useTyped {boolean} - Flag to enable/disable typing animation for displaying header text.
 * @constructor - React Component
 */
const PageHeader = (
  {
    backgroundComponent,
    headerTextArray,
    useTyped = false
  }: {
    backgroundComponent: JSX.Element,
    headerTextArray: string[],
    useTyped?: boolean,
  }) => {
  const { y } = useScroll();
  const innerHeight = window.innerHeight;
  const maskAOpacity = 0.6 - (y / innerHeight) * 1.2;
  const maskBOpacity = y < innerHeight / 2 ? 0 : (y - innerHeight / 2) / (innerHeight / 3);
  return (
    <BackgroundHeader>
      <MaskA style={{ opacity: maskAOpacity }} />
      <MaskB style={{ opacity: maskBOpacity }} />
      <HeaderTextContainer>
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
          headerTextArray.map((text, index) =>
            index === 0 ? <span key={index}>{text}</span> :
              <SubHeaderText key={index}>{text}</SubHeaderText>
          )
        )}
      </HeaderTextContainer>
      <BackgroundContainer>
        {backgroundComponent}
      </BackgroundContainer>
    </BackgroundHeader>
  );
};

export default PageHeader;
