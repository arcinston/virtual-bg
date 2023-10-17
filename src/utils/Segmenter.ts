import '@mediapipe/selfie_segmentation';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-core';
import { atom } from 'jotai';

export type TSegmenterEngine = bodySegmentation.BodySegmenter;

export let segmenterEngineAtom = atom<TSegmenterEngine | null>(null);

const engineLoading = atom<boolean>(false);

export const initEngineAtom = atom(null, async (get, set, toggle: boolean) => {
  const isLoading = get(engineLoading);
  if (isLoading) {
    return;
  }
  set(engineLoading, true);
  const engine = get(segmenterEngineAtom);
  if (!toggle && engine) {
    engine.dispose();
    set(segmenterEngineAtom, null);
    set(engineLoading, false);
    return;
  }

  if (engine) {
    set(engineLoading, false);
    return;
  }

  const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;

  const newSegementer = await bodySegmentation.createSegmenter(model, {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
    modelType: 'general',
  });

  console.log('Segmenter Engine Initialized');
  set(segmenterEngineAtom, newSegementer);
  set(engineLoading, false);
});
