import type { StateEntry } from '@/types';
import { publicAsset } from '@/lib/assets';
import { useMemo } from 'react';
import { TZ_COLORS } from '@/lib/timezones';

const FLAG: Record<'US' | 'CA', string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
};

const COUNTRY_THEME = {
  US: {
    accent: 'text-[#232F3E]',
    bg: 'bg-[#F5F0E8]',
    border: 'border-white/70',
    header: 'text-[#232F3E]',
    pill: 'bg-[#232F3E] text-[#FEBD69]',
    label: 'text-[#2D3B2F]/50',
  },
  CA: {
    accent: 'text-[#C41E3A]',
    bg: 'bg-[#FFF5F5]',
    border: 'border-[#C41E3A]/40',
    header: 'text-[#C41E3A]',
    pill: 'bg-[#C41E3A] text-white',
    label: 'text-[#C41E3A]/50',
  },
};

interface StateInfoPanelProps {
  state: StateEntry;
  onClose: () => void;
}

export default function StateInfoPanel({ state, onClose }: StateInfoPanelProps) {
  if (!state) return null;
  const tzColor = TZ_COLORS[state.timezone] ?? 'bg-gray-500 text-white';
  const theme = COUNTRY_THEME[state.country] ?? COUNTRY_THEME.US;

  const triviaFact = useMemo(() => {
    if (!state.trivia || state.trivia.length === 0) return null;
    return state.trivia[Math.floor(Math.random() * state.trivia.length)];
  }, [state.code, state.trivia]);

  return (
    <div className={`pointer-events-auto relative flex max-h-full min-h-0 w-full max-w-80 flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl border ${theme.border} bg-white/95 p-5 shadow-2xl backdrop-blur-sm paper-texture`}>
      {/* Country Watercolor Accent */}
      <div 
        className="watercolor-splash right-[-100px] top-[-100px] opacity-10" 
        style={{ 
          backgroundImage: `url("${publicAsset(state.country === 'CA' ? '/assets/illustrations/splash-forest.png' : '/assets/illustrations/splash-water.png')}")`,
          width: '200px',
          height: '200px'
        }} 
      />

      <button 
        onClick={onClose}
        className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 bg-[#232F3E]/5 px-2 py-1 rounded-md border border-[#232F3E]/5">
            <span className="text-[9px] font-black uppercase tracking-wider text-[#232F3E]/30">Phase 00</span>
            <div className="w-px h-2.5 bg-[#232F3E]/10" />
            <span className={`text-[9px] font-black uppercase tracking-wider ${theme.header}`}>{state.code}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${tzColor}`}
            >
              {state.timezone}
            </span>
            <span className="text-xl">{FLAG[state.country]}</span>
          </div>
        </div>
        
        <div className="mt-1">
          <h2 className={`text-3xl sm:text-4xl font-black ${theme.header} leading-[1.1] tracking-tight`}>
            {state.name}
          </h2>
          <p className={`mt-1 text-[11px] font-bold tracking-wider ${theme.label}`}>
            {state.region.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className={`${theme.bg} rounded-lg p-3`}>
          <p className={`${theme.label} text-[10px] font-bold tracking-wide mb-1`}>Capital</p>
          <p className={`font-semibold ${theme.header}`}>{state.capital}</p>
        </div>
        <div className={`${theme.bg} rounded-lg p-3`}>
          <p className={`${theme.label} text-[10px] font-bold tracking-wide mb-1`}>Timezone</p>
          <p className={`font-semibold ${theme.header}`}>{state.timezoneLabel}</p>
        </div>
        <div className={`${theme.bg} rounded-lg p-3 col-span-2`}>
          <p className={`${theme.label} text-[10px] font-bold tracking-wide mb-1`}>Coast</p>
          <p className={`font-semibold ${theme.header}`}>{state.coast}</p>
        </div>
      </div>

      {/* Specialties */}
      {state.specialties.length > 0 && (
        <div>
          <p className={`${theme.label} text-[10px] font-bold tracking-wide mb-2`}>Known For</p>
          <div className="flex flex-wrap gap-2">
            {state.specialties.map((s) => (
              <span
                key={s}
                className={`${theme.pill} text-[10px] font-bold px-2.5 py-1 rounded-lg`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trivia */}
      {triviaFact && (
        <div className={`mt-2 rounded-xl border border-dashed ${theme.border} p-3 bg-white/50`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">💡</span>
            <p className={`${theme.label} text-[10px] font-black tracking-wider`}>Did you know?</p>
          </div>
          <p className={`text-xs font-medium leading-relaxed ${theme.header}`}>
            {triviaFact}
          </p>
        </div>
      )}
    </div>
  );
}
