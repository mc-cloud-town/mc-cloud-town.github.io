import styled from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';

const StyledLazyLoadImageWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  overflow: hidden;
  border: 0;

  & > span > img {
    width: calc(100vh * 16 / 9);
    height: 100vh;
    min-width: 100vw;
    min-height: calc(100vw * 9 / 16);
    object-fit: cover;
  }
`;

/**
 * Header background image with Lazy Load, Fade out effect and full screen
 * @param imageUrl - Image URL for the background image
 * @constructor - React Function Component
 */
const HeaderImage = ({ imageUrl }: { imageUrl: string }) => (
  <StyledLazyLoadImageWrapper>
    <LazyLoadImage
      src={imageUrl}
      alt='background'
      effect='blur'
      wrapperClassName='lazy-load-image-wrapper'
    />
  </StyledLazyLoadImageWrapper>
);

export default HeaderImage;
