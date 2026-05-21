import { spawnParticles } from '../components/ui/ParticleSystem';

/**
 * Triggers a large confetti burst, usually for completing a game or reaching a major milestone.
 * If no anchor is provided, it centers the burst on the body.
 */
export const triggerConfetti = (anchor?: HTMLElement | null) => {
  const target = anchor || document.body;
  // Dual burst for a more layered effect
  spawnParticles(target, 'confetti', { count: 80, spread: 400, duration: 2500, yBias: -100 });
  spawnParticles(target, 'star-burst', { count: 20, spread: 250, duration: 2000, yBias: -50 });
};

/**
 * Triggers a small star burst when collecting stars.
 */
export const triggerStarCollection = (anchor: HTMLElement | null) => {
  if (!anchor) return;
  spawnParticles(anchor, 'star-burst', { count: 12, spread: 120, duration: 1500 });
};

/**
 * Triggers a grand rank-up ceremony animation.
 */
export const triggerRankUp = (anchor: HTMLElement | null) => {
  if (!anchor) return;
  spawnParticles(anchor, 'star-burst', { count: 30, spread: 200, duration: 2000 });
  spawnParticles(anchor, 'gold-spark', { count: 40, spread: 250, duration: 2500, yBias: -50 });
};

/**
 * Triggers a streak fire effect for 5+ streaks.
 */
export const triggerStreakFire = (anchor: HTMLElement | null) => {
  if (!anchor) return;
  spawnParticles(anchor, 'gold-spark', { count: 20, spread: 90, duration: 1200, yBias: -40 });
};

/**
 * Triggers a celebration for completing a map cluster in Zone 1.
 */
export const triggerClusterComplete = (anchor?: HTMLElement | null) => {
  const target = anchor || document.body;
  spawnParticles(target, 'gold-spark', { count: 20, spread: 150, duration: 1800, yBias: -30 });
};

/**
 * Triggers a short full-screen milestone ceremony burst.
 */
export const triggerMilestoneCeremony = (anchor?: HTMLElement | null) => {
  const target = anchor || document.body;
  spawnParticles(target, 'confetti', { count: 70, spread: 420, duration: 2200, yBias: -120 });
  spawnParticles(target, 'gold-spark', { count: 36, spread: 300, duration: 2000, yBias: -70 });
};
