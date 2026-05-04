import { describe, it, expect } from 'vitest';
import {
  pickPinQuestions,
  checkMapClick,
  checkTimezoneClick,
  TOTAL_QUESTIONS,
  TIMEZONE_Q_COUNT,
} from '@/lib/pin-it';
import type { StateEntry } from '@/types';

function makeFakeStates(count = 30): StateEntry[] {
  const timezones = ['PST', 'MST', 'CST', 'EST'] as const;
  const codes = ['TX', 'CA', 'ON', 'BC', 'FL', 'NY', ...Array.from({ length: count - 6 }, (_, i) => `X${i}`)];
  return codes.slice(0, count).map((code, i) => ({
    code,
    name: `State ${code}`,
    country: (i < 20 ? 'US' : 'CA') as 'US' | 'CA',
    region: 'Test',
    common: true,
    capital: `Capital ${code}`,
    timezone: timezones[i % timezones.length],
    timezoneLabel: 'Pacific' as const,
    coast: 'Inland' as const,
    specialties: [],
  }));
}

describe('pin-it', () => {
  const states = makeFakeStates();

  it('pickPinQuestions returns exactly TOTAL_QUESTIONS', () => {
    const questions = pickPinQuestions(states);
    expect(questions).toHaveLength(TOTAL_QUESTIONS);
  });

  it('includes timezone questions', () => {
    const questions = pickPinQuestions(states);
    const tzCount = questions.filter((q) => q.type === 'timezone').length;
    expect(tzCount).toBe(TIMEZONE_Q_COUNT);
  });

  it('opening questions include priority codes', () => {
    const questions = pickPinQuestions(states);
    const mapQuestions = questions.filter((q) => q.type === 'map');
    const firstSix = mapQuestions.slice(0, 6).map((q) => (q as { type: 'map'; state: StateEntry }).state.code);
    const priorityCodes = ['TX', 'CA', 'ON', 'BC', 'FL', 'NY'];
    priorityCodes.forEach((code) => {
      expect(firstSix).toContain(code);
    });
  });

  it('checkMapClick compares codes exactly', () => {
    expect(checkMapClick('TX', 'TX')).toBe(true);
    expect(checkMapClick('TX', 'CA')).toBe(false);
  });

  it('checkTimezoneClick validates state timezone', () => {
    expect(checkTimezoneClick('PST', 'TX', states)).toBe(true); // TX is index 0 -> PST
    expect(checkTimezoneClick('EST', 'TX', states)).toBe(false);
  });
});
