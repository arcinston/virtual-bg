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
