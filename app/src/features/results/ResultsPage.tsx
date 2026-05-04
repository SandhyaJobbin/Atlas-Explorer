import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { useAudio } from '@/hooks/useAudio';
import { useParticles } from '@/components/ui/ParticleSystem';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import AppLayout from '@/components/layout/AppLayout';
import { BADGE_DEFS } from '@/lib/badges';
import { fetchLeaderboard } from '@/lib/leaderboard';
import { GAME_DEFINITIONS, getTotalScore, getTotalStars, isAllPassed } from '@/lib/session';
import type { LeaderboardRow, Session } from '@/types';

// ─── Badge metadata ───────────────────────────────────────────────────────────

const BADGE_ICONS: Record<string, string> = {
  'first-blood':    '🚀',
  'perfect-agent':  '💯',
  'hot-streak':     '🔥',
  'globe-trotter':  '🌍',
  'diamond-agent':  '💎',
  'star-collector': '⭐',
  'never-quit':     '🏅',
  'speed-run':      '⚡',
};

const BADGE_DESCS: Record<string, string> = {
  'first-blood':    'Pass on the first try',
  'perfect-agent':  'Score 100% in any level',
  'hot-streak':     'Chain 3 correct answers',
  'globe-trotter':  `Pass all ${GAME_DEFINITIONS.length} games`,
  'diamond-agent':  `Pass all ${GAME_DEFINITIONS.length} on the first try`,
  'star-collector': `Collect all ${GAME_DEFINITIONS.length * 3} stars`,
  'never-quit':     'Pass after 3 failed tries',
  'speed-run':      'Perfect timed finish',
};

// ─── AnimatedCount ────────────────────────────────────────────────────────────

function AnimatedCount({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(ease * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return <>{value.toLocaleString()}</>;
}

// ─── StarStrip ────────────────────────────────────────────────────────────────

function StarStrip({ stars, max = 3 }: { stars: number; max?: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${stars} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span 
          key={i} 
          className={`text-xl transition-all duration-500 delay-[${i * 100}ms] ${i < stars ? 'text-[#FF9900] scale-110 drop-shadow-[0_0_8px_rgba(255,153,0,0.5)]' : 'text-white/10 scale-90'}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ─── Certificate download ──────────────────────────────────────────────────────

function downloadCertificate(session: Session) {
  const totalScore = getTotalScore(session);
  const totalStars = getTotalStars(session);
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Atlas Explorer Certificate</title>
<style>
body{font-family:sans-serif;margin:0;padding:40px;background:#10161f;color:#f6fbff}
.cert{max-width:860px;margin:0 auto;padding:48px;border:1px solid rgba(255,255,255,.08);border-radius:28px;background:linear-gradient(160deg,#161f2b,#131a22)}
h1{font-size:32px;color:#f6fbff;margin:0 0 18px}
h2{font-size:20px;color:#ff9900;margin:12px 0 28px}
p{font-size:16px;line-height:1.6;color:#d3d9df}
.stamp{display:inline-block;margin-top:24px;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg,#ff9900,#ffb84d);color:#131a22;font-size:12px;font-weight:700}
</style></head><body><section class="cert">
<h1>Atlas Explorer</h1>
<h2>Certificate of Completion</h2>
<p>This certifies that <strong>${session.agent || session.name}</strong> completed the Atlas Explorer game run — iCube Wave Code: <strong>${session.waveCode || ''}</strong>, Trainer: <strong>${session.trainerName || ''}</strong>.</p>
<p>Total Score: <strong>${totalScore}</strong><br>Stars Earned: <strong>${totalStars}/${GAME_DEFINITIONS.length * 3}</strong><br>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
<div class="stamp">Run complete</div>
</section></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'atlas-explorer-certificate.html';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── ResultsPage ──────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { session, clearCurrentSession } = useSession();
  const { playSound } = useAudio();
  const { triggerBurst } = useParticles();
  const navigate = useNavigate();
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const headerRef = useRef<HTMLElement>(null);

  // Redirect if no session
  useEffect(() => {
    if (!session) navigate('/', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load leaderboard and trigger effects on mount
  useEffect(() => {
    if (!session) return;
    
    fetchLeaderboard(session.agent).then(({ top10 }) => setLeaderboardRows(top10));

    if (isAllPassed(session)) {
      playSound('correct'); // Using correct as a celebration start
      setTimeout(() => playSound('streak'), 800);
      
      // Delay bursts for maximum impact
      setTimeout(() => {
        triggerBurst(headerRef.current, 'confetti', { count: 40, spread: 250, yBias: -80 });
      }, 500);
      setTimeout(() => {
        triggerBurst(null, 'star-burst', { count: 30, spread: 200 });
      }, 1000);
    } else {
      playSound('wrong');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return null;

  const allPassed    = isAllPassed(session);
  const totalScore   = getTotalScore(session);
  const totalStars   = getTotalStars(session);
  const levelsPassed = session.games.filter((g) => g.passed).length;

  function handlePlayAgain() {
    playSound('click');
    clearCurrentSession();
    navigate('/');
  }

  function handleDownload() {
    if (session) {
      playSound('click');
      downloadCertificate(session);
    }
  }

  return (
    <AppLayout variant="results">
      <main className="flex-1 bg-[#2D3B2F] text-white overflow-auto pb-12 relative font-sans">
        
        {/* Playful Cartography Background: Journal Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-overlay" 
          style={{ backgroundImage: 'url("/assets/patterns/paper-grain.png")', backgroundSize: '600px' }} 
        />
        
        {/* Terrain Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]" 
          style={{ backgroundImage: 'url("/assets/patterns/dots-pattern.png")', backgroundSize: '150px' }} 
        />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header ref={headerRef} className="px-8 pt-12 pb-8 relative z-10 text-center">
          <div className="inline-block mb-4">
             {allPassed ? (
               <div className="relative">
                 <LottiePlayer src="assets/lottie/trophy.json" className="w-24 h-24 mx-auto" />
                 <div className="absolute inset-0 bg-[#F59E0B]/20 blur-2xl rounded-full -z-10 animate-pulse" />
               </div>
             ) : (
               <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl grayscale">
                 🌍
               </div>
             )}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
            {allPassed ? 'EXPEDITION CLEAR' : 'EXPEDITION LOG'}
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest">
              Agent: {session.agent}
            </div>
            <div className="px-3 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[10px] font-black uppercase tracking-widest text-[#F59E0B]">
              Sector: {session.waveCode || 'ALPHA-1'}
            </div>
          </div>
        </header>

        {/* ── Score summary cards ────────────────────────────────────────── */}
        <div className="px-6 grid grid-cols-3 gap-4 relative z-10">
          {[
            { label: 'Intelligence', value: totalScore,   accent: '#06B6D4' },
            { label: 'Merit Stars',  value: totalStars,   accent: '#F59E0B' },
            { label: 'Sorties',      value: levelsPassed, accent: '#10B981' },
          ].map((item) => (
            <AnimatedCard
              key={item.label}
              tiltAmount={4}
              className="flex flex-col items-center gap-1 p-5 rounded-3xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-[9px] uppercase tracking-[0.2em] font-black text-white/40 mb-1">{item.label}</span>
              <strong className="text-3xl font-mono font-black text-white tracking-tighter relative z-10">
                <AnimatedCount target={item.value} />
              </strong>
              <div className="w-8 h-1 rounded-full mt-2" style={{ backgroundColor: item.accent }} />
            </AnimatedCard>
          ))}
        </div>

        {/* ── Level breakdown ────────────────────────────────────────────── */}
        <div className="px-6 mt-12 relative z-10">
          <h2 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black mb-6 px-1">Mission Log Entries</h2>
          <div className="flex flex-col gap-4">
            {session.games.map((game, index) => (
              <AnimatedCard 
                key={game.key} 
                tiltAmount={1} 
                className="rounded-3xl border border-white/10 bg-black/30 p-6 hover:bg-black/50 transition-all group relative overflow-hidden"
              >
                {game.passed && (
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] grayscale pointer-events-none group-hover:opacity-10 transition-opacity">
                    <img src="/assets/illustrations/compass-rose.svg" className="w-24 h-24" alt="" />
                  </div>
                )}
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${game.passed ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-red-500/20 text-red-500'} border border-current/20`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-white font-black text-lg tracking-tight group-hover:text-[#F59E0B] transition-colors">
                        {GAME_DEFINITIONS[index]?.label ?? game.label}
                      </h3>
                      <div className="flex gap-3 mt-1">
                        <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">
                          {game.passed ? 'SECURED' : 'UNSTABLE'}
                        </span>
                        <span className="text-white/20 text-[9px] font-mono">
                          ID: {game.key.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StarStrip stars={game.stars} max={3} />
                </div>
                
                <div className="mt-6 flex items-end justify-between relative z-10">
                  <div className="flex gap-8">
                    <div className="flex flex-col">
                      <span className="text-white/20 text-[8px] uppercase font-black tracking-widest mb-1">Intelligence</span>
                      <span className="text-white font-mono text-xl font-black">
                        <AnimatedCount target={game.score} />
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white/20 text-[8px] uppercase font-black tracking-widest mb-1">Precision</span>
                      <span className="text-white/60 font-mono text-sm">{Math.round((game.correctCount / (game.totalCount || 1)) * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {game.attempts.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === game.attempts.length - 1 && game.passed ? 'bg-[#10B981]' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>

        {/* ── Badge recognition ──────────────────────────────────────────── */}
        <div className="px-6 mt-16 relative z-10">
          <h2 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black mb-6 px-1 text-center">Merit Matrix</h2>
          <div className="grid grid-cols-2 gap-4">
            {BADGE_DEFS.map((badge) => {
              const earned = session.earnedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={[
                    'flex items-center gap-4 p-5 rounded-3xl border-2 transition-all duration-700',
                    earned
                      ? 'border-[#F59E0B]/40 bg-[#F59E0B]/5 shadow-[0_15px_30px_rgba(245,158,11,0.1)] scale-100'
                      : 'border-white/5 bg-white/[0.02] opacity-30 grayscale scale-95',
                  ].join(' ')}
                >
                  <div className={`text-3xl filter ${earned ? 'drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : ''}`}>
                    {BADGE_ICONS[badge.id] ?? '⭐'}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-black uppercase tracking-widest mb-1 ${earned ? 'text-white' : 'text-white/50'}`}>
                      {badge.name}
                    </p>
                    <p className="text-white/30 text-[9px] font-medium leading-snug">
                      {BADGE_DESCS[badge.id]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Global Standings ───────────────────────────────────────────── */}
        {leaderboardRows.length > 0 && (
          <div className="px-6 mt-16 relative z-10">
            <h2 className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black mb-6 px-1 text-center">Global Agent Rankings</h2>
            <AnimatedCard tiltAmount={1} className="rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="grid grid-cols-6 text-white/30 text-[8px] font-black uppercase tracking-[0.3em] px-8 py-4 border-b border-white/5 bg-white/[0.03]">
                <span>Rank</span>
                <span className="col-span-2">Agent</span>
                <span className="text-right">Stars</span>
                <span className="col-span-2 text-right">Clearance</span>
              </div>
              <div className="max-h-[350px] overflow-auto">
                {leaderboardRows.slice(0, 10).map((row, idx) => (
                  <div
                    key={row.agent}
                    className={[
                      'grid grid-cols-6 text-xs px-8 py-5 border-b border-white/5 last:border-0 transition-all',
                      row.agent === session.agent
                        ? 'bg-[#F59E0B]/10 text-[#F59E0B] font-black'
                        : 'text-white/60 hover:bg-white/[0.03]',
                    ].join(' ')}
                  >
                    <span className="font-mono text-white/20">#{String(idx + 1).padStart(2, '0')}</span>
                    <span className="col-span-2 truncate">{row.agent}</span>
                    <span className="text-right font-mono text-[#F59E0B]">{row.totalStars}</span>
                    <span className="col-span-2 text-right font-mono text-white/40">{row.gamesPassed}/{GAME_DEFINITIONS.length}</span>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </div>
        )}

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="px-6 mt-16 flex flex-col gap-4 relative z-10 max-w-sm mx-auto">
          {allPassed && (
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-5 rounded-2xl border-2 border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B] font-black hover:bg-[#F59E0B]/20 transition-all active:scale-[0.98] text-[10px] uppercase tracking-[0.3em] shadow-xl"
            >
              DOWNLOAD CLEARANCE
            </button>
          )}
          <button
            type="button"
            onClick={handlePlayAgain}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#FEBD69] text-[#2D3B2F] font-black hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl text-[10px] uppercase tracking-[0.3em]"
          >
            NEW ASSIGNMENT
          </button>
          
          <p className="text-center text-white/10 text-[8px] font-mono tracking-[0.5em] mt-4">
            ATLAS EXPLORER // END OF LOG
          </p>
        </div>

      </main>
    </AppLayout>
  );
}
