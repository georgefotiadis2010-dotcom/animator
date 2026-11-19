import React from 'react';
import OrbitalPulse from './OrbitalPulse';
import OrbitalPulseRaw from './OrbitalPulse.tsx?raw';
import HoloCard3D from './HoloCard3D';
import HoloCard3DRaw from './HoloCard3D.tsx?raw';
import MorphingBlob from './MorphingBlob';
import MorphingBlobRaw from './MorphingBlob.tsx?raw';
import ParticleBurst from './ParticleBurst';
import ParticleBurstRaw from './ParticleBurst.tsx?raw';

export interface VibeAnimationEntry {
  id: string;
  name: string;
  componentName: string;
  description: string;
  tags: string[];
  Component: React.FC;
  rawCode: string;
}

export const VIBE_ANIMATIONS: VibeAnimationEntry[] = [
  {
    id: 'orbital-pulse',
    name: 'Orbital Pulse Loader',
    componentName: 'OrbitalPulse',
    description:
      'Dual counter-rotating SVG rings with orbiting satellites and a breathing glow core.',
    tags: ['2D', 'SVG', 'Loader', 'UI'],
    Component: OrbitalPulse,
    rawCode: OrbitalPulseRaw,
  },
  {
    id: 'holo-card-3d',
    name: '3D Holographic Card',
    componentName: 'HoloCard3D',
    description:
      'Perspective 3D card with idle float, pointer-reactive tilt, and animated holographic sheen.',
    tags: ['3D', 'Interactive', 'UI'],
    Component: HoloCard3D,
    rawCode: HoloCard3DRaw,
  },
  {
    id: 'morphing-blob',
    name: 'Morphing Gradient Blob',
    componentName: 'MorphingBlob',
    description:
      'Organic fluid CSS border-radius morph with multi-stop gradient and soft glow.',
    tags: ['2D', 'CSS', 'UI'],
    Component: MorphingBlob,
    rawCode: MorphingBlobRaw,
  },
  {
    id: 'particle-burst',
    name: 'Particle Burst',
    componentName: 'ParticleBurst',
    description:
      'HTML5 Canvas particle celebration that auto-bursts on loop or wherever you click.',
    tags: ['Canvas', 'Interactive', '2D'],
    Component: ParticleBurst,
    rawCode: ParticleBurstRaw,
  },
];

export function buildAntigravityPrompt(entry: VibeAnimationEntry): string {
  return `Please add this "${entry.name}" animation into my app.
Create a file \`${entry.componentName}.tsx\` with the exact zero-dependency code below, and render \`<${entry.componentName} />\` where needed.

\`\`\`tsx
${entry.rawCode.trim()}
\`\`\`
`;
}
