export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring'
  | 'bounce';

export type AnimatableProp =
  | 'x'
  | 'y'
  | 'z'
  | 'scaleX'
  | 'scaleY'
  | 'rotate'
  | 'rotateX'
  | 'rotateY'
  | 'opacity'
  | 'borderRadius'
  | 'width'
  | 'height';

export interface Keyframe {
  id: string;
  time: number; // seconds
  value: number;
  easing: EasingType;
}

export type LayerType =
  | 'rect'
  | 'circle'
  | 'star'
  | 'text'
  | 'framebyframe';

export interface CelStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

export interface FrameCel {
  frameIndex: number;
  strokes: CelStroke[];
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  shadowBlur: number;
  shadowColor: string;
  base: Record<AnimatableProp, number>;
  keyframes: Partial<Record<AnimatableProp, Keyframe[]>>;
  cels?: FrameCel[];
}

export interface AnimationProject {
  id: string;
  name: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  loop: boolean;
  background: string;
  perspective: number;
  layers: Layer[];
}

export const DEFAULT_LAYER_BASE: Record<AnimatableProp, number> = {
  x: 0,
  y: 0,
  z: 0,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  opacity: 1,
  borderRadius: 16,
  width: 120,
  height: 120,
};

export const ANIMATABLE_PROP_META: {
  key: AnimatableProp;
  label: string;
  step: number;
  min?: number;
  max?: number;
  unit?: string;
}[] = [
  { key: 'x', label: 'X', step: 1, unit: 'px' },
  { key: 'y', label: 'Y', step: 1, unit: 'px' },
  { key: 'z', label: 'Z (3D)', step: 1, unit: 'px' },
  { key: 'width', label: 'W', step: 1, min: 4, max: 1200, unit: 'px' },
  { key: 'height', label: 'H', step: 1, min: 4, max: 1200, unit: 'px' },
  { key: 'scaleX', label: 'Scale X', step: 0.05, min: 0, max: 5 },
  { key: 'scaleY', label: 'Scale Y', step: 0.05, min: 0, max: 5 },
  { key: 'rotate', label: 'Rotate', step: 1, unit: '°' },
  { key: 'rotateX', label: 'Rotate X (3D)', step: 1, unit: '°' },
  { key: 'rotateY', label: 'Rotate Y (3D)', step: 1, unit: '°' },
  { key: 'opacity', label: 'Opacity', step: 0.05, min: 0, max: 1 },
  { key: 'borderRadius', label: 'Radius', step: 1, min: 0, max: 300, unit: 'px' },
];
