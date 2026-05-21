import { GAME_DEFINITIONS } from './session';

export function clampGameIndex(index: number, fallbackIndex = 0): number {
  const safeFallback = Number.isInteger(fallbackIndex) ? fallbackIndex : 0;
  const maxIndex = GAME_DEFINITIONS.length - 1;
  const clampedFallback = Math.max(0, Math.min(safeFallback, maxIndex));

  if (!Number.isInteger(index)) return clampedFallback;
  return Math.max(0, Math.min(index, maxIndex));
}

export function resolveGameParam(param: string | null, fallbackIndex = 0): number {
  if (!param) return clampGameIndex(fallbackIndex);

  const byKey = GAME_DEFINITIONS.findIndex((game) => game.key === param);
  if (byKey >= 0) return byKey;

  if (/^\d+$/.test(param)) {
    return clampGameIndex(Number(param), fallbackIndex);
  }

  return clampGameIndex(fallbackIndex);
}
