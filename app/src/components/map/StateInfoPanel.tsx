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
  state: StateEntry;
  onClose: () => void;
}

export default function StateInfoPanel({ state, onClose }: StateInfoPanelProps) {
  if (!state) return null;
  const tzColor = TZ_COLORS[state.timezone] ?? 'bg-gray-500 text-white';

  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl shadow-2xl w-80 relative border border-gray-100">
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
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
