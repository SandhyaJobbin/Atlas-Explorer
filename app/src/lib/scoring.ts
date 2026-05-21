import type { Session, StateEntry } from '@/types';

export const PASS_RATIO = 0.7;
export const BASE_POINTS = 10;
export const SPEED_BONUS_POINTS = 3;

export function requiredCorrect(totalCount: number, passRatio = PASS_RATIO): number {
  return Math.ceil(totalCount * passRatio);
}

export function percentCorrect(correctCount: number, totalCount: number): number {
  if (!totalCount) return 0;
  return correctCount / totalCount;
}

export function isPassed(correctCount: number, totalCount: number, passRatio = PASS_RATIO): boolean {
  if (!totalCount) return false;
  return correctCount >= requiredCorrect(totalCount, passRatio);
}

export function calculatePoints(isCorrect: boolean, elapsedSeconds: number, speedWindowSeconds: number): number {
  if (!isCorrect) return 0;
  return BASE_POINTS + (elapsedSeconds <= speedWindowSeconds ? SPEED_BONUS_POINTS : 0);
}

export function calculateStars(correctCount: number, totalCount: number): number {
  const pct = percentCorrect(correctCount, totalCount);
  if (!isPassed(correctCount, totalCount)) return 0;
  if (pct >= 0.95) return 3;
  if (pct >= 0.8) return 2;
  return 1;
}

export interface AggregatedMistake {
  code: string;
  count: number;
  state: StateEntry;
}

export function getAggregatedMistakes(session: Session, states: StateEntry[]): AggregatedMistake[] {
  if (!session?.games) return [];

  const allMistakes = session.games.flatMap((g) =>
    (g.attempts || []).flatMap((a) => a.mistakes || [])
  );

  const counts: Record<string, number> = {};
  allMistakes.forEach((code) => {
    counts[code] = (counts[code] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([code, count]) => {
      const state = states.find((s) => s.code === code);
      return state ? { code, count, state } : null;
    })
    .filter((x): x is AggregatedMistake => !!x)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.state.name.localeCompare(b.state.name);
    });
}

export function computeMistakeWeights(
  session: Session | null,
  gameIndex: number,
): Record<string, number> {
  if (!session) return {};
  const game = session.games[gameIndex];
  if (!game || game.attempts.length === 0) return {};
  const counts: Record<string, number> = {};
  for (const attempt of game.attempts) {
    for (const code of attempt.mistakes || []) {
      counts[code] = (counts[code] || 0) + 1;
    }
  }
  return counts;
}

export function normalizeAttempt({
  score = 0,
  correctCount = 0,
  totalCount = 0,
  ratio = percentCorrect(correctCount, totalCount),
  attemptNumber = 1,
  mistakes = [],
  corrects = [],
}: {
  score?: number;
  correctCount?: number;
  totalCount?: number;
  ratio?: number;
  attemptNumber?: number;
  mistakes?: string[];
  corrects?: string[];
} = {}) {
  const passed = isPassed(correctCount, totalCount);
  return {
    score,
    correctCount,
    totalCount,
    ratio,
    attemptNumber,
    passed,
    stars: passed ? calculateStars(correctCount, totalCount) : 0,
    recordedAt: new Date().toISOString(),
    mistakes,
    corrects,
  };
}

