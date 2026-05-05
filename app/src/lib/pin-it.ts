import type { StateEntry, Timezone } from '@/types';
import { calculatePoints } from './scoring';

export const TOTAL_QUESTIONS    = 15;
export const TIMEZONE_Q_COUNT   = 2;
export const TIME_PER_QUESTION  = 45;
export const SPEED_WINDOW       = 15;

export type MapQuestion = { type: 'map'; state: StateEntry };
export type TzMapQuestion = {
  type: 'timezone';
  timezone: Timezone;
  timezoneLabel: string;
};
export type PinQuestion = MapQuestion | TzMapQuestion;

const OPENING_CODES: string[] = ['TX', 'CA', 'ON', 'BC', 'FL', 'NY'];
const TZ_POOL: Array<[Timezone, string]> = [
  ['PST', 'Pacific'],
  ['EST', 'Eastern'],
  ['CST', 'Central'],
  ['MST', 'Mountain'],
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickPinQuestions(allStates: StateEntry[]): PinQuestion[] {
  const mapCount = TOTAL_QUESTIONS - TIMEZONE_Q_COUNT;

  const opening  = OPENING_CODES.map((c) => allStates.find((s) => s.code === c)).filter(Boolean) as StateEntry[];
  const used     = new Set(opening.map((s) => s.code));
  const rest     = shuffle(allStates.filter((s) => !used.has(s.code)));
  const mapStates = [...opening, ...rest].slice(0, mapCount);

  const mapQuestions: MapQuestion[]   = mapStates.map((s) => ({ type: 'map', state: s }));
  const tzPairs                       = shuffle(TZ_POOL).slice(0, TIMEZONE_Q_COUNT);
  const tzQuestions: TzMapQuestion[]  = tzPairs.map(([timezone, timezoneLabel]) => ({
    type: 'timezone',
    timezone,
    timezoneLabel,
  }));

  const result: PinQuestion[] = [...mapQuestions];
  ([6, 11] as const).forEach((pos, i) => result.splice(pos + i, 0, tzQuestions[i]));
  return result.slice(0, TOTAL_QUESTIONS);
}

export function checkMapClick(targetCode: string, clickedCode: string): boolean {
  return targetCode === clickedCode;
}

export function checkTimezoneClick(timezone: Timezone, clickedCode: string, allStates: StateEntry[]): boolean {
  return allStates.find((s) => s.code === clickedCode)?.timezone === timezone;
}

export function isMapQuestion(q: PinQuestion): q is MapQuestion {
  return q.type === 'map';
}

export { calculatePoints };
