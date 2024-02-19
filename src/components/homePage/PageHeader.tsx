import styled from 'styled-components';
import { ReactTyped } from "react-typed";

const VideoBackgroundContainer = styled.div`
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
`;

const VideoBackgroundHeader = styled.header`
    position: relative;
    height: 100vh;
    overflow-x: hidden;
    overflow-y: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Mask = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
    z-index: 2;
    background-color: black;
    opacity: 0.6;
`;

const HeaderText = styled.div`
    font-weight: bolder;
    position: absolute;
    color: white;
    text-align: center;
    font-size: 2rem;
    z-index: 3;
`;

const BackgroundVideo = styled.iframe`
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(100vh * 16 / 9);
    height: 100vh;
    min-width: 100vw;
    min-height: calc(100vw * 9 / 16);
    transform: translate(-50%, -50%);
    z-index: 1;
    overflow: hidden;
    border: 0;
`;

const PageHeader = ({ youtubeId, start = 0 }: {
  youtubeId: string,
  start?: number,
}) => {
  const videoSrc = `https://www.youtube.com/embed/${youtubeId}?controls=0&disablekb=1&fs=0&iv_load_policy=3&start=${start}&autoplay=1&mute=1&playsinline=1&loop=1&playlist=${youtubeId}&frameborder=0`;
  return (
    <VideoBackgroundHeader>
      <Mask>
      </Mask>
      <HeaderText>
        <ReactTyped
          strings={['Welcome to Cloud Town Exquisite Craft', '歡迎來到雲鎮工藝 | CTEC']}
          typeSpeed={40}
          backSpeed={50}
          loop={true}
          showCursor={true}
          cursorChar="|"
          backDelay={1000}
        />
      </HeaderText>
      <VideoBackgroundContainer>
        <BackgroundVideo
          src={videoSrc}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube Video Background"
        />
      </VideoBackgroundContainer>
    </VideoBackgroundHeader>
  );
};

export default PageHeader;
