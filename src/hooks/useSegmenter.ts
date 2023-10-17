import '@mediapipe/selfie_segmentation';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import { Segmentation } from '@tensorflow-models/body-segmentation/dist/shared/calculators/interfaces/common_interfaces';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-core';
import { useEffect, useState } from 'react';

export type BackgroundConfig = {
  type: 'none' | 'blur' | 'image';
  url?: string;
};

export type SourcePlayback = {
  htmlElement: HTMLImageElement | HTMLVideoElement;
  width: number;
  height: number;
};

export type BlendMode = 'screen' | 'linearDodge';

export const useSegmenter = () => {
  const [segmenter, setSegmenter] = useState<bodySegmentation.BodySegmenter>();
  const foregroundThreshold = 0.5;
  const backgroundBlurAmount = 3;
  const edgeBlurAmount = 3;
  const flipHorizontal = false;
  let isLoading: boolean = false;

  const initSegmenter = async () => {
    if (isLoading) return;
    isLoading = true;
    console.log('initSegmenter');
    const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
    const newSegmenter = await bodySegmentation.createSegmenter(model, {
      runtime: 'mediapipe',
      solutionPath:
        'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
      modelType: 'general',
    });

    setSegmenter(newSegmenter);
    isLoading = false;
  };

  useEffect(() => {
    initSegmenter();
    return () => {
      segmenter?.dispose();
    };
  }, []);

  const drawBokeh = async (data: {
    canvas: HTMLCanvasElement;
    image: HTMLImageElement | HTMLVideoElement;
    segmentation: Segmentation | Segmentation[];
  }) => {
    await bodySegmentation.drawBokehEffect(
      data.canvas,
      data.image,
      data.segmentation,
      foregroundThreshold,
      backgroundBlurAmount,
      edgeBlurAmount,
      flipHorizontal
    );
  };

  return {
    segmenter,
    initSegmenter,
    drawBokeh,
  };
};
