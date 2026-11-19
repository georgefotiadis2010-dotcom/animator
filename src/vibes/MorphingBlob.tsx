import React from 'react';

export interface MorphingBlobProps {
  size?: number;
  className?: string;
}

export const MorphingBlob: React.FC<MorphingBlobProps> = ({
  size = 156,
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <style>{`
        @keyframes blob-morph {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: rotate(0deg) scale(1);
          }
          33% {
            border-radius: 35% 65% 60% 40% / 50% 60% 40% 50%;
            transform: rotate(120deg) scale(1.06);
          }
          66% {
            border-radius: 50% 50% 35% 65% / 35% 65% 55% 45%;
            transform: rotate(240deg) scale(0.96);
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          .vibe-blob {
            animation: blob-morph 7s ease-in-out infinite;
          }
        }
      `}</style>
      <div
        className="vibe-blob"
        style={{
          width: size * 0.78,
          height: size * 0.78,
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
          boxShadow: '0 14px 36px rgba(139, 92, 246, 0.45)',
        }}
      />
    </div>
  );
};

export default MorphingBlob;
