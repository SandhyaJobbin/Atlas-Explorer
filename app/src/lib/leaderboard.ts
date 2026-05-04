import type { LeaderboardRow, LeaderboardResponse } from '@/types';
import { GAME_DEFINITIONS } from './session';

const APPS_SCRIPT_URL = ''; // Paste your deployed Apps Script /exec URL here
const LOCAL_LEADERBOARD_KEY = 'atlas-explorer-local-leaderboard';

const GAME_SHEET_KEYS: Record<string, string> = {
  crack: 'crack-the-code',
  pin: 'pin-it',
  sorter: 'city-sorter',
};

interface AttemptScorePayload {
  agent: string;
  waveCode: string;
  trainerName: string;
  game: string;
  attempt: number;
  scorePct: number;
  stars: number;
  passed: boolean;
}

export async function submitAttemptScore(payload: AttemptScorePayload): Promise<void> {
  const gameSlug = GAME_SHEET_KEYS[payload.game] || payload.game;
  const body = { agent: payload.agent, waveCode: payload.waveCode, trainerName: payload.trainerName, game: gameSlug, attempt: payload.attempt, scorePct: payload.scorePct, stars: payload.stars, passed: Boolean(payload.passed) };

  if (!isConfigured()) {
    saveLocalScore(body);
    return;
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'submit', ...body }),
    });
  } catch {
    saveLocalScore(body);
  }
}

export async function awardBadge(agent: string, badgeId: string, badgeName: string): Promise<void> {
  if (!isConfigured()) return;
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'awardBadge', agent, badgeId, badgeName }),
    });
  } catch {
    // Local session state still reflects the unlock.
  }
}

export async function fetchBadges(agent: string): Promise<string[]> {
  if (!isConfigured()) return [];
  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', 'fetchBadges');
    url.searchParams.set('agent', agent);
    const response = await fetch(url);
    const data = await response.json() as { badges?: { badgeId: string }[] };
    return (data.badges || []).map((badge) => badge.badgeId);
  } catch {
    return [];
  }
}

export async function fetchLeaderboard(agent: string): Promise<LeaderboardResponse> {
  if (!isConfigured()) {
    const top10 = getLocalScores();
    const currentRow = top10.find((row) => row.agent === agent) || null;
    return { top10, currentRow };
  }

  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set('action', 'fetchLeaderboard');
    url.searchParams.set('agent', agent);
    const response = await fetch(url);
    return await response.json() as LeaderboardResponse;
  } catch {
    const top10 = getLocalScores();
    const currentRow = top10.find((row) => row.agent === agent) || null;
    return { top10, currentRow };
  }
}

export function isConfigured(): boolean {
  return APPS_SCRIPT_URL.startsWith('https://');
}

export function getLocalScores(): LeaderboardRow[] {
  const totals = new Map<string, { agent: string; totalStars: number; badgeCount: number; _gamesPassed: Set<string> }>();

  readLocalScores().forEach((row) => {
    if (!row.agent) return;
    if (!totals.has(row.agent)) {
      totals.set(row.agent, { agent: row.agent, totalStars: 0, badgeCount: 0, _gamesPassed: new Set() });
    }
    const entry = totals.get(row.agent)!;
    entry.totalStars += Number(row.stars) || 0;
    if (row.passed) entry._gamesPassed.add(row.game as string);
  });

  return [...totals.values()]
    .map((entry, index) => ({
      agent: entry.agent,
      totalStars: entry.totalStars,
      gamesPassed: entry._gamesPassed.size,
      badgeCount: entry.badgeCount,
      rank: index + 1,
    }))
    .sort(
      (a, b) =>
        b.totalStars - a.totalStars ||
        b.gamesPassed - a.gamesPassed ||
        a.agent.localeCompare(b.agent),
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

// Exposed for display — max stars per session
export const MAX_STARS_PER_SESSION = GAME_DEFINITIONS.length * 3;

function saveLocalScore(payload: Record<string, unknown>): void {
  const scores = readLocalScores();
  scores.push({ ...payload, timestamp: new Date().toISOString() });
  localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(scores));
}

function readLocalScores(): Record<string, unknown>[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LEADERBOARD_KEY) || '[]') as Record<string, unknown>[];
  } catch {
    return [];
  }
}
