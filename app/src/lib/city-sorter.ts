export const TOTAL_ROUNDS       = 4;
export const BUCKETS_PER_ROUND  = 3;
export const CITIES_PER_BUCKET  = 2;
export const TIME_PER_ROUND     = 90;
export const SPEED_WINDOW       = 45;
export const TOTAL_CORRECT      = TOTAL_ROUNDS * BUCKETS_PER_ROUND * CITIES_PER_BUCKET;

export interface CityEntry {
  name: string;
  stateCode: string;
  stateName: string;
  country: string;
}

export interface CityWithId extends CityEntry {
  id: string;
}

export interface Bucket {
  stateCode: string;
  stateName: string;
  country: string;
}

export interface Round {
  buckets: Bucket[];
  cities: CityWithId[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cityId(city: CityEntry): string {
  return `${city.stateCode}-${city.name}`.replace(/\s+/g, '-').replace(/[^A-Za-z0-9-]/g, '');
}

function groupByState(cities: CityEntry[]) {
  const map = new Map<string, { stateCode: string; stateName: string; country: string; cities: CityEntry[] }>();
  for (const city of cities) {
    if (!map.has(city.stateCode)) {
      map.set(city.stateCode, {
        stateCode: city.stateCode,
        stateName: city.stateName,
        country:   city.country,
        cities:    [],
      });
    }
    map.get(city.stateCode)!.cities.push(city);
  }
  return [...map.values()];
}

export function buildRounds(cities: CityEntry[]): Round[] {
  const eligible = shuffle(groupByState(cities).filter((g) => g.cities.length >= CITIES_PER_BUCKET));
  const needed   = TOTAL_ROUNDS * BUCKETS_PER_ROUND;
  if (eligible.length < needed) {
    throw new Error(`Need at least ${needed} state groups with ${CITIES_PER_BUCKET}+ cities`);
  }

  return Array.from({ length: TOTAL_ROUNDS }, (_, ri) => {
    const slice   = eligible.slice(ri * BUCKETS_PER_ROUND, ri * BUCKETS_PER_ROUND + BUCKETS_PER_ROUND);
    const buckets = slice.map(({ stateCode, stateName, country }): Bucket => ({ stateCode, stateName, country }));
    const citiesForRound: CityWithId[] = shuffle(
      slice.flatMap((g) =>
        shuffle(g.cities).slice(0, CITIES_PER_BUCKET).map((c) => ({ ...c, id: cityId(c) }))
      ),
    );
    return { buckets, cities: citiesForRound };
  });
}

export function isCorrectPlacement(city: CityWithId, stateCode: string): boolean {
  return city.stateCode === stateCode;
}
