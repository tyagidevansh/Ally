import React, { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button';
import { Pause, Play } from 'lucide-react';

interface MusicPlayerProps {
  videoId: string;
  title: string;
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

const MusicPlayer = ({ videoId, title }: MusicPlayerProps) => {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializePlayer = async () => {
      await loadYouTubeAPI();
      
      if (isMounted && !playerRef.current) {
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
            'onReady': () => {
              setIsReady(true);
              console.log("Player is ready");
            },
            'onError': (event: any) => {
              console.error("YouTube player error:", event.data);
            },
          }
        });
      }
    };

    initializePlayer();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isReady && playerRef.current) {
      playerRef.current.loadVideoById({
        videoId: videoId,
        startSeconds: 0,
        suggestedQuality: 'default'
      });
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [videoId, isReady, isPlaying]);

  const togglePlay = () => {
    if (playerRef.current && isReady) {
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
      <div className='flex flex-col items-center bg-white/10 backdrop-blur-md text-white p-4 rounded-lg shadow-md'>
        <h2 className='text-lg font-semibold mb-2'>{title}</h2>
        <Button 
          onClick={togglePlay} 
          disabled={!isReady} 
          className='flex items-center justify-center text-white bg-white/10 backdrop-blur-md hover:bg-white/30'
        >
          {isPlaying ? <Pause/> : <Play/>}
        </Button>
      </div>
    </div>
  )
}

export default MusicPlayer;