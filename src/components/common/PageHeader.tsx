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
  position: absolute;
  text-align: center;
  z-index: 3;
`;

const HeaderText = styled.h1`
  font-weight: bolder;
  color: white;
  font-size: 2rem;
`;

const SubHeaderText = styled.h2`
  font-weight: normal;
  color: white;
  font-size: 1.5rem;
  margin-top: 20px;
`;


/**
 * PageHeader component to display a header with a background component.
 * @param backgroundComponent {JSX.Element} The background component to display.
 * (Video, Image, etc.)
 * @param headerTextArray {string[]} The array of header text to display.
 * If useTyped is true, the array will be used as the strings for the ReactTyped component.
 * If useTyped is false, the array will be used as the header text and subheader text.
 * @param useTyped {boolean} Whether to use the ReactTyped component to display the header text.
 * @constructor PageHeader Component.
 */
const PageHeader = ({
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
        <HeaderText>
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
              index === 0 ? <HeaderText key={index}>{text}</HeaderText> :
                <SubHeaderText key={index}>{text}</SubHeaderText>
            )
          )}
        </HeaderText>
      </HeaderTextContainer>
      <BackgroundContainer>
        {backgroundComponent}
      </BackgroundContainer>
    </BackgroundHeader>
  );
};

export default PageHeader;
