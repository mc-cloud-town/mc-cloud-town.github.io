import styled from 'styled-components';

const BackgroundVideo = styled.iframe`
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

const HeaderBackground = () => {
  const youtubeId = 'USJWCs-rlc0';
  const start = 9;
  const videoSrc = `https://www.youtube.com/embed/${youtubeId}?controls=0&disablekb=1&fs=0&iv_load_policy=3&start=${start}&autoplay=1&mute=1&playsinline=1&loop=1&playlist=${youtubeId}&frameborder=0`;
  return (
    <BackgroundVideo
      src={videoSrc}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="YouTube Video Background"
    />
  );
}

export default HeaderBackground;