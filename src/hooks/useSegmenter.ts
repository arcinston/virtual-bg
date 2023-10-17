import { BackgroundConfig, SourcePlayback } from '@/types';
import { initEngineAtom, segmenterEngineAtom } from '@/utils/Segmenter';
import { createTimerWorker } from '@/utils/timerHelper';
import { useAtomValue, useSetAtom } from 'jotai';

import { useEffect, useState } from 'react';

type useSegmenterProps = {
  sourcePlayback: SourcePlayback;
  backgroundConfig: BackgroundConfig;
  targetFps: number;
};

export const useSegmenter = (props: useSegmenterProps) => {
  const segmenter = useAtomValue(segmenterEngineAtom);
  const toggleEngine = useSetAtom(initEngineAtom);
  const [fps, setFps] = useState(0);
  const [pipeline, setPipeline] = useState<any | null>(null);

  useEffect(() => {
    if (!segmenter) {
      toggleEngine(true); // Initialize the engine if it's not already
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
      toggleEngine(false);
      timerWorker.clearTimeout(renderTimeoutId);
      timerWorker.terminate();
    };
  }, [
    props.sourcePlayback.htmlElement,
    props.targetFps,
    segmenter,
    toggleEngine,
  ]);

  return {
    segmenter,
    fps,
  };
};
