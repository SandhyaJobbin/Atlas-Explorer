import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSession,
  createDemoSession,
  recordGameAttempt,
  updateTraining,
  isTrainingComplete,
  getCurrentGame,
  shouldRetryGame,
  isAllPassed,
  getTotalScore,
  getTotalStars,
  getSubmissionPayload,
  saveSession,
  loadSession,
  clearSession,
} from '@/lib/session';
import type { Session } from '@/types';

function makeSession(): Session {
  return createSession('Alice', 'WAVE1', 'Bob');
}

function passAttempt(totalCount = 20) {
  return { score: 140, correctCount: 14, totalCount, attemptNumber: 1 };
}

function failAttempt(totalCount = 20) {
  return { score: 50, correctCount: 5, totalCount, attemptNumber: 1 };
}

describe('session', () => {
  it('creates three game slots', () => {
    const s = makeSession();
    expect(s.games).toHaveLength(3);
    expect(s.games.map((g) => g.key)).toEqual(['crack', 'pin', 'sorter']);
  });

  it('initializes player fields', () => {
    const s = makeSession();
    expect(s.mode).toBe('player');
    expect(s.agent).toBe('Alice');
    expect(s.earnedBadges).toEqual([]);
    expect(s.lastKnownRank).toBeNull();
    expect(s.currentGameIndex).toBe(0);
  });

  it('creates demo session', () => {
    const s = createDemoSession();
    expect(s.mode).toBe('demo');
    expect(s.demo).toBe(true);
    expect(s.id).toContain('demo');
  });

  it('passing a game advances currentGameIndex', () => {
    const s = makeSession();
    const result = recordGameAttempt(s, 0, passAttempt());
    expect(result.status).toBe('passed');
    expect(s.currentGameIndex).toBe(1);
  });

  it('failing a game enables retry', () => {
    const s = makeSession();
    const result = recordGameAttempt(s, 0, failAttempt());
    expect(result.status).toBe('retry');
    expect(s.games[0].retryAvailable).toBe(true);
    expect(s.currentGameIndex).toBe(0);
  });

  it('multiple failures keep retry available', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, failAttempt());
    recordGameAttempt(s, 0, failAttempt());
    recordGameAttempt(s, 0, failAttempt());
    expect(s.games[0].retryAvailable).toBe(true);
    expect(s.games[0].attempts).toHaveLength(3);
  });

  it('pass after failures resolves correctly', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, failAttempt());
    recordGameAttempt(s, 0, failAttempt());
    const result = recordGameAttempt(s, 0, passAttempt());
    expect(result.status).toBe('passed');
    expect(s.games[0].passed).toBe(true);
    expect(s.games[0].retryAvailable).toBe(false);
    expect(s.currentGameIndex).toBe(1);
  });

  it('session completes when all games passed', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, passAttempt());
    recordGameAttempt(s, 1, passAttempt());
    recordGameAttempt(s, 2, passAttempt());
    expect(s.completed).toBe(true);
    expect(s.currentGameIndex).toBe(3);
  });

  it('streakPeak tracks highest value', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { ...failAttempt(), streakPeak: 2 });
    expect(s.games[0].streakPeak).toBe(2);
    recordGameAttempt(s, 0, { ...failAttempt(), streakPeak: 5 });
    expect(s.games[0].streakPeak).toBe(5);
    recordGameAttempt(s, 0, { ...failAttempt(), streakPeak: 3 });
    expect(s.games[0].streakPeak).toBe(5);
  });

  it('resolves game by key string', () => {
    const s = makeSession();
    const result = recordGameAttempt(s, 'pin', passAttempt());
    expect(result.game.key).toBe('pin');
  });

  it('getCurrentGame returns active game', () => {
    const s = makeSession();
    expect(getCurrentGame(s)?.key).toBe('crack');
    recordGameAttempt(s, 0, passAttempt());
    expect(getCurrentGame(s)?.key).toBe('pin');
  });

  it('shouldRetryGame reflects retry state', () => {
    const s = makeSession();
    expect(shouldRetryGame(s)).toBe(false);
    recordGameAttempt(s, 0, failAttempt());
    expect(shouldRetryGame(s)).toBe(true);
  });

  it('isAllPassed checks every game', () => {
    const s = makeSession();
    expect(isAllPassed(s)).toBe(false);
    recordGameAttempt(s, 0, passAttempt());
    recordGameAttempt(s, 1, passAttempt());
    expect(isAllPassed(s)).toBe(false);
    recordGameAttempt(s, 2, passAttempt());
    expect(isAllPassed(s)).toBe(true);
  });

  it('getTotalScore sums game scores', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 100, correctCount: 14, totalCount: 20 });
    recordGameAttempt(s, 1, { score: 80, correctCount: 14, totalCount: 20 });
    expect(getTotalScore(s)).toBe(180);
  });

  it('getTotalStars sums game stars', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 100, correctCount: 19, totalCount: 20 });
    recordGameAttempt(s, 1, { score: 80, correctCount: 17, totalCount: 20 });
    expect(getTotalStars(s)).toBe(5); // 3 + 2
  });

  it('getSubmissionPayload builds correct shape', () => {
    const s = makeSession();
    recordGameAttempt(s, 0, { score: 100, correctCount: 14, totalCount: 20 });
    const payload = getSubmissionPayload(s);
    expect(payload.name).toBe('Alice');
    expect(payload.game1).toBe(100);
    expect(payload.passFail).toBe('Fail');
  });
});

describe('session training', () => {
  it('tracks map explorer clicks', () => {
    const s = makeSession();
    updateTraining(s, 'map', 'TX');
    updateTraining(s, 'map', 'CA');
    expect(s.training.mapExplorerClicked).toEqual(['TX', 'CA']);
  });

  it('deduplicates codes', () => {
    const s = makeSession();
    updateTraining(s, 'map', 'TX');
    updateTraining(s, 'map', 'TX');
    expect(s.training.mapExplorerClicked).toHaveLength(1);
  });

  it('completes when 64 regions are explored', () => {
    const s = makeSession();
    const codes = Array.from({ length: 64 }, (_, i) => `R${i}`);
    codes.forEach((c) => updateTraining(s, 'map', c));
    expect(isTrainingComplete(s)).toBe(true);
  });
});

describe('session persistence', () => {
  let storage: Storage;

  beforeEach(() => {
    const store: Record<string, string> = {};
    storage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] ?? null,
    };
  });

  it('saves and loads session', () => {
    const s = makeSession();
    saveSession(s, storage);
    const loaded = loadSession(storage);
    expect(loaded).not.toBeNull();
    expect(loaded!.agent).toBe('Alice');
    expect(loaded!.games).toHaveLength(3);
  });

  it('returns null when no session saved', () => {
    expect(loadSession(storage)).toBeNull();
  });

  it('clearSession removes data', () => {
    const s = makeSession();
    saveSession(s, storage);
    clearSession(storage);
    expect(loadSession(storage)).toBeNull();
  });

  it('loadSession hydrates earnedBadges and lastKnownRank defaults', () => {
    const s = makeSession();
    delete (s as any).earnedBadges;
    delete (s as any).lastKnownRank;
    saveSession(s, storage);
    const loaded = loadSession(storage)!;
    expect(loaded.earnedBadges).toEqual([]);
    expect(loaded.lastKnownRank).toBeNull();
  });

  it('loadSession preserves legacy demo flag', () => {
    const s = makeSession();
    (s as any).demo = true;
    delete (s as any).mode;
    saveSession(s, storage);
    const loaded = loadSession(storage)!;
    expect(loaded.mode).toBe('demo');
    expect(loaded.demo).toBe(true);
  });

  it('loadSession migrates missing training field', () => {
    const s = makeSession();
    delete (s as any).training;
    saveSession(s, storage);
    const loaded = loadSession(storage)!;
    expect(loaded.training.mapExplorerClicked).toEqual([]);
    expect(loaded.training.completed).toBe(false);
  });
});
