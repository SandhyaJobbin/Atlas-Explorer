import type { StateEntry, Timezone } from '@/types';

// ─── Timezone color chips ─────────────────────────────────────────────────────
const TZ_COLORS: Record<Timezone, string> = {
  AKST: 'bg-sky-700 text-white',
  PST:  'bg-blue-600 text-white',
  MST:  'bg-orange-500 text-white',
  CST:  'bg-green-600 text-white',
  EST:  'bg-purple-600 text-white',
  AST:  'bg-purple-800 text-white',
  NST:  'bg-pink-700 text-white',
  HST:  'bg-cyan-600 text-white',
};

const FLAG: Record<'US' | 'CA', string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
};

interface StateInfoPanelProps {
  state: StateEntry | null;
}

export default function StateInfoPanel({ state }: StateInfoPanelProps) {
  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#2D3B2F]/40 text-sm gap-2 py-8">
        <span className="text-3xl">🗺️</span>
        <p>Click a state or province on the map</p>
      </div>
    );
  }

  const tzColor = TZ_COLORS[state.timezone] ?? 'bg-gray-500 text-white';

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-[#232F3E]">{state.code}</span>
            <span className="text-lg">{FLAG[state.country]}</span>
          </div>
          <h2 className="text-xl font-bold text-[#2D3B2F] leading-tight">{state.name}</h2>
          <p className="text-sm text-[#2D3B2F]/60">{state.region}</p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${tzColor}`}
        >
          {state.timezone}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#F5F0E8] rounded-lg p-3">
          <p className="text-[#2D3B2F]/50 text-xs uppercase tracking-wide mb-1">Capital</p>
          <p className="font-semibold text-[#232F3E]">{state.capital}</p>
        </div>
        <div className="bg-[#F5F0E8] rounded-lg p-3">
          <p className="text-[#2D3B2F]/50 text-xs uppercase tracking-wide mb-1">Timezone</p>
          <p className="font-semibold text-[#232F3E]">{state.timezoneLabel}</p>
        </div>
        <div className="bg-[#F5F0E8] rounded-lg p-3 col-span-2">
          <p className="text-[#2D3B2F]/50 text-xs uppercase tracking-wide mb-1">Coast</p>
          <p className="font-semibold text-[#232F3E]">{state.coast}</p>
        </div>
      </div>

      {/* Specialties */}
      {state.specialties.length > 0 && (
        <div>
          <p className="text-[#2D3B2F]/50 text-xs uppercase tracking-wide mb-2">Known For</p>
          <div className="flex flex-wrap gap-2">
            {state.specialties.map((s) => (
              <span
                key={s}
                className="bg-[#232F3E] text-[#FEBD69] text-xs px-2 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
