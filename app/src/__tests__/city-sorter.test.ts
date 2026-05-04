import { describe, it, expect } from 'vitest';
import {
  buildRounds,
  isCorrectPlacement,
  TOTAL_ROUNDS,
  BUCKETS_PER_ROUND,
  CITIES_PER_BUCKET,
} from '@/lib/city-sorter';
import type { CityEntry, CityWithId } from '@/lib/city-sorter';

function makeCities(): CityEntry[] {
  const states = Array.from({ length: 15 }, (_, i) => ({
    code: `ST${i}`,
    name: `State ${i}`,
  }));
  return states.flatMap((state) =>
    Array.from({ length: 3 }, (_, j) => ({
      name: `City-${state.code}-${j}`,
      stateCode: state.code,
      stateName: state.name,
      country: 'US',
    })),
  );
}

describe('city-sorter', () => {
  const cities = makeCities();

  it('buildRounds creates correct number of rounds', () => {
    const rounds = buildRounds(cities);
    expect(rounds).toHaveLength(TOTAL_ROUNDS);
  });

  it('each round has correct number of buckets', () => {
    const rounds = buildRounds(cities);
    rounds.forEach((round) => {
      expect(round.buckets).toHaveLength(BUCKETS_PER_ROUND);
    });
  });

  it('each round has correct number of cities', () => {
    const rounds = buildRounds(cities);
    rounds.forEach((round) => {
      expect(round.cities).toHaveLength(BUCKETS_PER_ROUND * CITIES_PER_BUCKET);
    });
  });

  it('cities have unique ids', () => {
    const rounds = buildRounds(cities);
    const allIds = rounds.flatMap((r) => r.cities.map((c) => c.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('throws when not enough eligible state groups', () => {
    const small = [
      { name: 'A', stateCode: 'S1', stateName: 'S1', country: 'US' },
      { name: 'B', stateCode: 'S1', stateName: 'S1', country: 'US' },
    ];
    expect(() => buildRounds(small)).toThrow(/Need at least/);
  });

  it('isCorrectPlacement validates city stateCode', () => {
    const city: CityWithId = { id: 'test', name: 'Test', stateCode: 'TX', stateName: 'Texas', country: 'US' };
    expect(isCorrectPlacement(city, 'TX')).toBe(true);
    expect(isCorrectPlacement(city, 'CA')).toBe(false);
  });
});
