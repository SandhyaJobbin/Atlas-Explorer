import { useState, useEffect } from 'react';
import RollingNumber from '@/components/ui/RollingNumber';
import PlayerAvatar from './PlayerAvatar';
import VolumeControl from '@/components/ui/VolumeControl';
import { StreakMeter } from '@/components/ui/StreakMeter';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useGameState } from '@/hooks/useGameState';

interface GameTopBarProps {
  gameLabel: string;
  score?: number;
  level?: number;
  totalLevels?: number;
  attemptNumber?: number;
  onExit?: () => void;
  isVaultOpen?: boolean;
  onVaultToggle?: () => void;
  streak?: number;
}

export default function GameTopBar({
  gameLabel,
  score: scoreProp,
  level: levelProp,
  totalLevels: totalLevelsProp,
  attemptNumber,
  onExit,
  isVaultOpen,
  onVaultToggle,
  streak: streakProp,
}: GameTopBarProps) {
  const liveState = useGameState();
  const score = scoreProp ?? (liveState.baselineScore + liveState.score);
  const level = levelProp ?? liveState.gameIndex + 1;
  const totalLevels = totalLevelsProp ?? 3;
  const streak = streakProp ?? liveState.streak;
  const { pillLabel, isUrgent } = useSessionTimer();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline Indicator (C4) */}
      {!isOnline && (
        <div className="bg-atlas-gold/20 border-b border-atlas-gold/30 text-atlas-ink text-center py-1 text-xs font-bold uppercase tracking-wider">
          Offline — progress saved locally
        </div>
      )}
      <header className="bg-atlas-card text-atlas-ink px-6 py-3 flex items-center gap-6 relative z-50 border-b border-atlas-border shadow-sm">
      <div className="flex items-center gap-4">
        {onExit && (
          <button
            onClick={onExit}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-atlas-warm hover:bg-rose-500/10 hover:text-rose-600 border border-atlas-border transition-all group"
            title="Exit Game"
            aria-label="Exit Game"
          >
            <span className="text-2xl leading-none text-atlas-muted group-hover:text-rose-600">&times;</span>
          </button>
        )}
        <div className="flex flex-col">
          <span className="font-black text-atlas-gold tracking-[0.2em] text-xs uppercase">
            Atlas Explorer
          </span>
          <span className="text-atlas-muted text-xs uppercase tracking-widest font-bold">{gameLabel}</span>
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

        {/* Streak Counter */}
        {streak > 0 && (
          <StreakMeter streak={streak} tone="light" />
        )}

        {/* Expedition Progress */}
        <div className="flex flex-col items-end hidden md:flex">
          <span className="text-xs text-atlas-muted uppercase tracking-[0.2em] font-black">Expedition Progress</span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-atlas-ink">
              {level} <span className="text-atlas-muted font-normal">/</span> {totalLevels}
            </span>
            <div className="w-24 h-1.5 bg-atlas-warm rounded-full overflow-hidden border border-atlas-border shadow-inner">
              <div
                className="h-full bg-atlas-gold transition-all duration-700 shadow-[0_0_10px_rgba(255,153,0,0.4)]"
                style={{ width: `${(level / totalLevels) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Score */}
        <div className="flex flex-col items-end min-w-[80px]">
          <span className="text-xs text-atlas-muted uppercase tracking-[0.2em] font-black">Total Score</span>
          <RollingNumber
            value={score}
            className="text-xl font-mono font-black text-atlas-gold tabular-nums"
          />
        </div>

        {attemptNumber && (
          <div className="hidden xl:flex flex-col items-end">
            <span className="text-xs text-atlas-muted uppercase tracking-[0.2em] font-black">Attempt</span>
            <span className="text-sm font-mono font-black text-atlas-ink">{attemptNumber}</span>
          </div>
        )}

        {/* Explorer Guide Toggle */}
        {onVaultToggle && (
          <button
            onClick={onVaultToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm ${
              isVaultOpen
                ? 'bg-atlas-accent/10 border-atlas-accent text-atlas-accent shadow-[0_0_20px_rgba(46,125,50,0.2)]'
                : 'bg-atlas-warm border-atlas-border text-atlas-muted hover:text-atlas-ink hover:border-atlas-border/80'
            }`}
            title="Open Explorer Guide"
          >
            <span className="text-sm">🗄️</span>
            <span className="text-xs font-black uppercase tracking-widest hidden lg:inline">Explorer Guide</span>
          </button>
        )}

        {/* Player Avatar & Rank Ring */}
        <PlayerAvatar score={score} />
      </div>
    </header>
    </>
  );
}
