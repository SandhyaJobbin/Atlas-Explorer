import { describe, expect, it } from 'vitest';
import { clampGameIndex, resolveGameParam } from '@/lib/game-route';

describe('game route helpers', () => {
  it('resolves numeric game params', () => {
    expect(resolveGameParam('0', 1)).toBe(0);
    expect(resolveGameParam('1', 0)).toBe(1);
    expect(resolveGameParam('2', 0)).toBe(2);
  });

  it('resolves stable game keys', () => {
    expect(resolveGameParam('crack', 2)).toBe(0);
    expect(resolveGameParam('pin', 0)).toBe(1);
    expect(resolveGameParam('sorter', 0)).toBe(2);
  });

  it('falls back for malformed params', () => {
    expect(resolveGameParam('bad', 1)).toBe(1);
    expect(resolveGameParam('crack-the-code', 2)).toBe(2);
    expect(resolveGameParam(null, 2)).toBe(2);
  });

  it('clamps indexes to the available games', () => {
    expect(clampGameIndex(-1, 1)).toBe(0);
    expect(clampGameIndex(99, 1)).toBe(2);
    expect(resolveGameParam('99', 1)).toBe(2);
  });
});
