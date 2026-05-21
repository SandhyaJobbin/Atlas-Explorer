import { useState } from 'react';
import { BookOpen, Columns3, Printer, Table2 } from 'lucide-react';
import type { StateEntry } from '@/types';

type CheatSheetProps = {
  states: StateEntry[];
};

type ViewMode = 'clusters' | 'table';

const REGION_ORDER = [
  'West',
  'Southwest',
  'Midwest',
  'Southeast',
  'Northeast',
  'Western Canada',
  'Eastern Canada',
];

function groupByRegion(states: StateEntry[]) {
  const groups = states.reduce<Record<string, StateEntry[]>>((acc, state) => {
    const key = state.region || 'Other';
    acc[key] = acc[key] || [];
    acc[key].push(state);
    return acc;
  }, {});

  return Object.entries(groups)
    .sort(([a], [b]) => {
      const ai = REGION_ORDER.indexOf(a);
      const bi = REGION_ORDER.indexOf(b);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.localeCompare(b);
    })
    .map(([region, entries]) => ({
      region,
      entries: entries.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

function RegionRows({ entries }: { entries: StateEntry[] }) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {entries.map((state) => (
        <div
          key={state.code}
          className="cheat-sheet-row grid grid-cols-[minmax(0,1.25fr)_3.5rem_minmax(0,0.9fr)_4.5rem] items-center gap-2 rounded-lg border border-atlas-border bg-atlas-warm px-3 py-2 text-label text-atlas-ink"
        >
          <span className="min-w-0 truncate font-black">{state.name}</span>
          <code className="rounded border border-atlas-border bg-atlas-card px-1.5 py-0.5 text-center font-mono font-black">
            {state.code}
          </code>
          <span className="min-w-0 truncate font-medium text-atlas-muted">{state.capital}</span>
          <span className="text-right font-mono font-black text-atlas-accent">{state.timezone}</span>
        </div>
      ))}
    </div>
  );
}

export function CheatSheet({ states }: CheatSheetProps) {
  const groups = groupByRegion(states);
  const total = states.length;
  const [mode, setMode] = useState<ViewMode>(() => {
    return (globalThis.localStorage?.getItem('atlas_cheat_sheet_mode') as ViewMode | null) || 'clusters';
  });

  function handleModeChange(nextMode: ViewMode) {
    globalThis.localStorage?.setItem('atlas_cheat_sheet_mode', nextMode);
    setMode(nextMode);
  }

  return (
    <CheatSheetInner groups={groups} states={states} total={total} mode={mode} onModeChange={handleModeChange} />
  );
}

function CheatSheetInner({
  groups,
  states,
  total,
  mode,
  onModeChange,
}: {
  groups: ReturnType<typeof groupByRegion>;
  states: StateEntry[];
  total: number;
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  function handlePrint() {
    if (mode !== 'clusters') {
      onModeChange('clusters');
      window.setTimeout(() => window.print(), 0);
      return;
    }

    window.print();
  }

  return (
    <section className="cheat-sheet-print-root rounded-3xl border border-atlas-border bg-atlas-card p-6 shadow-md paper-texture">
      <div className="cheat-sheet-print-page">
        <div className="flex flex-col gap-4 border-b border-atlas-border pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-atlas-accent/20 bg-atlas-accent/10 text-atlas-accent">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-label font-black uppercase tracking-widest text-atlas-accent">Take-home reference</p>
              <h2 className="font-display text-2xl font-black tracking-tight text-atlas-ink">Atlas Explorer Cheat Sheet</h2>
              <p className="mt-1 max-w-2xl text-body font-medium text-atlas-muted">
                All {total} regions grouped for quick review, with postal code, timezone, and capital.
              </p>
            </div>
          </div>

          <div className="cheat-sheet-screen-only flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onModeChange('clusters')}
              className={[
                'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-label font-black transition-all',
                mode === 'clusters'
                  ? 'border-atlas-accent bg-atlas-accent/15 text-atlas-accent'
                  : 'border-atlas-border bg-atlas-warm text-atlas-ink hover:bg-atlas-accent/10',
              ].join(' ')}
            >
              <Columns3 className="h-4 w-4" aria-hidden="true" />
              Clusters
            </button>
            <button
              type="button"
              onClick={() => onModeChange('table')}
              className={[
                'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-label font-black transition-all',
                mode === 'table'
                  ? 'border-atlas-accent bg-atlas-accent/15 text-atlas-accent'
                  : 'border-atlas-border bg-atlas-warm text-atlas-ink hover:bg-atlas-accent/10',
              ].join(' ')}
            >
              <Table2 className="h-4 w-4" aria-hidden="true" />
              Table
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-atlas-gold bg-atlas-gold/20 px-4 py-2 text-label font-black text-atlas-ink transition-all hover:bg-atlas-gold/30 active:scale-95"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Download PDF
            </button>
          </div>
        </div>

        {states.length === 0 ? (
          <div className="cheat-sheet-screen-only py-10 text-center text-body font-bold text-atlas-muted">
            Loading reference sheet...
          </div>
        ) : mode === 'table' ? (
          <div className="cheat-sheet-scroll mt-5 max-h-[560px] overflow-auto rounded-2xl border border-atlas-border">
            <table className="w-full border-collapse text-left text-body">
              <thead className="sticky top-0 z-10 bg-atlas-accent-light text-label uppercase tracking-widest text-atlas-accent">
                <tr>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Timezone</th>
                  <th className="px-4 py-3">Capital</th>
                </tr>
              </thead>
              <tbody>
                {states
                  .slice()
                  .sort((a, b) => `${a.region}-${a.name}`.localeCompare(`${b.region}-${b.name}`))
                  .map((state) => (
                    <tr key={state.code} className="border-t border-atlas-border bg-atlas-card">
                      <td className="px-4 py-3 font-bold text-atlas-muted">{state.region}</td>
                      <td className="px-4 py-3 font-black text-atlas-ink">{state.name}</td>
                      <td className="px-4 py-3">
                        <code className="rounded border border-atlas-border bg-atlas-warm px-2 py-1 font-mono font-black text-atlas-ink">
                          {state.code}
                        </code>
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-atlas-accent">
                        {state.timezone} <span className="font-sans font-medium text-atlas-muted">({state.timezoneLabel})</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-atlas-ink">{state.capital}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cheat-sheet-clusters mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <article key={group.region} className="cheat-sheet-cluster rounded-2xl border border-atlas-border bg-atlas-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-atlas-border pb-2">
                  <h3 className="font-display text-base font-black text-atlas-ink">{group.region}</h3>
                  <span className="rounded-full bg-atlas-accent/10 px-2.5 py-1 text-label font-black text-atlas-accent">
                    {group.entries.length}
                  </span>
                </div>
                <RegionRows entries={group.entries} />
              </article>
            ))}
          </div>
        )}

        <div className="cheat-sheet-print-note mt-5 hidden items-center justify-between border-t border-atlas-border pt-3 text-[11px] font-bold uppercase tracking-widest text-atlas-muted">
          <span>Atlas Explorer Cheat Sheet</span>
          <span>Name + postal code + timezone + capital</span>
        </div>
      </div>
    </section>
  );
}
