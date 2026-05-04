import { describe, it, expect } from 'vitest';
import { evaluateBadges, BADGE_DEFS } from '@/lib/badges';
import { createSession, recordGameAttempt } from '@/lib/session';
import type { Session, GameResult } from '@/types';

function makeSession(): Session {
  return createSession('Tester', 'W1', 'Coach');
}

function passResult(overrides: Partial<GameResult> = {}): GameResult {
  return { score: 140, correctCount: 14, totalCount: 20, streakPeak: 2, ...overrides };
}

function perfectResult(overrides: Partial<GameResult> = {}): GameResult {
  return { score: 260, correctCount: 20, totalCount: 20, streakPeak: 5, ...overrides };
}

describe('badges', () => {
  it('BADGE_DEFS has 8 entries', () => {
    expect(BADGE_DEFS).toHaveLength(8);
  });

  it('first-blood: awarded on first attempt pass', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 140, correctCount: 14, totalCount: 20 });
    const badges = evaluateBadges(0, passResult(), s);
    expect(badges.some((b) => b.id === 'first-blood')).toBe(true);
  });

  it('first-blood: not awarded on second attempt', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 50, correctCount: 5, totalCount: 20 });
    recordGameAttempt(s, 0, { score: 140, correctCount: 14, totalCount: 20 });
    const badges = evaluateBadges(0, passResult(), s);
    expect(badges.some((b) => b.id === 'first-blood')).toBe(false);
  });

  it('perfect-agent: awarded on 100% score', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 260, correctCount: 20, totalCount: 20 });
    const badges = evaluateBadges(0, perfectResult(), s);
    expect(badges.some((b) => b.id === 'perfect-agent')).toBe(true);
  });

  it('perfect-agent: not awarded below 100%', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 140, correctCount: 14, totalCount: 20 });
    const badges = evaluateBadges(0, passResult(), s);
    expect(badges.some((b) => b.id === 'perfect-agent')).toBe(false);
  });

  it('hot-streak: awarded when streakPeak >= 3', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 140, correctCount: 14, totalCount: 20, streakPeak: 4 });
    const badges = evaluateBadges(0, passResult({ streakPeak: 4 }), s);
    expect(badges.some((b) => b.id === 'hot-streak')).toBe(true);
  });

  it('globe-trotter: awarded when all games passed', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 140, correctCount: 14, totalCount: 20 });
    recordGameAttempt(s, 1, { score: 140, correctCount: 14, totalCount: 20 });
    recordGameAttempt(s, 2, { score: 140, correctCount: 14, totalCount: 20 });
    const badges = evaluateBadges(2, passResult(), s);
    expect(badges.some((b) => b.id === 'globe-trotter')).toBe(true);
  });

  it('diamond-agent: all games passed on first attempt', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 260, correctCount: 20, totalCount: 20 });
    recordGameAttempt(s, 1, { score: 260, correctCount: 20, totalCount: 20 });
    recordGameAttempt(s, 2, { score: 260, correctCount: 20, totalCount: 20 });
    const badges = evaluateBadges(2, perfectResult(), s);
    expect(badges.some((b) => b.id === 'diamond-agent')).toBe(true);
  });

  it('never-quit: awarded on 4th+ attempt', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 50, correctCount: 5, totalCount: 20 });
    recordGameAttempt(s, 0, { score: 50, correctCount: 5, totalCount: 20 });
    recordGameAttempt(s, 0, { score: 50, correctCount: 5, totalCount: 20 });
    recordGameAttempt(s, 0, { score: 140, correctCount: 14, totalCount: 20 });
    const badges = evaluateBadges(0, passResult(), s);
    expect(badges.some((b) => b.id === 'never-quit')).toBe(true);
  });

  it('speed-run: 100% with timerRatio > 0.5', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 260, correctCount: 20, totalCount: 20 });
    const badges = evaluateBadges(0, perfectResult({ timerRatio: 0.7 }), s);
    expect(badges.some((b) => b.id === 'speed-run')).toBe(true);
  });

  it('speed-run: not awarded with low timerRatio', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 260, correctCount: 20, totalCount: 20 });
    const badges = evaluateBadges(0, perfectResult({ timerRatio: 0.3 }), s);
    expect(badges.some((b) => b.id === 'speed-run')).toBe(false);
  });

  it('does not award duplicate badges', () => {
    const s = makeSession();
    s.earnedBadges.push('first-blood');
    recordGameAttempt(s, 0, { score: 140, correctCount: 14, totalCount: 20 });
    const badges = evaluateBadges(0, passResult(), s);
    expect(badges.filter((b) => b.id === 'first-blood')).toHaveLength(0);
  });
});
