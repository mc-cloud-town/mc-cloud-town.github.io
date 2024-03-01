const stopYoutubeVideo = () => {
  const video: HTMLIFrameElement = document.getElementById(
    'video',
  ) as HTMLIFrameElement;
  video &&
    video.contentWindow?.postMessage(
      '{"event":"command", "func":"pauseVideo", "args":""}',
      '*',
    );
};

export default stopYoutubeVideo;
