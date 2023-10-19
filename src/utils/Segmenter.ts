import '@mediapipe/selfie_segmentation';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-core';
import { atom } from 'jotai';

export type TSegmenterEngine = bodySegmentation.BodySegmenter;

export let segmenterEngineAtom = atom<TSegmenterEngine | null>(null);

const engineLoading = atom<boolean>(false);

let segmenterInstance: TSegmenterEngine | null = null;

export const initEngineAtom = atom(null, async (get, set, toggle: boolean) => {
  if (toggle && segmenterInstance) {
    // If toggle is true and an instance already exists, no need to reinitialize
    return;
  }

  if (!toggle && segmenterInstance) {
    // If toggle is false and an instance exists, dispose of the current instance
    segmenterInstance.dispose();
    segmenterInstance = null;
    set(segmenterEngineAtom, null);
    console.log('Segmenter Engine Disposed');
    return;
  }

  if (segmenterInstance) {
    // If an instance already exists, no need to reinitialize
    return;
  }

  // Proceed with initialization if no instance exists
  const isLoading = get(engineLoading);
  if (isLoading) {
    return;
  }

  try {
    set(engineLoading, true);

    const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;

    segmenterInstance = await bodySegmentation.createSegmenter(model, {
      runtime: 'mediapipe',
      solutionPath:
        'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
      modelType: 'general',
    });

    console.log('Segmenter Engine Initialized');
    set(segmenterEngineAtom, segmenterInstance);
  } catch (error) {
    console.error('Error initializing segmenter engine', error);
    // handle error appropriately
  } finally {
    set(engineLoading, false);
  }
});
