import React from 'react';

export interface OrbitalPulseProps {
  size?: number;
  accentColor?: string;
  label?: string;
  className?: string;
}

export const OrbitalPulse: React.FC<OrbitalPulseProps> = ({
  size = 160,
  accentColor = '#6366f1',
  label = 'SYNCING',
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes op-spin-cw {
          to { transform: rotate(360deg); }
        }
        @keyframes op-spin-ccw {
          to { transform: rotate(-360deg); }
        }
        @keyframes op-breathe {
          0%, 100% { transform: scale(0.88); opacity: 0.75; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .op-ring-outer, .op-ring-inner, .op-core {
          transform-origin: center;
        }
        @media (prefers-reduced-motion: no-preference) {
          .op-ring-outer { animation: op-spin-cw 4.5s linear infinite; }
          .op-ring-inner { animation: op-spin-ccw 2.8s linear infinite; }
          .op-core { animation: op-breathe 2.2s ease-in-out infinite; }
        }
      `}</style>

      <svg width={size} height={size} viewBox="0 0 160 160" fill="none">
        <defs>
          <radialGradient id="op-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="80" cy="80" r="64" fill="url(#op-glow)" />

        <g className="op-ring-outer">
          <circle
            cx="80"
            cy="80"
            r="60"
            stroke={accentColor}
            strokeOpacity="0.3"
            strokeWidth="2"
            strokeDasharray="12 10"
          />
          <circle cx="80" cy="20" r="5" fill="#38bdf8" />
          <circle cx="80" cy="140" r="4" fill={accentColor} />
        </g>

        <g className="op-ring-inner">
          <circle
            cx="80"
            cy="80"
            r="40"
            stroke="#a5b4fc"
            strokeOpacity="0.65"
            strokeWidth="2.5"
            strokeDasharray="48 28"
            strokeLinecap="round"
          />
          <circle cx="120" cy="80" r="4" fill="#f472b6" />
        </g>

        <circle className="op-core" cx="80" cy="80" r="18" fill={accentColor} />
      </svg>

      {label && (
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: '#cbd5e1',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default OrbitalPulse;
