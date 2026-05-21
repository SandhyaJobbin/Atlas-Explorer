import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { fetchLeaderboard } from '@/lib/leaderboard';
import type { LeaderboardRow } from '@/types';
import { Trophy, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

interface WaveLeaderboardWidgetProps {
  isAnimating?: boolean;
}

function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function WaveLeaderboardWidget({ isAnimating = false }: WaveLeaderboardWidgetProps) {
  const { session } = useSession();
  const [topRows, setTopRows] = useState<LeaderboardRow[]>([]);
  const [currentUserRow, setCurrentUserRow] = useState<LeaderboardRow | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('atlas_leaderboard_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('atlas_leaderboard_open', String(next));
      } catch {
        // Local storage can be unavailable in private browsing.
      }
      return next;
    });
  };

  const refresh = useCallback(async () => {
    if (!session?.agent) return;
    setIsRefreshing(true);
    try {
      const { top10, currentRow } = await fetchLeaderboard(session.agent, session.waveCode);
      setTopRows(top10.slice(0, 3));
      setCurrentUserRow(currentRow);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [session]);

  // Polling effect: every 30 seconds, paused during animations
  useEffect(() => {
    if (!session?.agent) return;
    if (isAnimating) return;

    const timeoutId = window.setTimeout(refresh, 0);
    const intervalId = setInterval(refresh, 30000);

    return () => {
      window.clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [session, isAnimating, refresh]);

  if (!session) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-72 bg-atlas-card border border-atlas-border rounded-2xl shadow-lg backdrop-blur-md overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px]' : 'max-h-12'}`}>
      {/* Header Bar */}
      <div 
        onClick={toggleOpen}
        className="h-12 px-4 bg-atlas-warm border-b border-atlas-border flex items-center justify-between cursor-pointer hover:bg-atlas-warm/80 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <Trophy className="w-4 h-4 text-atlas-gold" />
          <span className="text-label font-black text-atlas-ink uppercase tracking-wider font-display">
            Wave Standings
          </span>
          {/* Live indicator dot */}
          <span className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-atlas-gold' : 'bg-atlas-accent animate-pulse'} shadow-sm`} title={isAnimating ? 'Paused during animation' : 'Live polling active'} />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              refresh();
            }}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-atlas-border/50 text-atlas-muted hover:text-atlas-ink transition-colors"
            title="Refresh Leaderboard"
            aria-label="Refresh Leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-atlas-accent' : ''}`} />
          </button>
          <div className="p-1.5 rounded-lg text-atlas-muted hover:text-atlas-ink transition-colors">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3 bg-atlas-card flex flex-col gap-2">
        {topRows.length === 0 ? (
          <div className="py-6 text-center text-label text-atlas-muted font-medium italic">
            No standings available yet.
          </div>
        ) : (
          topRows.map((row, idx) => {
            const isCurrentUser = row.agent === session.agent;
            let podium = '';
            if (idx === 0) podium = '🥇';
            else if (idx === 1) podium = '🥈';
            else if (idx === 2) podium = '🥉';

            return (
              <div
                key={row.agent}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  isCurrentUser
                    ? 'bg-atlas-accent-light border-atlas-accent/30 text-atlas-accent shadow-sm'
                    : 'bg-atlas-warm border-atlas-border text-atlas-ink hover:border-atlas-border/80'
                }`}
              >
                <span className="font-mono text-sm font-bold w-5 text-center flex-shrink-0">
                  {podium || `#${idx + 1}`}
                </span>

                {/* Avatar circle */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-label font-bold flex-shrink-0 shadow-inner ${
                  isCurrentUser ? 'bg-atlas-accent text-white' : 'bg-atlas-card border border-atlas-border text-atlas-ink'
                }`}>
                  {getInitials(row.agent)}
                </div>

                {/* Name */}
                <span className={`text-body font-bold truncate flex-1 ${isCurrentUser ? 'text-atlas-accent font-black' : 'text-atlas-ink'}`}>
                  {row.agent}
                </span>

                {/* Score */}
                <span className="font-mono text-body font-bold text-atlas-ink flex items-center gap-1 flex-shrink-0">
                  {row.totalStars} <span className="text-sm">⭐</span>
                </span>
              </div>
            );
          })
        )}

        {/* Current User if not in top 3 */}
        {currentUserRow && currentUserRow.rank > 3 && (
          <>
            <div className="border-t border-dashed border-atlas-border my-1" />
            <div className="flex items-center gap-3 p-2.5 bg-atlas-accent-light border border-atlas-accent/30 text-atlas-accent rounded-xl shadow-sm">
              <span className="font-mono text-sm font-bold w-5 text-center flex-shrink-0">
                #{currentUserRow.rank}
              </span>

              <div className="w-7 h-7 rounded-full bg-atlas-accent text-white flex items-center justify-center text-label font-bold flex-shrink-0 shadow-inner">
                {getInitials(currentUserRow.agent)}
              </div>

              <span className="text-body font-black text-atlas-accent truncate flex-1">
                {currentUserRow.agent}
              </span>

              <span className="font-mono text-body font-bold text-atlas-ink flex items-center gap-1 flex-shrink-0">
                {currentUserRow.totalStars} <span className="text-sm">⭐</span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
