// ─── State / Province ───────────────────────────────────────────────────────

export type Timezone = 'AKST' | 'PST' | 'MST' | 'CST' | 'EST' | 'AST' | 'NST' | 'HST';
export type TimezoneLabel =
  | 'Alaska'
  | 'Pacific'
  | 'Mountain'
  | 'Central'
  | 'Eastern'
  | 'Atlantic'
  | 'Newfoundland'
  | 'Hawaii-Aleutian';
export type Coast = 'West Coast' | 'East Coast' | 'Gulf Coast' | 'Inland';

export interface StateEntry {
  code: string;
  name: string;
  country: 'US' | 'CA';
  region: string;
  common: boolean;
  capital: string;
  timezone: Timezone;
  timezoneLabel: TimezoneLabel;
  coast: Coast;
  specialties: string[];
  trivia?: string[];
}

// ─── Training ────────────────────────────────────────────────────────────────

export interface TrainingProgress {
  mapExplorerClicked: string[];
  completed: boolean;
}

// ─── Games ───────────────────────────────────────────────────────────────────

export interface GameAttempt {
  score: number;
  correctCount: number;
  totalCount: number;
  ratio: number;
  attemptNumber: number;
  passed: boolean;
  stars: number;
  recordedAt: string;
}

export interface GameState {
  key: string;
  label: string;
  attempts: GameAttempt[];
  score: number;
  correctCount: number;
  totalCount: number;
  stars: number;
  passed: boolean;
  retryAvailable: boolean;
  completed: boolean;
  streakPeak: number;
  attemptNumber: number;
  earnedBadges: string[];
}

export interface GameDefinition {
  key: string;
  label: string;
  maxScore: number;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  mode: 'player' | 'demo';
  agent: string;
  name: string;
  waveCode: string;
  trainerName: string;
  currentGameIndex: number;
  completed: boolean;
  createdAt: string;
  earnedBadges: string[];
  lastKnownRank: number | null;
  demo?: boolean;
  games: GameState[];
  training: TrainingProgress;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardRow {
  agent: string;
  totalStars: number;
  gamesPassed: number;
  badgeCount: number;
  rank: number;
}

export interface LeaderboardResponse {
  top10: LeaderboardRow[];
  currentRow: LeaderboardRow | null;
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
}

export interface EarnedBadge {
  id: string;
  name: string;
}

// ─── Game component interface ─────────────────────────────────────────────────

export interface GameResult {
  score: number;
  correctCount: number;
  totalCount: number;
  streakPeak: number;
  timerRatio?: number;
}

export interface GameProps {
  onComplete: (result: GameResult) => void;
  onStreakChange?: (streak: number) => void;
  isRetry: boolean;
}
