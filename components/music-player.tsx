import React, { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button';

interface MusicPlayerProps {
  videoId: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const loadYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
    } else {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
    }
  });
};

const MusicPlayer: React.FC<MusicPlayerProps> = ({ videoId }) => {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializePlayer = async () => {
      await loadYouTubeAPI();
      
      if (isMounted) {
        playerRef.current = new window.YT.Player('ytplayer', {
          height: '0',
          width: '0',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            loop: 1,
            playlist: videoId
          },
          events: {
            'onReady': onPlayerReady,
            'onError': onPlayerError,
          }
        });
      }
    };

    initializePlayer();

    return () => {
      isMounted = false;
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const onPlayerReady = (event: any) => {
    setIsReady(true);
    console.log("Player is ready");
  }

  const onPlayerError = (event: any) => {
    console.error("YouTube player error:", event.data);
  }

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  }

  return (
    <div>
      <div id="ytplayer"></div>
      <Button onClick={togglePlay} disabled={!isReady} className='bg-red-200'>
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
    </div>
  )
}

export default MusicPlayer;