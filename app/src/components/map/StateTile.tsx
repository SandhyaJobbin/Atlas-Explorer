import type { StateEntry } from '@/types';
import { TZ_COLORS_HEX } from '@/lib/timezones';

interface StateTileProps {
  state: StateEntry;
  visited: boolean;
  active: boolean;
  onClick: (code: string) => void;
}

export default function StateTile({ state, visited, active, onClick }: StateTileProps) {
  const tzBg = TZ_COLORS_HEX[state.timezone] ?? 'bg-atlas-muted';

  let containerClass =
    'relative flex flex-col items-center justify-center gap-0.5 rounded-lg p-2 cursor-pointer select-none transition-all duration-150 border ';

  if (active) {
    containerClass += 'bg-atlas-accent border-atlas-accent shadow-lg scale-105 z-10';
  } else if (visited) {
    containerClass += 'bg-atlas-gold/15 border-atlas-gold/50 hover:bg-atlas-gold/25';
  } else {
    containerClass += 'bg-atlas-card border-atlas-border hover:border-atlas-muted hover:bg-atlas-warm';
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
        <span className="absolute top-1 right-1 text-atlas-gold text-xs leading-none">✓</span>
      )}

      {/* State code */}
      <span
        className={`text-base font-black leading-none ${
          active ? 'text-white' : visited ? 'text-atlas-gold' : 'text-atlas-muted'
        }`}
      >
        {state.code}
      </span>

      {/* State name */}
      <span
        className={`text-xs leading-tight text-center max-w-full truncate ${
          active ? 'text-white/90' : visited ? 'text-atlas-ink/80' : 'text-atlas-muted/60'
        }`}
      >
        {state.name}
      </span>

      {/* TZ badge */}
      <span
        className={`text-xs font-bold px-1 py-0.5 rounded-sm leading-none mt-0.5 ${
          active ? 'bg-white/30 text-white' : `${tzBg} text-white ${visited ? 'opacity-90' : 'opacity-40'}`
        }`}
      >
        {state.timezone}
      </span>
    </button>
  );
}

