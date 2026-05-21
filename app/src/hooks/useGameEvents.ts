import mitt from 'mitt';
import type { GameResult } from '@/types';

export type GameEvents = {
  gameStart: { gameIndex: number; isRetry: boolean; baselineScore: number };
  gameComplete: { gameIndex: number; result: GameResult };
  answerCorrect: { gameIndex: number; points: number; streak: number; code: string };
  answerWrong: { gameIndex: number; code: string; streak: number };
  scoreUpdate: { gameIndex: number; score: number; streak: number };
};

export const gameEvents = mitt<GameEvents>();
