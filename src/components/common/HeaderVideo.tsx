import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import YouTubeIframeLoader from 'youtube-iframe';

const BackgroundContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const VideoPlaceholder = styled.img<{ $isVideoReady: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 1s ease-out;
  opacity: ${({ $isVideoReady }) => ($isVideoReady ? 0 : 1)};
  z-index: -1;
`;

const BackgroundVideo = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(150vh * 16 / 9);
  height: 100vh;
  min-width: 100vw;
  min-height: calc(120vw * 9 / 16);
  transform: translate(-50%, -50%);
  z-index: -1;
  overflow: hidden;

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

interface HeaderVideoProps {
  youtubeId: string;
  start: number;
}

/**
 * Header video component, responsive background video with placeholder
 * @param youtubeId - YouTube video ID
 * @param start - Start time of the video
 * @constructor HeaderVideo - React Function Component
 */
const HeaderVideo: React.FC<HeaderVideoProps> = ({ youtubeId, start }) => {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const placeholderUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  const isPrerendering = /bot|crawl|spider|googlebot/i.test(
    navigator.userAgent,
  );

  useEffect(() => {
    YouTubeIframeLoader.load((YT) => {
      new YT.Player('youtube-background', {
        videoId: youtubeId,
        events: {
          onStateChange: ({ data }: { data: number }) => {
            if (data !== 1) return;
            setIsVideoReady(true);
          },
        },
        playerVars: {
          autoplay: 1,
          controls: 0,
          mute: 1,
          loop: 1,
          playlist: youtubeId,
          playsinline: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          start: start,
        },
      });
    });
  }, [start, youtubeId]);

  return (
    <BackgroundContainer>
      <VideoPlaceholder
        src={placeholderUrl}
        alt='Background video placeholder'
        $isVideoReady={isVideoReady && !isPrerendering}
      />
      {!isPrerendering && <BackgroundVideo id='youtube-background' />}
    </BackgroundContainer>
  );
};

export default HeaderVideo;
