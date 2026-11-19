import React, { useEffect, useRef } from 'react';

export interface ParticleBurstProps {
  width?: number;
  height?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const COLORS = ['#38bdf8', '#818cf8', '#f472b6', '#facc15', '#34d399'];

export const ParticleBurst: React.FC<ParticleBurstProps> = ({
  width = 240,
  height = 170,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spawnRef = useRef<((cx: number, cy: number) => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let particles: Particle[] = [];
    let rafId = 0;

    const spawnBurst = (cx: number, cy: number) => {
      for (let i = 0; i < 28; i++) {
        const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.25;
        const speed = 1.4 + Math.random() * 3.2;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          life: 0,
          maxLife: 42 + Math.random() * 24,
          size: 2.2 + Math.random() * 2.8,
          color: COLORS[i % COLORS.length],
        });
      }
    };

    spawnRef.current = spawnBurst;
    spawnBurst(width / 2, height / 2);

    if (prefersReduced) return;

    let frame = 0;
    const tick = () => {
      frame++;
      if (frame % 95 === 0) {
        spawnBurst(width / 2, height / 2);
      }

      ctx.clearRect(0, 0, width, height);
      particles = particles.filter((p) => p.life < p.maxLife);

      for (const p of particles) {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.985;
        const alpha = 1 - p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        spawnRef.current?.(e.clientX - r.left, e.clientY - r.top);
      }}
      title="Click anywhere to burst"
      style={{ cursor: 'pointer', display: 'block' }}
    />
  );
};

export default ParticleBurst;
