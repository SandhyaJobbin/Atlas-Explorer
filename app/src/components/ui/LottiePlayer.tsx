import React from 'react';
import { publicAsset } from '@/lib/assets';

interface LottiePlayerProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  fallback?: React.ReactNode;
}

const CONFETTI_COLORS = ['#FF9900', '#00A8A2', '#232F3E', '#FEBD69', '#35D07F', '#FF6577'];

const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: (i * 37) % 100,
  delay: (i % 9) * 0.12,
  duration: 1.6 + (i % 5) * 0.18,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 5 + (i % 4) * 2,
  isRect: i % 2 === 0,
}));

const SRC_MAP: Record<string, string> = {
  'assets/lottie/globe.json': '/assets/stickers/compass-spin.gif',
  '/assets/lottie/globe.json': '/assets/stickers/compass-spin.gif',
  'assets/lottie/level-up.json': '/assets/stickers/star-sparkle.gif',
  '/assets/lottie/level-up.json': '/assets/stickers/star-sparkle.gif',
  'assets/lottie/trophy.json': '/assets/stickers/trophy.gif',
  '/assets/lottie/trophy.json': '/assets/stickers/trophy.gif',
  'assets/lottie/flag-plant.json': '/assets/stickers/checkmark.gif',
  '/assets/lottie/flag-plant.json': '/assets/stickers/checkmark.gif',
};

const CONFETTI_SOURCES = new Set(['assets/lottie/confetti.json', '/assets/lottie/confetti.json']);

const resolveAssetSrc = (src: string) => {
  const mappedSrc = SRC_MAP[src];
  const assetPath = mappedSrc ?? src;
  if (/^(https?:)?\/\//.test(assetPath) || assetPath.startsWith('data:')) return assetPath;
  return publicAsset(assetPath);
};

export const LottiePlayer: React.FC<LottiePlayerProps> = ({
  src,
  className = '',
  autoplay = true,
  fallback = '*',
}) => {
  if (CONFETTI_SOURCES.has(src)) {
    return (
      <div className={`lottie-container relative overflow-hidden ${className}`} aria-hidden="true">
        {autoplay ? (
          CONFETTI.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-[-10px]"
              style={{
                left: `${piece.x}%`,
                width: piece.size,
                height: piece.isRect ? piece.size * 0.5 : piece.size,
                backgroundColor: piece.color,
                borderRadius: piece.isRect ? 2 : '50%',
                animation: `confettiFall ${piece.duration}s ${piece.delay}s ease-in infinite`,
              }}
            />
          ))
        ) : (
          <div className="lottie-fallback absolute inset-0 flex items-center justify-center pointer-events-none">
            {fallback}
          </div>
        )}
      </div>
    );
  }

  const assetSrc = resolveAssetSrc(src);

  return (
    <div className={`lottie-container relative flex items-center justify-center ${className}`}>
      {autoplay ? (
        <img
          src={assetSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="lottie-fallback absolute inset-0 flex items-center justify-center pointer-events-none">
          {fallback}
        </div>
      )}
    </div>
  );
};
