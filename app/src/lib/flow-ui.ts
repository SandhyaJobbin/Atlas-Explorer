import type { GameAttempt } from '@/types';

export const MOTIVATION_COPY = [
  'Close one. Run it back and keep the streak alive.',
  'You are one cleaner round away from a highlight clip.',
  'Every retry sharpens the route. Go again.',
  'Almost there. One hot streak changes the whole board.',
  'Geo Rush rewards the comeback.',
];

export function getMotivationalCopy(attemptNumber: number): string {
  return MOTIVATION_COPY[(Math.max(attemptNumber, 1) - 1) % MOTIVATION_COPY.length];
}

export function hasPersonalBest(attempts: GameAttempt[], ratio: number): boolean {
  if (!Array.isArray(attempts) || attempts.length <= 1) return false;
  const previousBest = Math.max(0, ...attempts.slice(0, -1).map((attempt) => attempt.ratio || 0));
  return ratio > previousBest;
}

/** Returns attempt history as { passed, isCurrent } objects for React rendering */
export function getAttemptDots(attempts: GameAttempt[]): { passed: boolean; isCurrent: boolean }[] {
  return attempts.map((attempt, index) => ({
    passed: attempt.passed,
    isCurrent: index === attempts.length - 1,
  }));
}
