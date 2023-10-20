import { buildWebGlPipeline } from '@/pipeline/webglPipeline';
import { BackgroundConfig, SourcePlayback } from '@/types';
import { initEngineAtom, segmenterEngineAtom } from '@/utils/Segmenter';
import { createTimerWorker } from '@/utils/timerHelper';
import { useAtomValue, useSetAtom } from 'jotai';

import { useCallback, useEffect, useRef, useState } from 'react';

type useSegmenterProps = {
  sourcePlayback: SourcePlayback;
  backgroundConfig: BackgroundConfig;
  targetFps: number;
};

export const useSegmenter = (props: useSegmenterProps) => {
  const segmenter = useAtomValue(segmenterEngineAtom);
  const toggleEngine = useSetAtom(initEngineAtom);
  const [fps, setFps] = useState(0);
  const isMounted = useRef(true);
  const backgroundImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const [pipeline, setPipeline] = useState<any>(null);

  const cleanUpPipeline = useCallback(() => {
    if (pipeline) {
      pipeline.cleanUp();
      setPipeline(null);
    }
  }, [pipeline]);

  useEffect(() => {
    console.log('useSegmenter.ts: useSegmenter()');
    console.log('isMounted.current: ', isMounted.current);
    if (!segmenter) {
      toggleEngine(true);
    }

    if (!segmenter || !isMounted.current) {
      return;
    }
    const targetTimerTimeoutMs = 1000 / props.targetFps;

    let previousTime = 0;
    let beginTime = 0;
    let eventCount = 0;
    let frameCount = 0;
    const frameDurations: number[] = [];

    let renderTimeoutId: number;

    const timerWorker = createTimerWorker();

    const newPipeline = buildWebGlPipeline(
      props.sourcePlayback,
      props.backgroundConfig,
      backgroundImageRef.current,
      canvasRef.current,
      timerWorker,
      addFrameEvent,
      segmenter
    );

    async function render() {
      if (!isMounted.current) {
        return;
      }
      const startTime = performance.now();

      beginFrame();

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

    if (newPipeline !== undefined && isMounted.current) {
      setPipeline(newPipeline);
    }

    return () => {
      timerWorker.clearTimeout(renderTimeoutId);
      timerWorker.terminate();
      cleanUpPipeline();
      isMounted.current = false;
      console.log('useSegmenter.ts: useSegmenter()');
      console.log('isMounted.current: ', isMounted.current);
      if (segmenter) {
        toggleEngine(false);
      }
    };
  }, [segmenter]);

  return {
    backgroundImageRef,
    segmenter,
    fps,
    pipeline,
    canvasRef,
  };
};
