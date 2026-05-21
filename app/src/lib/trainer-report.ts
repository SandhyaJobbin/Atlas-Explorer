import { readLocalScores } from './leaderboard';
import { GAME_DEFINITIONS } from './session';

export interface GameBreakdown {
  gameKey: string;
  gameLabel: string;
  totalAttempts: number;
  passedAttempts: number;
  passRate: number; // percentage 0-100
  averageScore: number;
}

export interface StandoutPerformer {
  agent: string;
  totalScore: number;
  totalStars: number;
  gamesPassed: number;
  estimatedMinutes: number;
  rank: number;
}

export interface TrainerWaveReport {
  waveCode: string;
  trainerName: string;
  generatedAt: string;
  totalParticipants: number;
  averageScore: number;
  overallPassRate: number; // percentage 0-100
  estimatedCompletionMinutes: number;
  perGameBreakdown: Record<string, GameBreakdown>;
  standoutPerformers: StandoutPerformer[];
}

function normalizeGameKey(g: string): string {
  if (!g) return '';
  const lower = g.toLowerCase();
  if (lower === 'crack-the-code' || lower === 'crack') return 'crack';
  if (lower === 'pin-it' || lower === 'pin') return 'pin';
  if (lower === 'city-sorter' || lower === 'sorter') return 'sorter';
  return g;
}

export function generateTrainerReport(waveCode: string): TrainerWaveReport {
  const allScores = readLocalScores();
  
  // Filter for the specified waveCode
  const waveAttempts = allScores.filter((row) => {
    const rowWave = (row.waveCode as string) || '';
    return rowWave.trim().toUpperCase() === waveCode.trim().toUpperCase();
  });

  const agentMap = new Map<
    string,
    {
      agent: string;
      trainerName: string;
      attempts: Record<string, unknown>[];
      bestScores: Map<string, number>;
      bestStars: Map<string, number>;
      passedGames: Set<string>;
      minTime: number;
      maxTime: number;
    }
  >();

  // Aggregate attempts per agent
  waveAttempts.forEach((row) => {
    const agent = (row.agent as string) || 'Unknown Agent';
    const trainerName = (row.trainerName as string) || 'Unknown Trainer';
    const game = (row.game as string) || '';
    const scorePct = Number(row.scorePct) || 0;
    const stars = Number(row.stars) || 0;
    const passed = Boolean(row.passed);
    const timestamp = row.timestamp ? new Date(row.timestamp as string).getTime() : Date.now();

    const normKey = normalizeGameKey(game);
    if (!normKey) return;

    if (!agentMap.has(agent)) {
      agentMap.set(agent, {
        agent,
        trainerName,
        attempts: [],
        bestScores: new Map(),
        bestStars: new Map(),
        passedGames: new Set(),
        minTime: timestamp,
        maxTime: timestamp,
      });
    }

    const entry = agentMap.get(agent)!;
    entry.attempts.push(row);
    entry.bestScores.set(normKey, Math.max(entry.bestScores.get(normKey) || 0, scorePct));
    entry.bestStars.set(normKey, Math.max(entry.bestStars.get(normKey) || 0, stars));
    if (passed) {
      entry.passedGames.add(normKey);
    }
    entry.minTime = Math.min(entry.minTime, timestamp);
    entry.maxTime = Math.max(entry.maxTime, timestamp);
  });

  const totalParticipants = agentMap.size;

  // Derive common trainer name
  let commonTrainerName = 'Unknown Trainer';
  if (totalParticipants > 0) {
    const trainerCounts = new Map<string, number>();
    agentMap.forEach((entry) => {
      trainerCounts.set(entry.trainerName, (trainerCounts.get(entry.trainerName) || 0) + 1);
    });
    let maxCount = 0;
    trainerCounts.forEach((count, name) => {
      if (count > maxCount) {
        maxCount = count;
        commonTrainerName = name;
      }
    });
  }

  // Calculate average score across all participants
  let totalScoreSum = 0;
  let agentsWhoPassedAll = 0;
  let totalTimeSpanMinutes = 0;

  agentMap.forEach((entry) => {
    let agentTotal = 0;
    entry.bestScores.forEach((score) => {
      agentTotal += score;
    });
    totalScoreSum += agentTotal;

    if (entry.passedGames.size >= GAME_DEFINITIONS.length) {
      agentsWhoPassedAll += 1;
    }

    const spanMinutes = (entry.maxTime - entry.minTime) / (1000 * 60);
    // If completed very quickly or single event, estimate based on attempt count
    if (spanMinutes < 1) {
      totalTimeSpanMinutes += entry.attempts.length * 3;
    } else {
      totalTimeSpanMinutes += spanMinutes;
    }
  });

  const averageScore = totalParticipants > 0 ? Math.round(totalScoreSum / totalParticipants) : 0;
  const overallPassRate = totalParticipants > 0 ? Math.round((agentsWhoPassedAll / totalParticipants) * 100) : 0;
  const estimatedCompletionMinutes = totalParticipants > 0 ? Math.round(totalTimeSpanMinutes / totalParticipants) : 0;

  // Calculate per-game breakdown
  const perGameBreakdown: Record<string, GameBreakdown> = {};

  GAME_DEFINITIONS.forEach((def) => {
    const matchingAttempts = waveAttempts.filter((row) => normalizeGameKey(row.game as string) === def.key);
    const totalAttempts = matchingAttempts.length;
    const passedAttempts = matchingAttempts.filter((row) => Boolean(row.passed)).length;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
    const scoreSum = matchingAttempts.reduce((acc, row) => acc + (Number(row.scorePct) || 0), 0);
    const avgScore = totalAttempts > 0 ? Math.round(scoreSum / totalAttempts) : 0;

    perGameBreakdown[def.key] = {
      gameKey: def.key,
      gameLabel: def.label,
      totalAttempts,
      passedAttempts,
      passRate,
      averageScore: avgScore,
    };
  });

  // Calculate standout performers
  const standoutPerformers: StandoutPerformer[] = Array.from(agentMap.values())
    .map((entry) => {
      let totalScore = 0;
      entry.bestScores.forEach((s) => (totalScore += s));
      let totalStars = 0;
      entry.bestStars.forEach((s) => (totalStars += s));

      const spanMinutes = (entry.maxTime - entry.minTime) / (1000 * 60);
      const estimatedMinutes = spanMinutes < 1 ? entry.attempts.length * 3 : Math.round(spanMinutes);

      return {
        agent: entry.agent,
        totalScore,
        totalStars,
        gamesPassed: entry.passedGames.size,
        estimatedMinutes,
        rank: 0, // Assigned below
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || b.totalStars - a.totalStars || a.agent.localeCompare(b.agent))
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    waveCode: waveCode.toUpperCase(),
    trainerName: commonTrainerName,
    generatedAt: new Date().toISOString(),
    totalParticipants,
    averageScore,
    overallPassRate,
    estimatedCompletionMinutes,
    perGameBreakdown,
    standoutPerformers,
  };
}

export function exportTrainerReportJSON(waveCode: string): string {
  const report = generateTrainerReport(waveCode);
  return JSON.stringify(report, null, 2);
}

export function downloadTrainerReportJSON(waveCode: string): void {
  const jsonString = exportTrainerReportJSON(waveCode);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trainer-report-${waveCode.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
