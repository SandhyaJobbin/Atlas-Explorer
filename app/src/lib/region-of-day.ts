import type { StateEntry } from '@/types';

function hashDateLabel(label: string) {
  let hash = 0;

  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }

  return hash;
}

export function getRegionOfDay(regions: StateEntry[], date = new Date()) {
  if (regions.length === 0) return null;

  const index = hashDateLabel(date.toDateString()) % regions.length;
  return regions[index];
}

export function getRegionFlag(region: StateEntry) {
  return region.country === 'CA' ? '🇨🇦' : '🇺🇸';
}

export function getRegionTrivia(region: StateEntry) {
  return region.trivia?.[0] ?? `${region.name} is part of the ${region.region} region.`;
}
