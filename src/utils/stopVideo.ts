/**
 * Stop any iframe video or HTML5 video from playing
 */
const stopVideo = () => {
  const videos = document.querySelectorAll(
    'iframe, video',
  ) as NodeListOf<HTMLVideoElement>;
  Array.from(videos).forEach((video) => {
    if (video.tagName.toLowerCase() === 'video') {
      video.pause();
    } else {
      const src = video.src;
      video.src = '';
      video.src = src;
    }
  });
};

export default stopVideo;
