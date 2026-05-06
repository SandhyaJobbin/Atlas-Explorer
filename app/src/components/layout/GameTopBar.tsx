import { getRankInfo } from '@/lib/session';
import RollingNumber from '@/components/ui/RollingNumber';

interface GameTopBarProps {
  gameLabel: string;
  score: number;
  level: number;
  totalLevels: number;
  attemptNumber?: number;
  onExit?: () => void;
  isVaultOpen?: boolean;
  onVaultToggle?: () => void;
  streak?: number;
}

export default function GameTopBar({
  gameLabel,
  score,
  level,
  totalLevels,
  attemptNumber,
  onExit,
  isVaultOpen,
  onVaultToggle,
  streak = 0
}: GameTopBarProps) {
  const rank = getRankInfo(score);

  return (
    <header className="bg-[#0c120e] text-white px-6 py-3 flex items-center gap-6 relative z-50 border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4">
        {onExit && (
          <button
            onClick={onExit}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 transition-all group"
            title="Exit Game"
            aria-label="Exit Game"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        )}
        <div className="flex flex-col">
          <span className="font-black text-[#FF9900] tracking-[0.2em] text-[10px] uppercase">
            Atlas Explorer
          </span>
          <span className="text-white/40 text-[9px] uppercase tracking-widest font-bold">Intel Ops Center</span>
        </div>
      </div>

      <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />

      {/* Rank Display */}
      <div className="flex items-center gap-3 group px-3 py-1.5 rounded-2xl hover:bg-white/5 transition-all">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform animate-pop-in">
          {rank.icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-black">Agent Rank</span>
          <span className="text-sm font-black text-white tracking-tight">{rank.rank}</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-6">
        {/* Streak Counter */}
        {streak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 animate-bounce-in">
            <span className={`text-lg ${streak >= 3 ? 'animate-glow-pulse text-purple-400' : 'text-emerald-400'}`}>
              {streak >= 5 ? '🔥' : '⚡'}
            </span>
            <span className="font-mono font-black text-sm">{streak}x</span>
          </div>
        )}

        <div className="flex flex-col items-end">
          <span className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-black">Mission Progress</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/70">
              {level} <span className="opacity-30">/</span> {totalLevels}
            </span>
            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-[#FF9900] transition-all duration-700 shadow-[0_0_10px_rgba(255,153,0,0.5)]"
                style={{ width: `${(level / totalLevels) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end min-w-[80px]">
          <span className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-black">Total Score</span>
          <RollingNumber
            value={score}
            className="text-xl font-mono font-black text-[#FF9900] tabular-nums"
          />
        </div>

        {onVaultToggle && (
          <button
            onClick={onVaultToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isVaultOpen
                ? 'bg-[#00A8A2]/20 border-[#00A8A2] text-[#00A8A2] shadow-[0_0_20px_rgba(0,168,162,0.3)]'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30'
              }`}
            title="Open Intel Vault"
          >
            <span className="text-sm">🗄️</span>
            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Intel Vault</span>
          </button>
        )}
      </div>
    </header>
  );
}
