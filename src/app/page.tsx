'use client';
import { useMedia } from '@/hooks/useMedia';
import { useSegmenter } from '@/hooks/useSegmenter';
import { useEffect, useRef } from 'react';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { videoSteam } = useMedia();
  const { segmenter, fps } = useSegmenter({
    backgroundConfig: {
      type: 'blur',
    },
    sourcePlayback: {
      htmlElement: videoRef.current!,
      height: videoRef.current?.videoHeight!,
      width: videoRef.current?.videoWidth!,
    },
    targetFps: 30,
  });

  useEffect(() => {
    if (videoSteam && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = videoSteam;
      videoRef.current.play();
    }
  }, [videoSteam, videoRef]);

  return (
    <div>
      <h1>Segmenter heloo</h1>
      <video ref={videoRef}></video>
      <h1>FPS:{fps}</h1>
      {/* <button onClick={segment}>Segment</button> */}
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
