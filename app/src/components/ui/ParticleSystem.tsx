import React, { useEffect, useCallback, useRef } from 'react';

export type ParticleType = 
  | 'sparkle' 
  | 'confetti' 
  | 'star-burst' 
  | 'gold-spark' 
  | 'water-ripple' 
  | 'water-splash' 
  | 'sand-burst' 
  | 'leaf-spark' 
  | 'leaf-particle';

interface ParticleOptions {
  x?: number;
  y?: number;
  spread?: number;
  yBias?: number;
  duration?: number;
  count?: number;
  variant?: string;
}

export const spawnParticles = (
  anchor: HTMLElement | null,
  type: ParticleType = 'sparkle',
  options: ParticleOptions = {}
) => {
  if (!anchor || typeof document === 'undefined') return;

  const rect = anchor.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = `particle-burst ${type}`;
  layer.setAttribute('aria-hidden', 'true');
  
  // Use provided coordinates or center of anchor
  const x = options.x ?? rect.left + rect.width / 2;
  const y = options.y ?? rect.top + rect.height / 2;
  
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;

  const count = options.count ?? 12;
  const spread = options.spread ?? 130;
  const yBias = options.yBias ?? 0;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('span');
    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.55 - 0.275);
    const distance = spread * (0.32 + Math.random() * 0.68);
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance + yBias;
    
    particle.style.setProperty('--tx', `${Math.round(tx)}px`);
    particle.style.setProperty('--ty', `${Math.round(ty)}px`);
    particle.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
    particle.style.setProperty('--size', `${Math.round(5 + Math.random() * 9)}px`);
    particle.style.setProperty('--delay', `${Math.round(Math.random() * 70)}ms`);
    
    layer.appendChild(particle);
  }

  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), options.duration || 1200);
};

export const ParticleSystem: React.FC = () => {
  // This component doesn't render anything itself, 
  // but could be used to manage global particle state if needed.
  return null;
};

export const useParticles = () => {
  const triggerBurst = useCallback((anchor: HTMLElement | null, type: ParticleType, options?: ParticleOptions) => {
    spawnParticles(anchor, type, options);
  }, []);

  return { triggerBurst };
};
