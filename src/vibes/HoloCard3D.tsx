import React, { useState } from 'react';

export interface HoloCard3DProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  className?: string;
}

export const HoloCard3D: React.FC<HoloCard3DProps> = ({
  title = 'VIBE MOTION',
  subtitle = 'Interactive 3D Card',
  badge = 'PRO',
  className,
}) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -py * 24, ry: px * 28, active: true });
  };

  return (
    <div
      className={className}
      style={{ perspective: 800, display: 'inline-block' }}
      onPointerMove={handleMove}
      onPointerLeave={() => setTilt({ rx: 0, ry: 0, active: false })}
    >
      <style>{`
        @keyframes holo-float {
          0%, 100% { transform: rotateX(6deg) rotateY(-10deg) translateY(0px); }
          50% { transform: rotateX(-6deg) rotateY(10deg) translateY(-8px); }
        }
        @keyframes holo-sheen {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .holo-idle { animation: holo-float 4.5s ease-in-out infinite; }
          .holo-sheen { animation: holo-sheen 5s ease infinite; }
        }
      `}</style>

      <div
        className={tilt.active ? '' : 'holo-idle'}
        style={{
          width: 220,
          height: 136,
          borderRadius: 16,
          padding: 16,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: tilt.active
            ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(1.03)`
            : undefined,
          transition: tilt.active ? 'transform 0.08s ease-out' : 'transform 0.4s ease',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)',
          border: '1px solid rgba(165, 180, 252, 0.35)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        <div
          className="holo-sheen"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(115deg, transparent 20%, rgba(56, 189, 248, 0.18) 45%, rgba(244, 114, 182, 0.18) 55%, transparent 80%)',
            backgroundSize: '200% 200%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', transform: 'translateZ(20px)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#a5b4fc' }}>
            {title}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(99, 102, 241, 0.35)',
              border: '1px solid rgba(165, 180, 252, 0.5)',
            }}
          >
            {badge}
          </span>
        </div>

        <div style={{ transform: 'translateZ(28px)' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{subtitle}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            Move cursor to tilt
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoloCard3D;
