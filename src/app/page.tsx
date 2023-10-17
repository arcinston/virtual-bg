'use client';
import { useMedia } from '@/hooks/useMedia';
import { useSegmenter } from '@/hooks/useSegmenter';
import { useEffect, useRef } from 'react';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { videoSteam } = useMedia();
  const { segmenter, drawBokeh } = useSegmenter();

  useEffect(() => {
    if (videoSteam && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = videoSteam;
      videoRef.current.play();
    }
  }, [videoSteam, videoRef]);

  async function segment() {
    if (
      segmenter &&
      videoRef.current &&
      videoRef.current.videoWidth > 0 &&
      canvasRef.current
    ) {
      const segmentation = await segmenter.segmentPeople(videoRef.current);
      drawBokeh({
        canvas: canvasRef.current,
        segmentation,
        image: videoRef.current,
      });
    }
  }

  setInterval(segment, 1000 / 30);

  return (
    <div>
      <h1>Segmenter heloo</h1>
      <video ref={videoRef}></video>
      <button onClick={segment}>Segment</button>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
