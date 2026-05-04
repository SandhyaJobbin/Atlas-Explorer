import { describe, it, expect } from 'vitest';
import { getMotivationalCopy, hasPersonalBest, getAttemptDots, MOTIVATION_COPY } from '@/lib/flow-ui';
import type { GameAttempt } from '@/types';

function fakeAttempt(overrides: Partial<GameAttempt> = {}): GameAttempt {
  return {
    score: 100,
    correctCount: 14,
    totalCount: 20,
    ratio: 0.7,
    attemptNumber: 1,
    passed: true,
    stars: 1,
    recordedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('flow-ui', () => {
  it('getMotivationalCopy rotates through messages', () => {
    const msgs = new Set(Array.from({ length: 5 }, (_, i) => getMotivationalCopy(i + 1)));
    expect(msgs.size).toBe(MOTIVATION_COPY.length);
  });

  it('getMotivationalCopy wraps around', () => {
    expect(getMotivationalCopy(1)).toBe(getMotivationalCopy(6));
  });

  it('hasPersonalBest returns false for single attempt', () => {
    expect(hasPersonalBest([fakeAttempt()], 0.8)).toBe(false);
  });

  it('hasPersonalBest returns true when current beats previous', () => {
    const attempts = [fakeAttempt({ ratio: 0.5 }), fakeAttempt({ ratio: 0.8 })];
    expect(hasPersonalBest(attempts, 0.8)).toBe(true);
  });

  it('hasPersonalBest returns false when current ties previous', () => {
    const attempts = [fakeAttempt({ ratio: 0.8 }), fakeAttempt({ ratio: 0.8 })];
    expect(hasPersonalBest(attempts, 0.8)).toBe(false);
  });

  it('getAttemptDots marks last as current', () => {
    const attempts = [
      fakeAttempt({ passed: true }),
      fakeAttempt({ passed: false }),
      fakeAttempt({ passed: true }),
    ];
    const dots = getAttemptDots(attempts);
    expect(dots).toHaveLength(3);
    expect(dots[0]).toEqual({ passed: true, isCurrent: false });
    expect(dots[1]).toEqual({ passed: false, isCurrent: false });
    expect(dots[2]).toEqual({ passed: true, isCurrent: true });
  });

  it('getAttemptDots handles empty array', () => {
    expect(getAttemptDots([])).toEqual([]);
  });
});
