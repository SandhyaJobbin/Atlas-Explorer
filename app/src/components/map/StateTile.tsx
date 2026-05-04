import type { StateEntry, Timezone } from '@/types';

const TZ_BADGE: Record<Timezone, { bg: string; label: string }> = {
  PST:  { bg: 'bg-blue-600',    label: 'PST' },
  MST:  { bg: 'bg-orange-500',  label: 'MST' },
  CST:  { bg: 'bg-green-600',   label: 'CST' },
  EST:  { bg: 'bg-purple-600',  label: 'EST' },
  AKST: { bg: 'bg-sky-700',     label: 'AK'  },
  HST:  { bg: 'bg-cyan-600',    label: 'HST' },
  AST:  { bg: 'bg-purple-800',  label: 'AST' },
  NST:  { bg: 'bg-pink-700',    label: 'NST' },
};

interface StateTileProps {
  state: StateEntry;
  visited: boolean;
  active: boolean;
  onClick: (code: string) => void;
}

export default function StateTile({ state, visited, active, onClick }: StateTileProps) {
  const tz = TZ_BADGE[state.timezone] ?? { bg: 'bg-gray-500', label: state.timezone };

  let containerClass =
    'relative flex flex-col items-center justify-center gap-0.5 rounded-lg p-2 cursor-pointer select-none transition-all duration-150 border ';

  if (active) {
    containerClass += 'bg-[#FF9900] border-[#FF9900] shadow-lg scale-105 z-10';
  } else if (visited) {
    containerClass += 'bg-[#00A8A2]/15 border-[#00A8A2]/50 hover:bg-[#00A8A2]/25';
  } else {
    containerClass += 'bg-[#1a2a1a] border-white/10 hover:border-white/30 hover:bg-[#243224]';
  }

  return (
    <button
      type="button"
      onClick={() => onClick(state.code)}
      className={containerClass}
      title={`${state.name} — ${state.timezone}`}
    >
      {/* Visited checkmark */}
      {visited && !active && (
        <span className="absolute top-1 right-1 text-[#00A8A2] text-[10px] leading-none">✓</span>
      )}

      {/* State code */}
      <span
        className={`text-base font-black leading-none ${
          active ? 'text-white' : visited ? 'text-[#00A8A2]' : 'text-white/40'
        }`}
      >
        {state.code}
      </span>

      {/* State name */}
      <span
        className={`text-[9px] leading-tight text-center max-w-full truncate ${
          active ? 'text-white/90' : visited ? 'text-[#00A8A2]/70' : 'text-white/25'
        }`}
      >
        {state.name}
      </span>

      {/* TZ badge */}
      <span
        className={`text-[8px] font-bold px-1 py-0.5 rounded-sm leading-none mt-0.5 ${
          active ? 'bg-white/30 text-white' : `${tz.bg} text-white ${visited ? 'opacity-90' : 'opacity-40'}`
        }`}
      >
        {tz.label}
      </span>
    </button>
  );
}
