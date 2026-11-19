import {
  AnimatableProp,
  AnimationProject,
  EasingType,
  Keyframe,
  Layer,
} from '../types/animation';
import {
  easingToCss,
  evaluateLayerAtTime,
  getCelForFrame,
  getFrameIndex,
} from './interpolation';

function toPascalCase(name: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return cleaned || 'CustomAnimation';
}

export function generateReactComponent(project: AnimationProject): string {
  const compName = `${toPascalCase(project.name)}Animation`;
  const compactProject = {
    width: project.width,
    height: project.height,
    duration: project.duration,
    fps: project.fps,
    loop: project.loop,
    background: project.background,
    perspective: project.perspective,
    layers: project.layers.filter((l) => l.visible),
  };

  return `import React, { useEffect, useRef, useState } from 'react';

export interface ${compName}Props {
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
}

const ANIMATION_DATA = ${JSON.stringify(compactProject, null, 2)} as const;

type EasingName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring' | 'bounce';

function applyEasing(t: number, easing: EasingName): number {
  const c = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear': return c;
    case 'easeIn': return c * c * c;
    case 'easeOut': return 1 - Math.pow(1 - c, 3);
    case 'easeInOut': return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
    case 'spring': {
      if (c === 0 || c === 1) return c;
      return Math.pow(2, -10 * c) * Math.sin((c * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    }
    case 'bounce': {
      const n1 = 7.5625, d1 = 2.75;
      let x = c;
      if (x < 1 / d1) return n1 * x * x;
      if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
      if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  }
}

function evalTrack(kfs: readonly { time: number; value: number; easing: string }[] | undefined, fallback: number, t: number): number {
  if (!kfs || kfs.length === 0) return fallback;
  const sorted = [...kfs].sort((a, b) => a.time - b.time);
  if (t <= sorted[0].time) return sorted[0].value;
  if (t >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (t >= a.time && t <= b.time) {
      const span = b.time - a.time;
      if (span <= 0) return b.value;
      return a.value + (b.value - a.value) * applyEasing((t - a.time) / span, a.easing as EasingName);
    }
  }
  return fallback;
}

export const ${compName}: React.FC<${compName}Props> = ({
  className,
  autoPlay = true,
  loop = ANIMATION_DATA.loop,
  speed = 1,
}) => {
  const [time, setTime] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!autoPlay || prefersReduced) return;

    let last = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setTime((prev) => {
        const next = prev + dt;
        if (next >= ANIMATION_DATA.duration) {
          return loop ? next % ANIMATION_DATA.duration : ANIMATION_DATA.duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [autoPlay, loop, speed]);

  const frameIdx = Math.floor(time * ANIMATION_DATA.fps);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: ANIMATION_DATA.width,
        height: ANIMATION_DATA.height,
        background: ANIMATION_DATA.background,
        perspective: ANIMATION_DATA.perspective,
        overflow: 'hidden',
      }}
    >
      {ANIMATION_DATA.layers.map((layer) => {
        const kf = layer.keyframes as Record<string, readonly { time: number; value: number; easing: string }[] | undefined>;
        const x = evalTrack(kf.x, layer.base.x, time);
        const y = evalTrack(kf.y, layer.base.y, time);
        const z = evalTrack(kf.z, layer.base.z, time);
        const w = evalTrack(kf.width, layer.base.width, time);
        const h = evalTrack(kf.height, layer.base.height, time);
        const sx = evalTrack(kf.scaleX, layer.base.scaleX, time);
        const sy = evalTrack(kf.scaleY, layer.base.scaleY, time);
        const rot = evalTrack(kf.rotate, layer.base.rotate, time);
        const rx = evalTrack(kf.rotateX, layer.base.rotateX, time);
        const ry = evalTrack(kf.rotateY, layer.base.rotateY, time);
        const op = evalTrack(kf.opacity, layer.base.opacity, time);
        const br = evalTrack(kf.borderRadius, layer.base.borderRadius, time);

        const transform = \`translate3d(\${x - w / 2}px, \${y - h / 2}px, \${z}px) rotateX(\${rx}deg) rotateY(\${ry}deg) rotate(\${rot}deg) scale(\${sx}, \${sy})\`;

        if (layer.type === 'framebyframe') {
          const cel = (layer as { cels?: readonly { frameIndex: number; strokes: readonly { id: string; color: string; size: number; points: readonly { x: number; y: number }[] }[] }[] }).cels?.find((c) => c.frameIndex === frameIdx);
          return (
            <svg
              key={layer.id}
              width={ANIMATION_DATA.width}
              height={ANIMATION_DATA.height}
              style={{ position: 'absolute', inset: 0, opacity: op, pointerEvents: 'none' }}
            >
              {cel?.strokes.map((st) => (
                <polyline
                  key={st.id}
                  fill="none"
                  stroke={st.color}
                  strokeWidth={st.size}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={st.points.map((p) => \`\${p.x},\${p.y}\`).join(' ')}
                />
              ))}
            </svg>
          );
        }

        if (layer.type === 'star') {
          return (
            <svg
              key={layer.id}
              viewBox="0 0 100 100"
              style={{
                position: 'absolute',
                width: w,
                height: h,
                opacity: op,
                transform,
                filter: layer.shadowBlur > 0 ? \`drop-shadow(0 0 \${layer.shadowBlur / 2}px \${layer.shadowColor})\` : undefined,
              }}
            >
              <polygon
                points="50,5 63,36 96,38 70,59 79,92 50,73 21,92 30,59 4,38 37,36"
                fill={layer.fill}
                stroke={layer.stroke}
                strokeWidth={layer.strokeWidth * 2}
              />
            </svg>
          );
        }

        if (layer.type === 'text') {
          return (
            <div
              key={layer.id}
              style={{
                position: 'absolute',
                width: w,
                height: h,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: layer.fill,
                fontSize: (layer as { fontSize?: number }).fontSize ?? 18,
                fontWeight: 700,
                opacity: op,
                transform,
                whiteSpace: 'nowrap',
              }}
            >
              {(layer as { text?: string }).text ?? 'Text'}
            </div>
          );
        }

        return (
          <div
            key={layer.id}
            style={{
              position: 'absolute',
              width: w,
              height: h,
              background: layer.fill,
              border: layer.strokeWidth > 0 ? \`\${layer.strokeWidth}px solid \${layer.stroke}\` : undefined,
              borderRadius: layer.type === 'circle' ? '9999px' : br,
              opacity: op,
              transform,
              boxShadow: layer.shadowBlur > 0 ? \`0 8px \${layer.shadowBlur}px \${layer.shadowColor}\` : undefined,
            }}
          />
        );
      })}
    </div>
  );
};
`;
}

export function generateAntigravityBundle(project: AnimationProject): string {
  const compName = `${toPascalCase(project.name)}Animation`;
  const reactCode = generateReactComponent(project);
  return `Please add this self-contained "${project.name}" animation into my app.
Create a component file \`${compName}.tsx\` with the exact code below (it has zero external dependencies, supports 2D/3D/frame-by-frame layers, and respects prefers-reduced-motion), and render \`<${compName} />\` where needed.

\`\`\`tsx
${reactCode.trim()}
\`\`\`
`;
}

export function generateHtmlCss(project: AnimationProject): string {
  const duration = project.duration || 1;
  const iter = project.loop ? 'infinite' : '1 forwards';
  const cssRules: string[] = [];
  const htmlEls: string[] = [];

  project.layers
    .filter((l) => l.visible && l.type !== 'framebyframe')
    .forEach((layer, idx) => {
      const cls = `anim-layer-${idx}`;
      const animName = `kf-${idx}`;
      const sampleTimes = new Set<number>([0, duration]);
      (Object.values(layer.keyframes) as (Keyframe[] | undefined)[]).forEach(
        (arr) => arr?.forEach((k) => sampleTimes.add(k.time))
      );
      const sortedTimes = [...sampleTimes].sort((a, b) => a - b);
      const steps = sortedTimes.map((t) => {
        const pct = Math.round((t / duration) * 100);
        const v = evaluateLayerAtTime(layer, t);
        const tf = `translate3d(${v.x - v.width / 2}px, ${v.y - v.height / 2}px, ${v.z}px) rotateX(${v.rotateX}deg) rotateY(${v.rotateY}deg) rotate(${v.rotate}deg) scale(${v.scaleX}, ${v.scaleY})`;
        return `  ${pct}% {\n    transform: ${tf};\n    opacity: ${v.opacity.toFixed(2)};\n    border-radius: ${layer.type === 'circle' ? '9999px' : `${v.borderRadius}px`};\n  }`;
      });

      const firstEasing: EasingType =
        Object.values(layer.keyframes).flat()[0]?.easing ?? 'easeInOut';

      cssRules.push(`@keyframes ${animName} {\n${steps.join('\n')}\n}`);
      cssRules.push(`.${cls} {
  position: absolute;
  width: ${layer.base.width}px;
  height: ${layer.base.height}px;
  background: ${layer.type === 'text' || layer.type === 'star' ? 'transparent' : layer.fill};
  border: ${layer.strokeWidth > 0 && layer.type !== 'star' ? `${layer.strokeWidth}px solid ${layer.stroke}` : 'none'};
  color: ${layer.fill};
  font-size: ${layer.fontSize ?? 18}px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${layer.shadowBlur > 0 && layer.type !== 'star' ? `0 8px ${layer.shadowBlur}px ${layer.shadowColor}` : 'none'};
}
@media (prefers-reduced-motion: no-preference) {
  .${cls} {
    animation: ${animName} ${duration}s ${easingToCss(firstEasing)} ${iter};
  }
}`);

      if (layer.type === 'text') {
        htmlEls.push(`  <div class="${cls}">${layer.text ?? 'Text'}</div>`);
      } else if (layer.type === 'star') {
        htmlEls.push(
          `  <svg class="${cls}" viewBox="0 0 100 100"><polygon points="50,5 63,36 96,38 70,59 79,92 50,73 21,92 30,59 4,38 37,36" fill="${layer.fill}" stroke="${layer.stroke}" stroke-width="${layer.strokeWidth * 2}"/></svg>`
        );
      } else {
        htmlEls.push(`  <div class="${cls}"></div>`);
      }
    });

  return `<!-- ${project.name} — Pure HTML + CSS -->
<style>
.anim-stage {
  position: relative;
  width: ${project.width}px;
  height: ${project.height}px;
  background: ${project.background};
  perspective: ${project.perspective}px;
  overflow: hidden;
}
${cssRules.join('\n\n')}
</style>

<div class="anim-stage">
${htmlEls.join('\n')}
</div>`;
}

function hexToLottieRgba(color: string): [number, number, number, number] {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;
    return [r || 0, g || 0, b || 0, 1];
  }
  return [0.39, 0.4, 0.95, 1];
}

export function generateLottieJson(project: AnimationProject): string {
  const fps = project.fps || 60;
  const op = Math.max(1, Math.round(project.duration * fps));

  const mapTrack = (
    layer: Layer,
    prop: AnimatableProp,
    transformVal: (v: number) => number | number[]
  ) => {
    const kfs = layer.keyframes[prop];
    if (!kfs || kfs.length === 0) {
      return { a: 0, k: transformVal(layer.base[prop]) };
    }
    const sorted = [...kfs].sort((a, b) => a.time - b.time);
    return {
      a: 1,
      k: sorted.map((k, idx) => {
        const next = sorted[idx + 1];
        const val = transformVal(k.value);
        if (!next) {
          return { t: Math.round(k.time * fps), s: Array.isArray(val) ? val : [val] };
        }
        const nextVal = transformVal(next.value);
        return {
          t: Math.round(k.time * fps),
          s: Array.isArray(val) ? val : [val],
          e: Array.isArray(nextVal) ? nextVal : [nextVal],
          i: { x: [0.42], y: [1] },
          o: { x: [0.58], y: [0] },
        };
      }),
    };
  };

  const lottieLayers = project.layers
    .filter((l) => l.visible && l.type !== 'framebyframe')
    .map((layer, idx) => {
      const w = layer.base.width;
      const h = layer.base.height;
      const shapeItem =
        layer.type === 'circle'
          ? {
              ty: 'el',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [w, h] },
              nm: 'Ellipse',
            }
          : layer.type === 'star'
          ? {
              ty: 'sr',
              sy: 1,
              pt: { a: 0, k: 5 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: w * 0.22 },
              or: { a: 0, k: w * 0.5 },
              nm: 'Star',
            }
          : {
              ty: 'rc',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [w, h] },
              r: { a: 0, k: layer.base.borderRadius },
              nm: 'Rect',
            };

      return {
        ddd: 0,
        ind: idx + 1,
        ty: 4,
        nm: layer.name,
        sr: 1,
        ks: {
          o: mapTrack(layer, 'opacity', (v) => v * 100),
          r: mapTrack(layer, 'rotate', (v) => v),
          p: {
            a: layer.keyframes.x || layer.keyframes.y ? 1 : 0,
            k:
              layer.keyframes.x || layer.keyframes.y
                ? [0, project.duration].map((t, i) => {
                    const ev = evaluateLayerAtTime(layer, t);
                    return i === 0
                      ? {
                          t: 0,
                          s: [ev.x, ev.y, 0],
                          e: [
                            evaluateLayerAtTime(layer, project.duration).x,
                            evaluateLayerAtTime(layer, project.duration).y,
                            0,
                          ],
                          i: { x: 0.42, y: 1 },
                          o: { x: 0.58, y: 0 },
                        }
                      : { t: op, s: [ev.x, ev.y, 0] };
                  })
                : [layer.base.x, layer.base.y, 0],
          },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 0,
            k: [layer.base.scaleX * 100, layer.base.scaleY * 100, 100],
          },
        },
        shapes: [
          {
            ty: 'gr',
            nm: 'Group',
            it: [
              shapeItem,
              {
                ty: 'fl',
                c: { a: 0, k: hexToLottieRgba(layer.fill) },
                o: { a: 0, k: 100 },
                nm: 'Fill',
              },
              {
                ty: 'tr',
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 },
              },
            ],
          },
        ],
        ip: 0,
        op,
        st: 0,
      };
    });

  return JSON.stringify(
    {
      v: '5.7.4',
      fr: fps,
      ip: 0,
      op,
      w: project.width,
      h: project.height,
      nm: project.name,
      ddd: 0,
      assets: [],
      layers: lottieLayers,
    },
    null,
    2
  );
}

export function renderProjectToCanvas(
  ctx: CanvasRenderingContext2D,
  project: AnimationProject,
  time: number
) {
  ctx.clearRect(0, 0, project.width, project.height);
  if (project.background && project.background !== 'transparent') {
    ctx.fillStyle = project.background;
    ctx.fillRect(0, 0, project.width, project.height);
  }

  const frameIdx = getFrameIndex(time, project.fps, project.duration);

  for (const layer of project.layers) {
    if (!layer.visible) continue;
    const v = evaluateLayerAtTime(layer, time);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, v.opacity));

    if (layer.type === 'framebyframe') {
      const cel = getCelForFrame(layer, frameIdx);
      if (cel) {
        for (const st of cel.strokes) {
          if (st.points.length < 2) continue;
          ctx.beginPath();
          ctx.strokeStyle = st.color;
          ctx.lineWidth = st.size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(st.points[0].x, st.points[0].y);
          for (let i = 1; i < st.points.length; i++) {
            ctx.lineTo(st.points[i].x, st.points[i].y);
          }
          ctx.stroke();
        }
      }
      ctx.restore();
      continue;
    }

    ctx.translate(v.x, v.y);
    ctx.rotate((v.rotate * Math.PI) / 180);
    ctx.scale(v.scaleX, v.scaleY);

    if (layer.shadowBlur > 0) {
      ctx.shadowBlur = layer.shadowBlur;
      ctx.shadowColor = layer.shadowColor;
    }

    if (layer.type === 'circle') {
      ctx.beginPath();
      ctx.ellipse(0, 0, v.width / 2, v.height / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = layer.fill;
      ctx.fill();
      if (layer.strokeWidth > 0) {
        ctx.lineWidth = layer.strokeWidth;
        ctx.strokeStyle = layer.stroke;
        ctx.stroke();
      }
    } else if (layer.type === 'rect') {
      const r = Math.min(v.borderRadius, v.width / 2, v.height / 2);
      ctx.beginPath();
      ctx.roundRect(-v.width / 2, -v.height / 2, v.width, v.height, r);
      ctx.fillStyle = layer.fill;
      ctx.fill();
      if (layer.strokeWidth > 0) {
        ctx.lineWidth = layer.strokeWidth;
        ctx.strokeStyle = layer.stroke;
        ctx.stroke();
      }
    } else if (layer.type === 'star') {
      const outer = Math.min(v.width, v.height) / 2;
      const inner = outer * 0.42;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = layer.fill;
      ctx.fill();
      if (layer.strokeWidth > 0) {
        ctx.lineWidth = layer.strokeWidth;
        ctx.strokeStyle = layer.stroke;
        ctx.stroke();
      }
    } else if (layer.type === 'text') {
      ctx.fillStyle = layer.fill;
      ctx.font = `700 ${layer.fontSize ?? 18}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(layer.text ?? 'Text', 0, 0);
    }

    ctx.restore();
  }
}

export function exportFramePng(project: AnimationProject, time: number) {
  const canvas = document.createElement('canvas');
  canvas.width = project.width;
  canvas.height = project.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  renderProjectToCanvas(ctx, project, time);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-frame.png`;
  a.click();
}

export async function exportWebmVideo(project: AnimationProject): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = project.width;
  canvas.height = project.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const stream = canvas.captureStream(project.fps);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    };

    recorder.start();
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (elapsed >= project.duration) {
        renderProjectToCanvas(ctx, project, project.duration);
        recorder.stop();
        return;
      }
      renderProjectToCanvas(ctx, project, elapsed);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
