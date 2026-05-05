import type { StateEntry, Timezone } from '@/types';
import { calculatePoints } from './scoring';

export const TOTAL_QUESTIONS = 20;
export const TIMEZONE_Q_COUNT = 3;
export const FALL_DURATION_MS = 18000;
export const SPEED_WINDOW = 2;
export const START_TOP = -120; // px from top of zone (negative = starts above)

export type CodeQuestion = { type: 'code'; state: StateEntry };
export type TimezoneQuestion = { type: 'timezone'; state: StateEntry; choices: Timezone[] };
export type DropQuestion = CodeQuestion | TimezoneQuestion;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildTimezoneChoices(state: StateEntry, allStates: StateEntry[]): Timezone[] {
  const correct = state.timezone;
  const allTzs = [...new Set(allStates.map((s) => s.timezone))] as Timezone[];
  const decoys = shuffle(allTzs.filter((tz) => tz !== correct)).slice(0, 3);
  return shuffle([correct, ...decoys]);
}

export function pickQuestions(allStates: StateEntry[]): DropQuestion[] {
  const codeCount = TOTAL_QUESTIONS - TIMEZONE_Q_COUNT;
  const PRIORITY = 10;

  const priority = shuffle(allStates.filter((s) => s.common)).slice(0, Math.min(PRIORITY, codeCount));
  const used = new Set(priority.map((s) => s.code));
  const rest = shuffle(allStates.filter((s) => !used.has(s.code))).slice(0, codeCount - priority.length);

  const codeQuestions: CodeQuestion[] = [...priority, ...rest].map((s) => ({ type: 'code', state: s }));

  const tzStates = shuffle(allStates).slice(0, TIMEZONE_Q_COUNT);
  const tzQuestions: TimezoneQuestion[] = tzStates.map((s) => ({
    type: 'timezone',
    state: s,
    choices: buildTimezoneChoices(s, allStates),
  }));

  // Splice timezone questions in at positions ~5, ~10, ~15
  const result: DropQuestion[] = [...codeQuestions];
  ([5, 10, 15] as const).forEach((pos, i) => result.splice(pos + i, 0, tzQuestions[i]));
  return result.slice(0, TOTAL_QUESTIONS);
}

export function checkCodeAnswer(code: string, input: string): boolean {
  return code.toUpperCase() === input.trim().toUpperCase();
}

export function checkTimezoneAnswer(expected: Timezone, selected: Timezone): boolean {
  return expected === selected;
}

export { calculatePoints };
