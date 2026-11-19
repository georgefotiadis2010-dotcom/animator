import {
  AnimatableProp,
  EasingType,
  FrameCel,
  Keyframe,
  Layer,
} from '../types/animation';

export function applyEasing(t: number, easing: EasingType): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear':
      return clamped;
    case 'easeIn':
      return clamped * clamped * clamped;
    case 'easeOut':
      return 1 - Math.pow(1 - clamped, 3);
    case 'easeInOut':
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
    case 'spring': {
      const c4 = (2 * Math.PI) / 3;
      if (clamped === 0) return 0;
      if (clamped === 1) return 1;
      return (
        Math.pow(2, -10 * clamped) *
          Math.sin((clamped * 10 - 0.75) * c4) +
        1
      );
    }
    case 'bounce': {
      const n1 = 7.5625;
      const d1 = 2.75;
      let x = clamped;
      if (x < 1 / d1) {
        return n1 * x * x;
      } else if (x < 2 / d1) {
        x -= 1.5 / d1;
        return n1 * x * x + 0.75;
      } else if (x < 2.5 / d1) {
        x -= 2.25 / d1;
        return n1 * x * x + 0.9375;
      } else {
        x -= 2.625 / d1;
        return n1 * x * x + 0.984375;
      }
    }
  }
}

export function easingToCss(easing: EasingType): string {
  switch (easing) {
    case 'linear':
      return 'linear';
    case 'easeIn':
      return 'cubic-bezier(0.32, 0, 0.67, 0)';
    case 'easeOut':
      return 'cubic-bezier(0.33, 1, 0.68, 1)';
    case 'easeInOut':
      return 'cubic-bezier(0.65, 0, 0.35, 1)';
    case 'spring':
      return 'cubic-bezier(0.34, 1.56, 0.64, 1)';
    case 'bounce':
      return 'cubic-bezier(0.22, 1.4, 0.36, 1)';
  }
}

export function evaluateKeyframes(
  keyframes: Keyframe[] | undefined,
  fallback: number,
  time: number
): number {
  if (!keyframes || keyframes.length === 0) return fallback;
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].value;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const k0 = sorted[i];
    const k1 = sorted[i + 1];
    if (time >= k0.time && time <= k1.time) {
      const span = k1.time - k0.time;
      if (span <= 0) return k1.value;
      const rawT = (time - k0.time) / span;
      const easedT = applyEasing(rawT, k0.easing);
      return k0.value + (k1.value - k0.value) * easedT;
    }
  }
  return fallback;
}

export function evaluateLayerAtTime(
  layer: Layer,
  time: number
): Record<AnimatableProp, number> {
  const result = { ...layer.base };
  (Object.keys(layer.base) as AnimatableProp[]).forEach((prop) => {
    const kfs = layer.keyframes[prop];
    if (kfs && kfs.length > 0) {
      result[prop] = evaluateKeyframes(kfs, layer.base[prop], time);
    }
  });
  return result;
}

export function getFrameIndex(time: number, fps: number, duration: number): number {
  const totalFrames = Math.max(1, Math.round(duration * fps));
  const raw = Math.floor(time * fps);
  return Math.max(0, Math.min(totalFrames - 1, raw));
}

export function getCelForFrame(
  layer: Layer,
  frameIndex: number
): FrameCel | undefined {
  return layer.cels?.find((c) => c.frameIndex === frameIndex);
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
