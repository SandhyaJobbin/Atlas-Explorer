import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottiePlayerProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  fallback?: React.ReactNode;
}

export const LottiePlayer: React.FC<LottiePlayerProps> = ({
  src,
  className = '',
  loop = true,
  autoplay = true,
  speed = 1,
  fallback = '✦'
}) => {
  // Ensure the src path is correct (relative to public)
  const lottieSrc = src.startsWith('assets/') ? `/${src}` : src;

  return (
    <div className={`lottie-container relative ${className}`}>
      <DotLottieReact
        src={lottieSrc}
        loop={loop}
        autoplay={autoplay}
        speed={speed}
      />
      {/* Fallback is usually hidden via CSS if Lottie is supported, 
          but here we can just let DotLottie handle it or show it if needed */}
      {!autoplay && <div className="lottie-fallback absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none">{fallback}</div>}
    </div>
  );
};
