import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import type { StateEntry, Timezone } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import TrainingTopBar from '@/components/layout/TrainingTopBar';
import StateTile from '@/components/map/StateTile';
import StateInfoPanel from '@/components/map/StateInfoPanel';

// ─── Filter types ──────────────────────────────────────────────────────────────

type CountryFilter = 'all' | 'US' | 'CA';
type TZFilter = 'all' | Timezone;
type RegionFilter =
  | 'all'
  | 'Northeast'
  | 'Southeast'
  | 'Midwest'
  | 'West'
  | 'Southwest'
  | 'Western Canada'
  | 'Eastern Canada';

const COUNTRY_TABS: { value: CountryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'US',  label: '🇺🇸 US' },
  { value: 'CA',  label: '🇨🇦 Canada' },
];

const TZ_TABS: { value: TZFilter; label: string }[] = [
  { value: 'all',  label: 'All TZ' },
  { value: 'PST',  label: 'Pacific' },
  { value: 'MST',  label: 'Mountain' },
  { value: 'CST',  label: 'Central' },
  { value: 'EST',  label: 'Eastern' },
  { value: 'AKST', label: 'Alaska' },
  { value: 'HST',  label: 'Hawaii' },
  { value: 'AST',  label: 'Atlantic' },
  { value: 'NST',  label: 'Newfoundland' },
];

const REGION_TABS: { value: RegionFilter; label: string }[] = [
  { value: 'all',            label: 'All Regions' },
  { value: 'Northeast',      label: 'Northeast' },
  { value: 'Southeast',      label: 'Southeast' },
  { value: 'Midwest',        label: 'Midwest' },
  { value: 'West',           label: 'West' },
  { value: 'Southwest',      label: 'Southwest' },
  { value: 'Western Canada', label: 'W. Canada' },
  { value: 'Eastern Canada', label: 'E. Canada' },
];

const TOTAL = 63;

export default function GeoTilesPage() {
  const { session, updateTraining } = useSession();
  const navigate = useNavigate();

  const [states, setStates] = useState<StateEntry[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<CountryFilter>('all');
  const [tzFilter, setTZFilter] = useState<TZFilter>('all');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const didNavigate = useRef(false);

  const clicked = session?.training.geoTilesClicked ?? [];
  const allDone = clicked.length >= TOTAL;

  // Load state data
  useEffect(() => {
    fetch('/data/states.json')
      .then((r) => r.json())
      .then(setStates)
      .catch(console.error);
  }, []);

  // Auto-navigate when all tiles explored
  useEffect(() => {
    if (allDone && !didNavigate.current) {
      didNavigate.current = true;
      const t = setTimeout(() => navigate('/train/complete'), 800);
      return () => clearTimeout(t);
    }
  }, [allDone, navigate]);

  function handleTileClick(code: string) {
    setActiveCode(code);
    updateTraining('tiles', code);
  }

  // Apply filters
  const filteredStates = states.filter((s) => {
    if (countryFilter !== 'all' && s.country !== countryFilter) return false;
    if (tzFilter !== 'all' && s.timezone !== tzFilter) return false;
    if (regionFilter !== 'all' && s.region !== regionFilter) return false;
    return true;
  });

  const activeState = states.find((s) => s.code === activeCode) ?? null;

  // ─── Filter tab button helper ────────────────────────────────────────────────
  function tabClass(active: boolean) {
    return `px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
      active
        ? 'bg-[#232F3E] text-white'
        : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
    }`;
  }

  return (
    <AppLayout variant="training">
      <TrainingTopBar explored={clicked.length} total={TOTAL} label="Zone 2 — Geo Tiles" />

      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* ── Tile grid panel ─────────────────────────────────────────────────── */}
        <div className="flex-1 bg-[#0d1a0d] flex flex-col gap-3 p-4 min-h-0">

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00A8A2] rounded-full transition-all duration-500"
                style={{ width: `${(clicked.length / TOTAL) * 100}%` }}
              />
            </div>
            <span className="text-[#00A8A2] text-sm font-semibold tabular-nums shrink-0">
              {clicked.length}/{TOTAL}
            </span>
          </div>

          {/* Country filter row */}
          <div className="flex items-center gap-2 flex-wrap">
            {COUNTRY_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setCountryFilter(tab.value)}
                className={tabClass(countryFilter === tab.value)}
              >
                {tab.label}
              </button>
            ))}
            <span className="text-white/20 text-xs ml-auto">
              {filteredStates.length} shown
            </span>
          </div>

          {/* Timezone filter row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {TZ_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTZFilter(tab.value)}
                className={tabClass(tzFilter === tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Region filter row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {REGION_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setRegionFilter(tab.value)}
                className={tabClass(regionFilter === tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tile grid */}
          <div className="flex-1 overflow-y-auto">
            {states.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/30 text-sm">
                Loading tiles…
              </div>
            ) : filteredStates.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/30 text-sm">
                No tiles match this filter
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {filteredStates.map((state) => (
                  <StateTile
                    key={state.code}
                    state={state}
                    visited={clicked.includes(state.code)}
                    active={activeCode === state.code}
                    onClick={handleTileClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completion banner */}
          {allDone && (
            <div className="text-center py-2 text-[#00A8A2] font-bold text-sm animate-pulse">
              All tiles explored — continuing…
            </div>
          )}

          <p className="text-white/30 text-xs text-center">
            Click each tile to mark it explored
          </p>
        </div>

        {/* ── Info panel ──────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <StateInfoPanel state={activeState} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/train/complete')}
              disabled={!allDone}
              className="w-full bg-[#232F3E] hover:bg-[#2D3B2F] disabled:opacity-30 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {allDone
                ? 'Continue to Training Complete →'
                : `${TOTAL - clicked.length} more to explore`}
            </button>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
