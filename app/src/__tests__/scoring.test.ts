import { describe, it, expect } from 'vitest';
import {
  requiredCorrect,
  percentCorrect,
  isPassed,
  calculatePoints,
  calculateStars,
  normalizeAttempt,
  BASE_POINTS,
  SPEED_BONUS_POINTS,
} from '@/lib/scoring';

describe('scoring', () => {
  it('requiredCorrect rounds up at 70% threshold', () => {
    expect(requiredCorrect(20)).toBe(14);
    expect(requiredCorrect(15)).toBe(11);
    expect(requiredCorrect(10)).toBe(7);
  });

  it('percentCorrect handles zero total', () => {
    expect(percentCorrect(0, 0)).toBe(0);
  });

  it('percentCorrect returns ratio', () => {
    expect(percentCorrect(7, 10)).toBeCloseTo(0.7);
  });

  it('isPassed uses requiredCorrect count', () => {
    expect(isPassed(14, 20)).toBe(true);
    expect(isPassed(13, 20)).toBe(false);
  });

  it('isPassed returns false for zero total', () => {
    expect(isPassed(0, 0)).toBe(false);
  });

  it('calculatePoints gives base only when correct but slow', () => {
    expect(calculatePoints(true, 5, 2)).toBe(BASE_POINTS);
  });

  it('calculatePoints adds speed bonus for fast correct answers', () => {
    expect(calculatePoints(true, 1, 2)).toBe(BASE_POINTS + SPEED_BONUS_POINTS);
  });

  it('calculatePoints returns 0 for incorrect', () => {
    expect(calculatePoints(false, 1, 2)).toBe(0);
  });

  it('calculateStars returns 0 when not passed', () => {
    expect(calculateStars(5, 20)).toBe(0);
  });

  it('calculateStars returns 1 for 70-79%', () => {
    expect(calculateStars(14, 20)).toBe(1);
  });

  it('calculateStars returns 2 for 80-94%', () => {
    expect(calculateStars(17, 20)).toBe(2);
  });

  it('calculateStars returns 3 for 95%+', () => {
    expect(calculateStars(19, 20)).toBe(3);
  });

  it('normalizeAttempt builds complete attempt object', () => {
    const attempt = normalizeAttempt({ score: 100, correctCount: 18, totalCount: 20 });
    expect(attempt.passed).toBe(true);
    expect(attempt.stars).toBe(2);
    expect(attempt.ratio).toBeCloseTo(0.9);
    expect(attempt.recordedAt).toBeTruthy();
  });

  it('normalizeAttempt defaults to zeros', () => {
    const attempt = normalizeAttempt();
    expect(attempt.score).toBe(0);
    expect(attempt.correctCount).toBe(0);
    expect(attempt.passed).toBe(false);
    expect(attempt.stars).toBe(0);
  });
});
