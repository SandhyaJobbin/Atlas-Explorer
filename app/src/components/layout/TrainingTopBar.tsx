import PlayerAvatar from './PlayerAvatar';
import VolumeControl from '@/components/ui/VolumeControl';
import { useSessionTimer } from '@/hooks/useSessionTimer';

interface TrainingTopBarProps {
  explored: number;
  total: number;
  label: string;
  onExit?: () => void;
}

export default function TrainingTopBar({ explored, total, label, onExit }: TrainingTopBarProps) {
  const pct = Math.round((explored / total) * 100);
  const { pillLabel, isUrgent } = useSessionTimer();

  return (
    <header className="bg-atlas-card text-atlas-ink px-6 py-3 flex items-center gap-6 relative z-50 border-b border-atlas-border shadow-sm">
      <div className="flex items-center gap-4">
        {onExit && (
          <button
            onClick={onExit}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-atlas-warm hover:bg-rose-500/10 hover:text-rose-600 border border-atlas-border transition-all group"
            title="Exit Training"
            aria-label="Exit Training"
          >
            <span className="text-2xl leading-none text-atlas-muted group-hover:text-rose-600">&times;</span>
          </button>
        )}
        <div className="flex flex-col">
          <span className="font-black text-atlas-gold tracking-[0.2em] text-xs uppercase">
            Atlas Explorer
          </span>
          <span className="text-atlas-muted text-xs uppercase tracking-widest font-bold">{label}</span>
        </div>
      </div>

      <div className="h-8 w-px bg-atlas-border mx-2 hidden sm:block" />

      {/* Live Session Timer */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
        isUrgent 
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 animate-pulse' 
          : 'bg-atlas-warm border-atlas-border text-atlas-muted'
      }`}>
        <span>⏱️</span>
        <span className="font-mono tracking-tight">{pillLabel}</span>
      </div>

      <div className="ml-auto flex items-center gap-6">
        {/* Master Volume Control */}
        <VolumeControl />

        {/* Exploration Progress */}
        <div className="flex flex-col items-end hidden md:flex">
          <span className="text-xs text-atlas-muted uppercase tracking-[0.2em] font-black">Expedition Progress</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-atlas-ink">
              {explored} <span className="text-atlas-muted font-normal">/</span> {total}
            </span>
            <div className="w-24 h-1.5 bg-atlas-warm rounded-full overflow-hidden border border-atlas-border shadow-inner">
              <div
                className="h-full bg-atlas-accent transition-all duration-500 shadow-[0_0_10px_rgba(46,125,50,0.4)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Player Avatar & Rank Ring */}
        <PlayerAvatar />
      </div>
    </header>
  );
}
