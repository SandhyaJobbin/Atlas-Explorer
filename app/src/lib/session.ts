import type { Session, GameState, TrainingProgress } from '@/types';
import { normalizeAttempt } from './scoring';

export const STORAGE_KEY = 'atlas-explorer-session';

export const GAME_DEFINITIONS = [
  { key: 'crack', label: 'Crack the Code', maxScore: 260 },
  { key: 'pin',   label: 'Pin It!',         maxScore: 195 },
  { key: 'sorter', label: 'Tz Sorter',      maxScore: 312 },
] as const;

const TOTAL_REGIONS = 63;

function emptyTraining(): TrainingProgress {
  return { mapExplorerClicked: [], completed: false };
}

function makeGameStates(): GameState[] {
  return GAME_DEFINITIONS.map((game) => ({
    key: game.key,
    label: game.label,
    attempts: [],
    score: 0,
    correctCount: 0,
    totalCount: 0,
    stars: 0,
    passed: false,
    retryAvailable: false,
    completed: false,
    streakPeak: 0,
    attemptNumber: 0,
    earnedBadges: [],
  }));
}

export function createSession(name: string, waveCode: string, trainerName: string): Session {
  return {
    id: `atlas-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    mode: 'player',
    agent: name,
    name,
    waveCode,
    trainerName,
    currentGameIndex: 0,
    completed: false,
    createdAt: new Date().toISOString(),
    earnedBadges: [],
    lastKnownRank: null,
    games: makeGameStates(),
    training: emptyTraining(),
  };
}

export function createDemoSession(): Session {
  const session = createSession('Manager Demo', 'DEMO', 'Demo Mode');
  session.mode = 'demo';
  session.demo = true;
  session.id = `atlas-demo-${Date.now()}`;
  return session;
}

export function recordGameAttempt(
  session: Session,
  gameIndexOrKey: number | string,
  rawAttempt: {
    score?: number;
    correctCount?: number;
    totalCount?: number;
    ratio?: number;
    attemptNumber?: number;
    streakPeak?: number;
  },
) {
  const index = resolveGameIndex(gameIndexOrKey);
  const game = session.games[index];
  if (!game) throw new Error(`Unknown game: ${gameIndexOrKey}`);

  if (typeof rawAttempt.streakPeak === 'number') {
    game.streakPeak = Math.max(game.streakPeak, rawAttempt.streakPeak);
  }

  const attempt = normalizeAttempt(rawAttempt);
  game.attempts.push(attempt);
  game.attemptNumber = attempt.attemptNumber;

  if (attempt.passed) {
    applyFinalAttempt(game, attempt);
    game.retryAvailable = false;
    if (session.currentGameIndex === index) {
      session.currentGameIndex = Math.min(index + 1, session.games.length);
    }
    session.completed = session.currentGameIndex >= session.games.length;
    return { status: 'passed' as const, game, attempt, gameIndex: index };
  }

  game.score = attempt.score;
  game.correctCount = attempt.correctCount;
  game.totalCount = attempt.totalCount;
  game.stars = 0;
  game.passed = false;
  game.completed = false;
  game.retryAvailable = true;
  return { status: 'retry' as const, game, attempt, gameIndex: index };
}

export function updateTraining(
  session: Session,
  _type: 'map',
  code: string,
): void {
  const field = 'mapExplorerClicked';
  if (!session.training[field].includes(code)) {
    session.training[field].push(code);
  }
  session.training.completed =
    session.training.mapExplorerClicked.length >= TOTAL_REGIONS;
}

export function isTrainingComplete(session: Session): boolean {
  return session.training.completed;
}

export function getCurrentGame(session: Session): GameState | null {
  return session.games[session.currentGameIndex] || null;
}

export function shouldRetryGame(
  session: Session,
  gameIndexOrKey: number | string = session.currentGameIndex,
): boolean {
  const game = session.games[resolveGameIndex(gameIndexOrKey)];
  return Boolean(game?.retryAvailable);
}

export function isAllPassed(session: Session): boolean {
  return session.games.every((game) => game.passed);
}

// isFlagged: kept for backward compatibility; unlimited retries means always false
export function isFlagged(_session: Session): boolean {
  return false;
}

export function getTotalScore(session: Session): number {
  return session.games.reduce((total, game) => total + (game.score || 0), 0);
}

export function getTotalStars(session: Session): number {
  return session.games.reduce((total, game) => total + (game.stars || 0), 0);
}

export function getSubmissionPayload(session: Session) {
  return {
    name: session.name,
    waveCode: session.waveCode,
    trainerName: session.trainerName,
    game1: session.games[0]?.score || 0,
    game2: session.games[1]?.score || 0,
    game3: session.games[2]?.score || 0,
    game4: 0,
    total: getTotalScore(session),
    stars: getTotalStars(session),
    passFail: isAllPassed(session) ? 'Pass' : 'Fail',
    flagged: isFlagged(session) ? 'Yes' : 'No',
  };
}

export function saveSession(session: Session, storage: Storage = globalThis.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(storage: Storage = globalThis.localStorage): Session | null {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  let session: Partial<Session> & Record<string, unknown>;
  try {
    session = JSON.parse(raw) as Partial<Session> & Record<string, unknown>;
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
  session.mode = (session.mode as Session['mode']) || (session.demo ? 'demo' : 'player');
  session.demo = session.mode === 'demo' || Boolean(session.demo);
  if (!session.agent && session.name) session.agent = session.name;
  session.earnedBadges = Array.isArray(session.earnedBadges) ? session.earnedBadges : [];
  session.lastKnownRank = Number.isFinite(session.lastKnownRank as number)
    ? (session.lastKnownRank as number)
    : null;

  // Migrate training field for legacy sessions
  if (!session.training) {
    session.training = emptyTraining();
  } else {
    const t = session.training as Partial<TrainingProgress> & { geoTilesClicked?: string[] };
    session.training = {
      mapExplorerClicked: Array.isArray(t.mapExplorerClicked) ? t.mapExplorerClicked : [],
      completed: Boolean(t.completed),
    };
  }

  const defaultStates = makeGameStates();
  const legacyGames = (session.games as Partial<GameState>[]) || [];
  session.games = GAME_DEFINITIONS.map((definition, index) => {
    const legacyGame =
      legacyGames.find((candidate) => candidate?.key === definition.key) ||
      legacyGames[index] ||
      {};
    const attempts = Array.isArray(legacyGame.attempts) ? legacyGame.attempts : [];
    return {
      ...defaultStates[index],
      ...legacyGame,
      key: definition.key,
      label: definition.label,
      attempts,
      attemptNumber: attempts.length,
    } as GameState;
  });
  session.currentGameIndex = Math.min(
    (session.currentGameIndex as number) || 0,
    session.games.length,
  );
  session.completed = Boolean(
    session.completed || (session.currentGameIndex as number) >= session.games.length,
  );
  return session as Session;
}

export function clearSession(storage: Storage = globalThis.localStorage): void {
  storage.removeItem(STORAGE_KEY);
}

function resolveGameIndex(gameIndexOrKey: number | string): number {
  if (typeof gameIndexOrKey === 'number') return gameIndexOrKey;
  return GAME_DEFINITIONS.findIndex((game) => game.key === gameIndexOrKey);
}

function applyFinalAttempt(game: GameState, attempt: ReturnType<typeof normalizeAttempt>): void {
  game.score = attempt.score;
  game.correctCount = attempt.correctCount;
  game.totalCount = attempt.totalCount;
  game.stars = attempt.stars;
  game.passed = Boolean(attempt.passed);
  game.attemptNumber = attempt.attemptNumber;
  game.completed = true;
}

// ─── Rank Logic ───────────────────────────────────────────────────────────────

export type Rank = 'Trainee' | 'Specialist' | 'Lead Analyst' | 'Master Screener';

export const RANK_THRESHOLDS = [
  { rank: 'Master Screener' as Rank, min: 600, icon: '🛡️' },
  { rank: 'Lead Analyst' as Rank,    min: 400, icon: '⚖️' },
  { rank: 'Specialist' as Rank,      min: 200, icon: '🔍' },
  { rank: 'Trainee' as Rank,         min: 0,   icon: '📁' },
];

export function getRank(score: number): Rank {
  for (const t of RANK_THRESHOLDS) {
    if (score >= t.min) return t.rank;
  }
  return 'Trainee';
}

export function getRankInfo(score: number) {
  for (const t of RANK_THRESHOLDS) {
    if (score >= t.min) return t;
  }
  return RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
}
