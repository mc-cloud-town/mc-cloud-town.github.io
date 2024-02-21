import styled from 'styled-components';

const BackgroundImage = styled.img`
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(150vh * 16 / 9);
  height: 100vh;
  min-width: 100vw;
  min-height: calc(120vw * 9 / 16);
  transform: translate(-50%, -50%);
  z-index: 1;
  overflow: hidden;
  border: 0;
`;

const HeaderImage = ({imageUrl}: {imageUrl: string}) => <BackgroundImage src={imageUrl} alt="background" />

export default HeaderImage;
