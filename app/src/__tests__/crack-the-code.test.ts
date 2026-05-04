import { describe, it, expect } from 'vitest';
import {
  pickQuestions,
  checkCodeAnswer,
  checkTimezoneAnswer,
  TOTAL_QUESTIONS,
  TIMEZONE_Q_COUNT,
} from '@/lib/crack-the-code';
import type { StateEntry } from '@/types';

function makeFakeStates(count = 30): StateEntry[] {
  const timezones = ['PST', 'MST', 'CST', 'EST'] as const;
  return Array.from({ length: count }, (_, i) => ({
    code: `S${i}`,
    name: `State ${i}`,
    country: 'US' as const,
    region: 'Test',
    common: i < 10,
    capital: `Capital ${i}`,
    timezone: timezones[i % timezones.length],
    timezoneLabel: 'Pacific' as const,
    coast: 'Inland' as const,
    specialties: [],
  }));
}

describe('crack-the-code', () => {
  const states = makeFakeStates();

  it('pickQuestions returns exactly TOTAL_QUESTIONS', () => {
    const questions = pickQuestions(states);
    expect(questions).toHaveLength(TOTAL_QUESTIONS);
  });

  it('includes timezone questions', () => {
    const questions = pickQuestions(states);
    const tzCount = questions.filter((q) => q.type === 'timezone').length;
    expect(tzCount).toBe(TIMEZONE_Q_COUNT);
  });

  it('code questions do not repeat states', () => {
    const questions = pickQuestions(states);
    const codes = questions.filter((q) => q.type === 'code').map((q) => q.state.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('timezone questions have choices including correct answer', () => {
    const questions = pickQuestions(states);
    const tzQ = questions.find((q) => q.type === 'timezone');
    expect(tzQ).toBeDefined();
    if (tzQ?.type === 'timezone') {
      expect(tzQ.choices).toContain(tzQ.state.timezone);
    }
  });

  it('checkCodeAnswer is case-insensitive', () => {
    expect(checkCodeAnswer('TX', 'tx')).toBe(true);
    expect(checkCodeAnswer('tx', 'TX')).toBe(true);
  });

  it('checkCodeAnswer trims whitespace', () => {
    expect(checkCodeAnswer('CA', '  CA  ')).toBe(true);
  });

  it('checkCodeAnswer rejects wrong input', () => {
    expect(checkCodeAnswer('TX', 'CA')).toBe(false);
  });

  it('checkTimezoneAnswer validates exact match', () => {
    expect(checkTimezoneAnswer('PST', 'PST')).toBe(true);
    expect(checkTimezoneAnswer('PST', 'EST')).toBe(false);
  });
});
