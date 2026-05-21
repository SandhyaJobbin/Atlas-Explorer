/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { getLocalScores, isConfigured, MAX_STARS_PER_SESSION } from '@/lib/leaderboard';


describe('leaderboard', () => {
  it('isConfigured returns false when URL is empty', () => {
    expect(isConfigured()).toBe(false);
  });

  it('MAX_STARS_PER_SESSION equals 9 (3 games x 3 stars)', () => {
    expect(MAX_STARS_PER_SESSION).toBe(9);
  });

  it('getLocalScores returns empty array with no data', () => {
    localStorage.clear();
    expect(getLocalScores()).toEqual([]);
  });

  it('getLocalScores aggregates per-agent rows', () => {
    localStorage.clear();
    const scores = [
      { agent: 'Alice', game: 'crack', stars: 2, passed: true, timestamp: '2025-01-01' },
      { agent: 'Alice', game: 'pin', stars: 3, passed: true, timestamp: '2025-01-01' },
      { agent: 'Bob', game: 'crack', stars: 1, passed: true, timestamp: '2025-01-01' },
    ];
    localStorage.setItem('atlas-explorer-local-leaderboard', JSON.stringify(scores));

    const result = getLocalScores();
    expect(result).toHaveLength(2);

    const alice = result.find((r) => r.agent === 'Alice')!;
    expect(alice.totalStars).toBe(5);
    expect(alice.gamesPassed).toBe(2);
    expect(alice.rank).toBe(1);

    const bob = result.find((r) => r.agent === 'Bob')!;
    expect(bob.totalStars).toBe(1);
    expect(bob.rank).toBe(2);
  });
});
