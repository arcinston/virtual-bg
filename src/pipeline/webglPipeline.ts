import { BackgroundConfig, SourcePlayback } from '@/types';
import { TSegmenterEngine } from '@/utils/Segmenter';
import { TimerWorker } from '@/utils/timerHelper';
import { buildBackgroundImageStage } from './backgroundImageStage';
import { compileShader, createTexture, glsl } from './webglHelper';

export const buildWebGlPipeline = (
  sourcePlayback: SourcePlayback,
  backgroundConfig: BackgroundConfig,
  backgroundImage: HTMLImageElement | null,
  canvas: HTMLCanvasElement,
  timerWorker: TimerWorker,
  addFrameEvent: () => void,
  segmenterEngine: TSegmenterEngine
) => {
  const vertexShaderSource = glsl`#version 300 es

    in vec2 a_position;
    in vec2 a_texCoord;

    out vec2 v_texCoord;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  const { width: frameWidth, height: frameHeight } = sourcePlayback;
  const [segmentationWidth, segmentationHeight] = [256, 256];

  const gl = canvas.getContext('webgl2');
  if (gl === null) {
    // Handle the lack of WebGL2 support.
    console.error('WebGL 2 is not available in your browser.');
    return;
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

  const vertexArray = gl.createVertexArray();
  gl.bindVertexArray(vertexArray);

  const positionBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
    gl.STATIC_DRAW
  );

  const texCoordBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]),
    gl.STATIC_DRAW
  );

  // We don't use texStorage2D here because texImage2D seems faster
  // to upload video texture than texSubImage2D even though the latter
  // is supposed to be the recommended way:
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#use_texstorage_to_create_textures
  const inputFrameTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, inputFrameTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // TODO Rename segmentation and person mask to be more specific
  const segmentationTexture = createTexture(
    gl,
    gl.RGBA8,
    segmentationWidth,
    segmentationHeight
  )!;
  const personMaskTexture = createTexture(
    gl,
    gl.RGBA8,
    frameWidth,
    frameHeight
  )!;

  const backgroundStage = buildBackgroundImageStage(
    gl,
    positionBuffer,
    texCoordBuffer,
    personMaskTexture,
    backgroundImage,
    canvas
  );

  async function render() {
    if (gl === null) {
      // Handle the lack of WebGL2 support.
      console.error('WebGL 2 is not available in your browser.');
      return;
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputFrameTexture);

    // texImage2D seems faster than texSubImage2D to upload
    // video texture
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sourcePlayback.htmlElement
    );

    gl.bindVertexArray(vertexArray);

    addFrameEvent();

    const segment = await segmenterEngine.segmentPeople(
      sourcePlayback.htmlElement
    );

    addFrameEvent();

    backgroundStage.render();
  }

  function cleanUp() {
    if (gl === null) {
      // Handle the lack of WebGL2 support.
      console.error('WebGL 2 is not available in your browser.');
      return;
    }

    backgroundStage.cleanUp();

    gl.deleteTexture(personMaskTexture);
    gl.deleteTexture(segmentationTexture);
    gl.deleteTexture(inputFrameTexture);
    gl.deleteBuffer(texCoordBuffer);
    gl.deleteBuffer(positionBuffer);
    gl.deleteVertexArray(vertexArray);
    gl.deleteShader(vertexShader);
  }

  return { render, cleanUp };
};
