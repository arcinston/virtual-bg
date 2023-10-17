import { useEffect, useState } from 'react';

export const useMedia = () => {
  const [videoSteam, setVideoStream] = useState<MediaStream | null>(null);
  let isLoading = false;
  const getVideo = async () => {
    const video = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    setVideoStream(video);
    isLoading = false;
  };

  useEffect(() => {
    getVideo();
  }, []);

  return { videoSteam, getVideo };
};
