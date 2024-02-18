import styled from 'styled-components';

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

const PageHeader = () => (
  <VideoBackgroundHeader>
    <Mask>
    </Mask>
    <HeaderText>歡迎來到我的網站</HeaderText>
    <VideoBackgroundContainer>
      <BackgroundVideo
        src="https://www.youtube.com/embed/7lq_6S8jjJs?controls=0&autoplay=1&mute=1&playsinline=1&loop=1&playlist=7lq_6S8jjJs&frameborder=0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube Video Background"
      />
    </VideoBackgroundContainer>
  </VideoBackgroundHeader>
);

export default PageHeader;
