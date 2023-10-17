import { BackgroundConfig, SourcePlayback } from '@/types';
import { createTimerWorker } from '@/utils/timerHelper';
import '@mediapipe/selfie_segmentation';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-core';
import { useEffect, useState } from 'react';

type useSegmenterProps = {
  sourcePlayback: SourcePlayback;
  backgroundConfig: BackgroundConfig;
  targetFps: number;
};

export const useSegmenter = (props: useSegmenterProps) => {
  const [segmenter, setSegmenter] =
    useState<bodySegmentation.BodySegmenter | null>(null);
  const [fps, setFps] = useState(0);

  const initSegmenter = async () => {
    console.log('segmenting');

    const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;

    const newSegementer = await bodySegmentation.createSegmenter(model, {
      runtime: 'mediapipe',
      solutionPath:
        'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
      modelType: 'general',
    });
    setSegmenter(newSegementer);
  };

  useEffect(() => {
    if (!segmenter) {
      initSegmenter();
    }

    const targetTimerTimeoutMs = 1000 / props.targetFps;

    let previousTime = 0;
    let beginTime = 0;
    let eventCount = 0;
    let frameCount = 0;
    const frameDurations: number[] = [];

    let renderTimeoutId: number;

    const timerWorker = createTimerWorker();

    async function render() {
      const startTime = performance.now();

      beginFrame();
      segmenter?.segmentPeople(props.sourcePlayback.htmlElement);
      addFrameEvent();
      endFrame();

      renderTimeoutId = timerWorker.setTimeout(
        render,
        Math.max(0, targetTimerTimeoutMs - (performance.now() - startTime))
      );
    }

    function beginFrame() {
      beginTime = Date.now();
    }

    function addFrameEvent() {
      const time = Date.now();
      frameDurations[eventCount] = time - beginTime;
      beginTime = time;
      eventCount++;
    }

    function endFrame() {
      const time = Date.now();
      frameDurations[eventCount] = time - beginTime;
      frameCount++;
      if (time >= previousTime + 1000) {
        setFps((frameCount * 1000) / (time - previousTime));
        previousTime = time;
        frameCount = 0;
      }
      eventCount = 0;
    }

    render();

    return () => {
      segmenter?.dispose();
      timerWorker.clearTimeout(renderTimeoutId);
      timerWorker.terminate();
    };
  }, [props.sourcePlayback.htmlElement, props.targetFps, segmenter]);

  return {
    segmenter,
    fps,
  };
};
