import { useState, useEffect, useMemo, useRef } from 'react';
import { loadSession, getRankInfo, getTotalScore } from '@/lib/session';
import { Award, TrendingUp } from 'lucide-react';

interface PlayerAvatarProps {
  agent?: string;
  score?: number;
}

function getInitials(name: string): string {
  if (!name || name.trim() === '') return 'EX';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export default function PlayerAvatar({ agent, score }: PlayerAvatarProps) {
  const sessionSnapshot = useMemo(() => loadSession(), []);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentScore = score !== undefined ? score : sessionSnapshot ? getTotalScore(sessionSnapshot) : 0;
  const currentAgent = agent || sessionSnapshot?.agent || sessionSnapshot?.name || 'Explorer';
  const initials = getInitials(currentAgent);
  const rankInfo = getRankInfo(currentScore);

  // Calculate progress to next rank
  const rankProgress =
    currentScore < 200
      ? { nextMin: 200, nextRankName: 'Pathfinder', progressPct: Math.min(100, Math.round((currentScore / 200) * 100)) }
      : currentScore < 400
        ? { nextMin: 400, nextRankName: 'Navigator', progressPct: Math.min(100, Math.round(((currentScore - 200) / 200) * 100)) }
        : currentScore < 600
          ? { nextMin: 600, nextRankName: 'Trailblazer', progressPct: Math.min(100, Math.round(((currentScore - 400) / 200) * 100)) }
          : { nextMin: 600, nextRankName: null, progressPct: 100 };

  // Ring color mapping per C4 spec:
  // Explorer (atlas-muted), Pathfinder (atlas-accent-light), Navigator (atlas-accent), Trailblazer (atlas-gold)
  const ringColorClass = {
    Explorer: 'border-atlas-muted text-atlas-muted',
    Pathfinder: 'border-atlas-accent-light text-atlas-accent',
    Navigator: 'border-atlas-accent text-atlas-accent',
    Trailblazer: 'border-atlas-gold text-atlas-gold',
  }[rankInfo.rank] || 'border-atlas-muted text-atlas-muted';

  const badgeBgClass = {
    Explorer: 'bg-atlas-muted/10 text-atlas-muted',
    Pathfinder: 'bg-atlas-accent-light text-atlas-accent',
    Navigator: 'bg-atlas-accent text-white',
    Trailblazer: 'bg-atlas-gold text-white',
  }[rankInfo.rank] || 'bg-atlas-muted/10 text-atlas-muted';

  // Handle click outside and Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 group px-3 py-1.5 rounded-2xl hover:bg-atlas-warm transition-all border border-transparent hover:border-atlas-border/50 text-left"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="View Explorer Profile"
      >
        <div className={`relative flex items-center justify-center w-9 h-9 rounded-full bg-atlas-warm border-[3px] ${ringColorClass} shadow-inner group-hover:scale-105 transition-transform`}>
          <span className="text-body font-black tracking-tighter" aria-hidden="true">
            {initials}
          </span>
          {/* Small rank icon badge */}
          <span className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center bg-atlas-card rounded-full border border-atlas-border text-[11px] shadow-sm" aria-hidden="true">
            {rankInfo.icon}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-label text-atlas-muted uppercase tracking-wider font-black">Explorer Rank</span>
          <span className="text-body font-black text-atlas-ink tracking-tight flex items-center gap-1.5">
            {currentAgent} <span className="text-atlas-muted font-normal text-label">({rankInfo.rank})</span>
          </span>
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className="absolute top-full mt-2 left-0 w-72 bg-atlas-card rounded-2xl border border-atlas-border shadow-lg p-5 z-50 animate-pop-in"
          role="dialog"
          aria-label="Explorer Profile"
        >
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-atlas-border">
            <div className={`w-12 h-12 rounded-full bg-atlas-warm border-[3px] ${ringColorClass} flex items-center justify-center shadow-inner`}>
              <span className="text-display font-black tracking-tighter">{initials}</span>
            </div>
            <div>
              <h4 className="text-body font-black text-atlas-ink">{currentAgent}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeBgClass}`}>
                  {rankInfo.icon} {rankInfo.rank}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-atlas-muted text-label uppercase font-black tracking-wider">
                <Award className="w-4 h-4 text-atlas-gold" />
                <span>Total Score</span>
              </div>
              <span className="text-display font-mono font-black text-atlas-gold tabular-nums">
                {currentScore}
              </span>
            </div>

            {/* Progress to Next Rank */}
            <div>
              <div className="flex items-center justify-between text-label mb-1.5">
                <span className="text-atlas-muted uppercase font-black tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-atlas-accent" />
                  <span>Next: {rankProgress.nextRankName || 'Max Rank'}</span>
                </span>
                <span className="font-mono font-bold text-atlas-ink">
                  {rankProgress.nextRankName ? `${rankProgress.progressPct}%` : '100%'}
                </span>
              </div>

              <div className="w-full h-2 bg-atlas-warm rounded-full overflow-hidden border border-atlas-border shadow-inner">
                <div
                  className="h-full bg-atlas-accent transition-all duration-50 duration-500 shadow-[0_0_10px_rgba(46,125,50,0.4)]"
                  style={{ width: `${rankProgress.progressPct}%` }}
                />
              </div>

              {rankProgress.nextRankName && (
                <p className="text-[11px] text-atlas-muted mt-2 font-medium">
                  Earn <span className="font-bold text-atlas-ink">{rankProgress.nextMin - currentScore}</span> more points to reach {rankProgress.nextRankName}.
                </p>
              )}
              {!rankProgress.nextRankName && (
                <p className="text-[11px] text-atlas-muted mt-2 font-medium">
                  You have achieved the highest explorer rank!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
