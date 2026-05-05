// Timezone type is defined in @/types/index.ts

export const TOTAL_ROUNDS       = 4;
export const BUCKETS_PER_ROUND  = 3;   // number of timezone buckets shown at once
export const STATES_PER_BUCKET  = 2;   // states per bucket per round
export const TIME_PER_ROUND     = 90;
export const SPEED_WINDOW       = 45;
export const TOTAL_CORRECT      = TOTAL_ROUNDS * BUCKETS_PER_ROUND * STATES_PER_BUCKET;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StateCard {
  /** Unique id for drag/drop tracking */
  id: string;
  code: string;
  name: string;
  timezone: string;
  country: string;
}

export interface TzBucket {
  timezone: string;
  timezoneLabel: string;
}

export interface TzRound {
  buckets: TzBucket[];
  states: StateCard[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Full set of timezones with their display labels */
export const TZ_POOL: Array<{ timezone: string; timezoneLabel: string }> = [
  { timezone: 'PST',  timezoneLabel: 'Pacific'  },
  { timezone: 'MST',  timezoneLabel: 'Mountain' },
  { timezone: 'CST',  timezoneLabel: 'Central'  },
  { timezone: 'EST',  timezoneLabel: 'Eastern'  },
  { timezone: 'AKST', timezoneLabel: 'Alaska'   },
  { timezone: 'HST',  timezoneLabel: 'Hawaii'   },
  { timezone: 'AST',  timezoneLabel: 'Atlantic' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Round builder ─────────────────────────────────────────────────────────────

/** A minimal state entry shape (matches states.json) */
interface RawState {
  code: string;
  name: string;
  timezone: string;
  country: string;
  [key: string]: unknown;
}

export function buildTzRounds(allStates: RawState[]): TzRound[] {
  // Group states by timezone
  const byTz = new Map<string, RawState[]>();
  for (const s of allStates) {
    if (!byTz.has(s.timezone)) byTz.set(s.timezone, []);
    byTz.get(s.timezone)!.push(s);
  }

  // Keep only timezones that have enough states
  const eligibleTzs = [...byTz.entries()]
    .filter(([, states]) => states.length >= STATES_PER_BUCKET)
    .map(([tz]) => tz);

  if (eligibleTzs.length < BUCKETS_PER_ROUND) {
    throw new Error(`Need at least ${BUCKETS_PER_ROUND} timezones with ${STATES_PER_BUCKET}+ states each`);
  }

  // We'll re-use timezones across rounds but pick different states each time.
  // Each round picks BUCKETS_PER_ROUND timezones at random (from those with enough remaining states).
  // Track which states have already been used.
  const usedCodes = new Set<string>();

  const rounds: TzRound[] = [];

  for (let ri = 0; ri < TOTAL_ROUNDS; ri++) {
    // Pick a fresh set of BUCKETS_PER_ROUND eligible timezones
    const available = eligibleTzs.filter((tz) => {
      const remaining = byTz.get(tz)!.filter((s) => !usedCodes.has(s.code));
      return remaining.length >= STATES_PER_BUCKET;
    });

    if (available.length < BUCKETS_PER_ROUND) {
      // Fallback: reset used codes so we can repeat states (unlikely for 63-state dataset)
      usedCodes.clear();
    }

    const pickedTzs = shuffle(
      eligibleTzs.filter((tz) => byTz.get(tz)!.filter((s) => !usedCodes.has(s.code)).length >= STATES_PER_BUCKET)
    ).slice(0, BUCKETS_PER_ROUND);

    const buckets: TzBucket[] = pickedTzs.map((tz) => {
      const meta = TZ_POOL.find((t) => t.timezone === tz) ?? { timezone: tz, timezoneLabel: tz };
      return { timezone: tz, timezoneLabel: meta.timezoneLabel };
    });

    const states: StateCard[] = shuffle(
      pickedTzs.flatMap((tz) => {
        const pool = shuffle(byTz.get(tz)!.filter((s) => !usedCodes.has(s.code)));
        return pool.slice(0, STATES_PER_BUCKET).map((s): StateCard => {
          usedCodes.add(s.code);
          return {
            id: `${ri}-${s.code}`,
            code: s.code,
            name: s.name,
            timezone: s.timezone,
            country: s.country,
          };
        });
      })
    );

    rounds.push({ buckets, states });
  }

  return rounds;
}

export function isCorrectTzPlacement(card: StateCard, timezone: string): boolean {
  return card.timezone === timezone;
}
