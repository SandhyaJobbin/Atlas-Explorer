import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { useAudio } from '@/hooks/useAudio';
import { useData } from '@/hooks/useData';
import { LottiePlayer } from '@/components/ui/LottiePlayer';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import AppLayout from '@/components/layout/AppLayout';
import { publicAsset } from '@/lib/assets';
import { BADGE_DEFS } from '@/lib/badges';
import { fetchLeaderboard, MAX_STARS_PER_SESSION } from '@/lib/leaderboard';
import { GAME_DEFINITIONS, getTotalScore, getTotalStars, isAllPassed, getRankInfo } from '@/lib/session';
import { getAggregatedMistakes } from '@/lib/scoring';
import { triggerConfetti, triggerRankUp } from '@/lib/celebrations';
import type { LeaderboardRow, Session, StateEntry } from '@/types';
import InteractiveMap from '@/components/map/InteractiveMap';
import StateOutline from '@/components/map/StateOutline';
import { ExpeditionReport } from './ExpeditionReport';
import { CheatSheet } from './CheatSheet';

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
      {Array.from({ length: max }, (_, i) => {
        const isFilled = i < stars;
        return (
          <svg 
            key={i}
            viewBox="0 0 24 24" 
            className={`w-5 h-5 transition-all duration-500 delay-[${i * 100}ms] ${
              isFilled 
                ? 'text-atlas-gold fill-current scale-110 drop-shadow-sm' 
                : 'text-atlas-border fill-current scale-90'
            }`}
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      })}
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
body{font-family:'Inter',sans-serif;margin:0;padding:40px;background:#FAF8F5;color:#1A1A2E}
.cert{max-width:860px;margin:0 auto;padding:48px;border:1px solid #E5E2DC;border-radius:28px;background:#FFFFFF;box-shadow:0 10px 30px rgba(0,0,0,0.05)}
h1{font-size:36px;color:#1A1A2E;margin:0 0 18px;font-family:'Instrument Serif',serif;}
h2{font-size:22px;color:#2E7D32;margin:12px 0 28px}
p{font-size:16px;line-height:1.6;color:#787774}
.stamp{display:inline-block;margin-top:24px;padding:12px 24px;border-radius:999px;background:#F9A825;color:#1A1A2E;font-size:14px;font-weight:700}
</style></head><body><section class="cert">
<h1>Atlas Explorer</h1>
<h2>Certificate of Completion</h2>
<p>This certifies that <strong>${session.agent || session.name}</strong> completed the Atlas Explorer expedition — Wave: <strong>${session.waveCode || 'Wave Alpha'}</strong>, Trainer: <strong>${session.trainerName || 'Lead Explorer'}</strong>.</p>
<p>Total Score: <strong>${totalScore}</strong><br>Stars Earned: <strong>${totalStars}/${GAME_DEFINITIONS.length * 3}</strong><br>Date: <strong>${new Date().toLocaleDateString()}</strong></p>
<div class="stamp">Expedition Complete</div>
</section></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'atlas-explorer-certificate.html';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Explorer Guide download ─────────────────────────────────────────────────────

function downloadExplorerGuide(states: StateEntry[]) {
  const rows = states.map(s => `<tr>
    <td><strong>${s.name}</strong></td>
    <td><code>${s.code}</code></td>
    <td>${s.capital || 'N/A'}</td>
    <td>${s.timezoneLabel} (${s.timezone})</td>
    <td>${s.country === 'CA' ? '🇨🇦 Canada' : '🇺🇸 United States'}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Atlas Explorer — Explorer Guide</title>
<style>
body{font-family:sans-serif;margin:0;padding:40px;background:#FAF8F5;color:#1A1A2E}
.container{max-width:960px;margin:0 auto;padding:48px;border:1px solid #E5E2DC;border-radius:16px;background:#FFFFFF;box-shadow:0 10px 30px rgba(0,0,0,0.05)}
h1{font-size:32px;color:#1A1A2E;margin:0 0 8px;font-family:'Instrument Serif',serif;}
p{font-size:16px;color:#787774;margin:0 0 32px}
table{width:100%;border-collapse:collapse;text-align:left;font-size:14px;}
th{background:#E8F5E9;color:#2E7D32;padding:14px 16px;font-weight:700;border-bottom:2px solid #2E7D32;}
td{padding:12px 16px;border-bottom:1px solid #E5E2DC;color:#1A1A2E;}
tr:hover{background:#FAF8F5;}
code{font-family:'JetBrains Mono',monospace;background:#FAF8F5;padding:4px 8px;border-radius:4px;border:1px solid #E5E2DC;font-weight:700;}
</style></head><body><section class="container">
<h1>Atlas Explorer // Explorer Guide</h1>
<p>Official navigation reference for all ${states.length} United States & Canada territories, postal codes, and timezones.</p>
<table>
  <thead>
    <tr>
      <th>Territory / State</th>
      <th>Postal Code</th>
      <th>Capital</th>
      <th>Timezone Region</th>
      <th>Jurisdiction</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
</section></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'atlas-explorer-guide.html';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── ResultsPage ──────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { session, clearCurrentSession } = useSession();
  const { playSound } = useAudio();
  const { states } = useData();
  const navigate = useNavigate();
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [showAverageCompare, setShowAverageCompare] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Redirect if no session
  useEffect(() => {
    if (!session) navigate('/', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load leaderboard and trigger effects on mount
  useEffect(() => {
    if (!session) return;
    
    const loadLeaderboard = () => {
      fetchLeaderboard(session.agent, session.waveCode).then(({ top10 }) => setLeaderboardRows(top10));
    };

    loadLeaderboard();
    const intervalId = setInterval(loadLeaderboard, 10000);

    if (isAllPassed(session)) {
      playSound('correct'); // Using correct as a celebration start
      setTimeout(() => playSound('streak'), 800);
      
      // Delay bursts for maximum impact
      setTimeout(() => {
        triggerRankUp(headerRef.current);
      }, 500);
      setTimeout(() => {
        triggerConfetti(headerRef.current);
      }, 1000);
    } else {
      playSound('wrong');
    }

    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return null;

  const allPassed    = isAllPassed(session);
  const totalScore   = getTotalScore(session);
  const totalStars   = getTotalStars(session);
  const levelsPassed = session.games.filter((g) => g.passed).length;

  const lowestScoringGame = useMemo(() => {
    if (!session || !session.games.length) return null;
    let minScore = Infinity;
    let minGame = session.games[0];
    session.games.forEach((game) => {
      if (game.score < minScore) {
        minScore = game.score;
        minGame = game;
      }
    });
    return minGame;
  }, [session]);

  const medianStars = useMemo(() => {
    if (leaderboardRows.length === 0) return 0;
    const starsList = leaderboardRows.map((r) => r.totalStars).sort((a, b) => a - b);
    const mid = Math.floor(starsList.length / 2);
    return starsList.length % 2 !== 0 
      ? starsList[mid] 
      : Math.round((starsList[mid - 1] + starsList[mid]) / 2);
  }, [leaderboardRows]);

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

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

  // ── Telemetry Calculations ──────────────────────────────────────────────
  const aggregatedMistakes = useMemo(() => getAggregatedMistakes(session, states), [session, states]);
  const allCorrects = session.games.flatMap((g) => g.corrects || []);

  const correctCounts: Record<string, number> = {};
  allCorrects.forEach((code) => {
    correctCounts[code] = (correctCounts[code] || 0) + 1;
  });

  // Weak Spots: states with mistakes > 0, sorted by mistake count descending
  const weakSpots = aggregatedMistakes.slice(0, 6).map((m) => ({
    state: m.state,
    code: m.code,
    count: m.count,
  }));

  // Strengths: states with corrects > 0 and 0 mistakes (or fewest mistakes), sorted by correct count descending
  const mistakeCodeSet = useMemo(() => new Set(aggregatedMistakes.map((m) => m.code)), [aggregatedMistakes]);
  const strengths = Object.entries(correctCounts)
    .filter(([code]) => !mistakeCodeSet.has(code))
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({
      state: states.find((s) => s.code === code),
      code,
      count,
    }))
    .filter((x) => x.state)
    .slice(0, 6);

  // Timezone focus tip: group mistakes by timezone
  const timezoneMistakes = useMemo(() => {
    const tzMap: Record<string, { code: string; name: string }[]> = {};
    aggregatedMistakes.forEach((m) => {
      const state = states.find((s) => s.code === m.code);
      const tz = state?.timezoneLabel || 'Unknown';
      if (!tzMap[tz]) tzMap[tz] = [];
      tzMap[tz].push({ code: m.code, name: state?.name || m.code });
    });
    return Object.entries(tzMap)
      .map(([tz, regions]) => ({ tz, count: regions.length, regions }))
      .sort((a, b) => b.count - a.count);
  }, [aggregatedMistakes, states]);

  const topTzTip = timezoneMistakes[0];

  // Heatmap Map: color coding for InteractiveMap
  const mistakeLookup = useMemo(() => {
    const map: Record<string, number> = {};
    aggregatedMistakes.forEach((m) => { map[m.code] = m.count; });
    return map;
  }, [aggregatedMistakes]);
  const heatmapMap: Record<string, string> = {};
  states.forEach((s) => {
    const errs = mistakeLookup[s.code] || 0;
    const corrs = correctCounts[s.code] || 0;
    if (errs > 0) {
      heatmapMap[s.code] = errs > corrs ? 'var(--atlas-error)' : 'var(--atlas-gold)'; // Red for high error, Amber for moderate
    } else if (corrs > 0) {
      heatmapMap[s.code] = 'var(--atlas-accent)'; // Green for secured
    } else {
      heatmapMap[s.code] = 'var(--atlas-card)'; // Neutral unvisited
    }
  });

  return (
    <AppLayout variant="results">
      <main className="flex-1 bg-atlas-warm text-atlas-ink overflow-auto pb-12 relative font-sans">
        
        {/* Playful Cartography Background: Journal Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-overlay" 
          style={{ backgroundImage: `url("${publicAsset('/assets/patterns/paper-grain.png')}")`, backgroundSize: '600px' }} 
        />
        
        {/* Terrain Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]" 
          style={{ backgroundImage: `url("${publicAsset('/assets/patterns/dots-pattern.png')}")`, backgroundSize: '150px' }} 
        />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header ref={headerRef} className="px-8 pt-6 pb-2 relative z-10 text-center">
          <div className="inline-block mb-2">
             {allPassed ? (
               <div className="relative">
                 <LottiePlayer src="assets/lottie/trophy.json" className="w-16 h-16 mx-auto" />
                 <div className="absolute inset-0 bg-atlas-gold/20 blur-2xl rounded-full -z-10 animate-pulse" />
               </div>
             ) : (
               <div className="w-16 h-16 rounded-full bg-atlas-card border border-atlas-border flex items-center justify-center text-3xl shadow-sm mx-auto">
                 🌍
               </div>
             )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-atlas-ink drop-shadow-sm font-display">
            {allPassed ? 'Expedition Complete' : 'Expedition Log'}
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4 font-display">
            <div className="px-4 py-1.5 rounded-full bg-atlas-card border border-atlas-border text-label font-black uppercase tracking-wider flex items-center gap-2 shadow-sm">
              <span className="text-base">{getRankInfo(totalScore).icon}</span>
              <span>{getRankInfo(totalScore).rank}: {session.agent}</span>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-atlas-gold/15 border border-atlas-gold/30 text-label font-black uppercase tracking-wider text-atlas-ink shadow-sm">
              Wave: {session.waveCode || 'Wave Alpha'}
            </div>
          </div>
        </header>

        {/* ── Score summary cards ────────────────────────────────────────── */}
        <div className="px-6 grid grid-cols-3 gap-4 relative z-10 mt-4">
          {[
            { label: 'Score', value: totalScore,   accent: 'var(--atlas-ink)' },
            { label: 'Merit Stars',  value: totalStars,   accent: 'var(--atlas-gold)' },
            { label: 'Games Passed', value: levelsPassed, accent: 'var(--atlas-accent)' },
          ].map((item, idx) => (
            <AnimatedCard
              key={item.label}
              tiltAmount={2}
              className={`flex flex-col items-center gap-1 p-4 rounded-3xl border border-atlas-border bg-atlas-card shadow-md backdrop-blur-2xl relative overflow-hidden group slide-up ${idx === 0 ? 'stagger-1' : idx === 1 ? 'stagger-2' : 'stagger-3'}`}
            >
              <div className="absolute inset-0 bg-atlas-warm opacity-0 group-hover:opacity-40 transition-opacity" />
              <span className="text-label uppercase tracking-widest font-black text-atlas-muted mb-1 text-center font-display">
                {item.label}
                {item.label === 'Score' && (
                  <span className="block text-label opacity-80 normal-case tracking-normal mt-0.5 font-medium">(Total Score)</span>
                )}
              </span>
              <strong className="text-2xl font-mono font-black text-atlas-ink tracking-tighter relative z-10">
                <AnimatedCount target={item.value} />
              </strong>
              <div className="w-8 h-1.5 rounded-full mt-2" style={{ backgroundColor: item.accent }} />
            </AnimatedCard>
          ))}
        </div>

        {/* ── What's Next? Action Hub (C3) — above fold ──────────────────── */}
        <div className="px-6 mt-8 relative z-10 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-atlas-border bg-atlas-card p-6 shadow-xl relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: `url("${publicAsset('/assets/patterns/topo-pattern.png')}")`, backgroundSize: '300px' }}
            />

            <div className="relative z-10">
              <div className="text-center mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-atlas-accent">Next Steps</p>
                <h2 className="font-display text-2xl font-black text-atlas-ink mt-1">What's Next?</h2>
                <p className="text-atlas-muted text-sm font-medium mt-1">Continue your learning path and review your achievements.</p>
              </div>

              {topTzTip && topTzTip.count > 0 && (
                <div className="mb-4 p-4 rounded-2xl border border-atlas-gold/30 bg-atlas-gold/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-bold text-atlas-ink text-sm">Focus Tip</p>
                      <p className="text-xs text-atlas-muted font-medium mt-0.5">
                        You missed <strong className="text-atlas-ink">{topTzTip.count}</strong> {topTzTip.tz} region{topTzTip.count === 1 ? '' : 's'}{topTzTip.count > 1 ? ' — review that timezone to level up.' : '. Click Review Weak Spots below to practice.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => scrollToId('review-snapshot')}
                  className="flex items-start gap-3 p-4 rounded-2xl border border-atlas-border bg-atlas-warm/40 hover:bg-atlas-warm/80 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="font-bold text-atlas-ink text-sm">Review Weak Spots</h3>
                    <p className="text-xs text-atlas-muted font-medium mt-1">
                      {weakSpots.length > 0
                        ? `Practice the ${weakSpots.length} region${weakSpots.length === 1 ? '' : 's'} you missed.`
                        : 'No weak spots in this expedition.'}
                    </p>
                  </div>
                </button>

                {lowestScoringGame && (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      navigate(`/play?game=${lowestScoringGame.key}`);
                    }}
                    className="flex items-start gap-3 p-4 rounded-2xl border border-atlas-border bg-atlas-warm/40 hover:bg-atlas-warm/80 transition-all text-left group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-atlas-gold/15 text-atlas-gold flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                      🎮
                    </div>
                    <div>
                      <h3 className="font-bold text-atlas-ink text-sm">Replay Lowest Game</h3>
                      <p className="text-xs text-atlas-muted font-medium mt-1">
                        Beat your score of {lowestScoringGame.score}% on <span className="font-bold text-atlas-ink">{lowestScoringGame.label}</span>.
                      </p>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setShowAverageCompare(!showAverageCompare);
                  }}
                  className="flex items-start gap-3 p-4 rounded-2xl border border-atlas-border bg-atlas-warm/40 hover:bg-atlas-warm/80 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <div>
                    <h3 className="font-bold text-atlas-ink text-sm">Compare to Wave Average</h3>
                    <p className="text-xs text-atlas-muted font-medium mt-1">
                      {showAverageCompare ? 'Hide average comparison.' : 'See how your stars compare to the class median.'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={session.training.journalEntries.length === 0}
                  onClick={() => scrollToId('saved-journal')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border border-atlas-border text-left group transition-all ${
                    session.training.journalEntries.length > 0
                      ? 'bg-atlas-warm/40 hover:bg-atlas-warm/80 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-atlas-accent/10 text-atlas-accent flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                    📖
                  </div>
                  <div>
                    <h3 className="font-bold text-atlas-ink text-sm">Browse Saved Journal</h3>
                    <p className="text-xs text-atlas-muted font-medium mt-1">
                      {session.training.journalEntries.length > 0
                        ? `Review the ${session.training.journalEntries.length} fact${session.training.journalEntries.length === 1 ? '' : 's'} you saved.`
                        : 'No facts saved to your journal.'}
                    </p>
                  </div>
                </button>
              </div>

              {showAverageCompare && (
                <div className="mt-4 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Classroom Telemetry</p>
                    <h4 className="font-bold text-atlas-ink text-sm">Performance Comparison</h4>
                    <p className="text-xs text-atlas-muted font-medium leading-relaxed">
                      Your stars: <span className="font-bold text-atlas-ink font-mono">{totalStars}</span> / {MAX_STARS_PER_SESSION}<br />
                      Class median: <span className="font-bold text-atlas-ink font-mono">{medianStars}</span>
                    </p>
                  </div>
                  <div className="bg-atlas-card border border-atlas-border px-4 py-3 rounded-xl shadow-sm text-center font-bold text-xs shrink-0 max-w-[260px]">
                    {totalStars > medianStars ? (
                      <span className="text-atlas-accent font-black">Outperforming wave average!</span>
                    ) : totalStars === medianStars ? (
                      <span className="text-atlas-gold font-black">On par with wave average.</span>
                    ) : (
                      <span className="text-rose-600 font-black">Replay a game to boost stars.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Shareable Expedition Report ─────────────────────────────────── */}
        <div className="px-6 mt-8 relative z-10">
          <ExpeditionReport session={session} states={states} />
        </div>

        <div className="px-6 mt-8 relative z-10">
          <CheatSheet states={states} />
        </div>

        {session.training.journalEntries.length > 0 && (
          <div className="px-6 mt-8 relative z-10">
            <section id="saved-journal" className="rounded-3xl border border-atlas-border bg-atlas-card p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-label font-black uppercase tracking-wider text-atlas-accent">Saved Journal</p>
                  <h2 className="font-display text-2xl font-black text-atlas-ink">Facts you kept for review</h2>
                </div>
                <span className="rounded-full bg-atlas-warm px-3 py-1 text-label font-black text-atlas-muted">
                  {session.training.journalEntries.length}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {session.training.journalEntries.map((entry) => (
                  <p key={entry} className="rounded-xl border border-atlas-border bg-atlas-warm/60 p-4 text-body font-medium leading-relaxed text-atlas-ink">
                    {entry}
                  </p>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── Level breakdown ────────────────────────────────────────────── */}
        <div className="px-6 mt-8 relative z-10">
          <h2 className="text-atlas-ink text-label font-black mb-4 px-1 uppercase tracking-widest font-display">Expedition Log Entries</h2>
          <div className="flex flex-col gap-3">
            {session.games.map((game, index) => (
              <AnimatedCard 
                key={game.key} 
                tiltAmount={1} 
                className="rounded-3xl border border-atlas-border bg-atlas-card p-5 hover:bg-atlas-warm/50 transition-all group relative overflow-hidden backdrop-blur-md shadow-sm"
              >
                {game.passed && (
                  <div className="absolute top-0 right-0 p-4 opacity-5 grayscale pointer-events-none group-hover:opacity-10 transition-opacity">
                    <img src={publicAsset('/assets/illustrations/compass-rose.svg')} className="w-24 h-24" alt="" />
                  </div>
                )}
                
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black ${game.passed ? 'bg-atlas-accent/15 text-atlas-accent' : 'bg-atlas-error/15 text-atlas-error'} border border-current/20 shadow-sm font-display`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-atlas-ink font-black text-base tracking-tight group-hover:text-atlas-accent transition-colors font-display">
                        {GAME_DEFINITIONS[index]?.label ?? game.label}
                      </h3>
                      <div className="flex gap-2 mt-2 font-display">
                        <span className={`px-2.5 py-0.5 rounded-full text-label font-black tracking-widest border shadow-sm ${
                          game.passed 
                            ? 'bg-atlas-accent/15 text-atlas-accent border-atlas-accent/30' 
                            : 'bg-atlas-error/15 text-atlas-error border-atlas-error/30'
                        }`}>
                          {game.passed ? 'Passed' : 'Needs Review'}
                        </span>
                        <span className="text-atlas-muted text-label font-mono self-center font-bold">
                          {game.key.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StarStrip stars={game.stars} max={3} />
                </div>
                
                <div className="mt-4 flex items-end justify-between relative z-10">
                  <div className="flex gap-8">
                    <div className="flex flex-col">
                      <span className="text-atlas-muted text-label font-black tracking-wider mb-1 font-display">SCORE</span>
                      <span className="text-atlas-ink font-mono text-xl font-black">
                        <AnimatedCount target={game.score} />
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-atlas-muted text-label font-black tracking-wider mb-1 font-display">ACCURACY</span>
                      <span className="text-atlas-ink font-mono text-sm font-bold">{Math.round((game.correctCount / (game.totalCount || 1)) * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {game.attempts.map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full shadow-sm ${i === game.attempts.length - 1 && game.passed ? 'bg-atlas-accent' : 'bg-atlas-border'}`} />
                    ))}
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>

        {/* ── Review Snapshot (Phase 5a) ─────────────────────────────────── */}
        <div id="review-snapshot" className="px-6 mt-12 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-atlas-ink tracking-tight uppercase font-display">Review Snapshot</h2>
            <p className="text-atlas-muted text-body mt-1 font-medium">How you did across North America</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Weak Spots */}
            <AnimatedCard tiltAmount={2} className="p-6 rounded-3xl border border-atlas-error/30 bg-atlas-card backdrop-blur-xl shadow-md flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-atlas-border font-display">
                <div className="w-8 h-8 rounded-xl bg-atlas-error/15 text-atlas-error flex items-center justify-center text-lg shadow-sm">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-atlas-ink font-black text-sm uppercase tracking-wider">Regions to Review</h3>
                  <span className="text-atlas-error text-label font-bold block mt-0.5">Regions needing review</span>
                </div>
              </div>

              {weakSpots.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {weakSpots.map(({ state, code, count }) => (
                    <div key={code} className="flex items-center gap-3 p-3 rounded-2xl bg-atlas-error/10 border border-atlas-error/20 shadow-sm">
                      <div className="w-8 h-8 flex-shrink-0">
                        <StateOutline stateCode={code} className="w-full h-full" fill="rgba(211,47,47,0.15)" stroke="var(--atlas-error)" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-atlas-ink text-label font-black truncate">{state?.name || code}</span>
                        <span className="text-atlas-error font-mono text-label font-bold">{count} {count === 1 ? 'miss' : 'misses'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-2xl mb-2">🛡️</span>
                  <p className="text-atlas-accent font-black text-label uppercase tracking-widest font-display">All Regions Mastered</p>
                  <p className="text-atlas-muted text-body mt-1 font-medium">No regions needing review detected in this expedition.</p>
                </div>
              )}
            </AnimatedCard>

            {/* Strengths */}
            <AnimatedCard tiltAmount={2} className="p-6 rounded-3xl border border-atlas-accent/30 bg-atlas-card backdrop-blur-xl shadow-md flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-atlas-border font-display">
                <div className="w-8 h-8 rounded-xl bg-atlas-accent/15 text-atlas-accent flex items-center justify-center text-lg shadow-sm">
                  🏆
                </div>
                <div>
                  <h3 className="text-atlas-ink font-black text-sm uppercase tracking-wider">Your Strengths</h3>
                  <span className="text-atlas-accent text-label font-bold block mt-0.5">Mastered & secured territories</span>
                </div>
              </div>

              {strengths.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {strengths.map(({ state, code, count }) => (
                    <div key={code} className="flex items-center gap-3 p-3 rounded-2xl bg-atlas-accent/10 border border-atlas-accent/20 shadow-sm">
                      <div className="w-8 h-8 flex-shrink-0">
                        <StateOutline stateCode={code} className="w-full h-full" fill="rgba(46,125,50,0.15)" stroke="var(--atlas-accent)" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-atlas-ink text-label font-black truncate">{state?.name || code}</span>
                        <span className="text-atlas-accent font-mono text-label font-bold">{count} {count === 1 ? 'secure' : 'secures'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-atlas-muted text-body italic font-medium">Awaiting region validation...</span>
                </div>
              )}
            </AnimatedCard>
          </div>

          {/* Visual Heatmap */}
          <AnimatedCard tiltAmount={1} className="p-6 rounded-3xl border border-atlas-border bg-atlas-card backdrop-blur-xl shadow-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-atlas-border">
              <div className="flex items-center gap-3 font-display">
                <div className="w-8 h-8 rounded-xl bg-atlas-gold/20 text-atlas-ink flex items-center justify-center text-lg shadow-sm">
                  🗺️
                </div>
                <div>
                  <h3 className="text-atlas-ink font-black text-sm uppercase tracking-wider">Regional Accuracy Heatmap</h3>
                  <span className="text-atlas-muted text-body font-medium block mt-0.5">Your exploration map</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-label font-black uppercase tracking-wider text-atlas-ink font-display">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-atlas-accent inline-block shadow-sm" /> Secured</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-atlas-gold inline-block shadow-sm" /> Warning</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-atlas-error inline-block shadow-sm" /> Unstable</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-atlas-warm border border-atlas-border inline-block shadow-sm" /> Unvisited</div>
              </div>
            </div>

            <div className="w-full h-[380px] relative rounded-2xl overflow-hidden border border-atlas-border bg-atlas-warm shadow-inner">
              <InteractiveMap
                onRegionClick={() => {}}
                heatmapMap={heatmapMap}
                mode="explore"
                defaultFill="var(--atlas-card)"
              />
            </div>
          </AnimatedCard>
        </div>

        {/* ── Primary Actions (Issue 9.6: Visible in viewport) ──────────────── */}
        <div className="px-6 mt-8 flex flex-col gap-3 relative z-10 max-w-sm mx-auto font-display">
          {allPassed && (
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-4 rounded-2xl border-2 border-atlas-gold bg-atlas-gold/15 text-atlas-ink font-black hover:bg-atlas-gold/25 transition-all active:scale-[0.98] text-label uppercase tracking-[0.2em] shadow-sm"
            >
              Download Certificate
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadExplorerGuide(states)}
            className="w-full py-4 rounded-2xl border-2 border-atlas-accent bg-atlas-accent/15 text-atlas-ink font-black hover:bg-atlas-accent/25 transition-all active:scale-[0.98] text-label uppercase tracking-[0.2em] shadow-sm"
          >
            Download HTML Guide
          </button>
          <button
            type="button"
            onClick={handlePlayAgain}
            className="w-full py-4 rounded-2xl bg-atlas-gold hover:bg-atlas-gold/80 text-atlas-ink border border-atlas-border font-black hover:shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm text-label uppercase tracking-[0.2em]"
          >
            Start New Expedition
         </button>
        </div>



        {/* ── Badge recognition ──────────────────────────────────────────── */}
        <div className="px-6 mt-10 relative z-10">
          <h2 className="text-atlas-ink text-label font-black mb-6 px-1 text-center uppercase tracking-widest font-display">Merit Matrix</h2>
          <div className="grid grid-cols-2 gap-4">
            {BADGE_DEFS.map((badge) => {
              const earned = session.earnedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={[
                    'flex items-center gap-4 p-5 rounded-3xl border transition-all duration-700 backdrop-blur-sm shadow-sm',
                    earned
                      ? 'border-atlas-gold bg-atlas-gold/10 scale-100'
                      : 'border-atlas-border bg-atlas-card opacity-60 grayscale scale-95',
                  ].join(' ')}
                >
                  <div className={`text-3xl filter ${earned ? 'drop-shadow-sm' : ''}`} aria-hidden="true">
                    {BADGE_ICONS[badge.id] ?? '⭐'}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-label font-black uppercase tracking-wider mb-1 font-display ${earned ? 'text-atlas-ink' : 'text-atlas-muted'}`}>
                      {badge.name}
                    </p>
                    <p className="text-atlas-muted text-body font-medium leading-snug">
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
          <div className="px-6 mt-10 relative z-10">
              <div className="grid grid-cols-6 text-atlas-muted text-label font-black px-8 py-4 border-b border-atlas-border bg-atlas-card uppercase tracking-wider font-display">
                <span>Rank</span>
                <span className="col-span-2">Explorer</span>
                <span className="text-right">Stars</span>
                <span className="col-span-2 text-right">Games Passed</span>
              </div>
              <div className="max-h-[350px] overflow-auto bg-atlas-card rounded-b-3xl border-x border-b border-atlas-border shadow-sm">
                {leaderboardRows.slice(0, 10).map((row, idx) => {
                  let podium = '';
                  if (idx === 0) podium = '🥇';
                  else if (idx === 1) podium = '🥈';
                  else if (idx === 2) podium = '🥉';

                  return (
                  <div
                    key={row.agent}
                    className={[
                      'grid grid-cols-6 text-body px-8 py-5 border-b border-atlas-border last:border-0 transition-all font-medium',
                      row.agent === session.agent
                        ? 'bg-atlas-gold/15 text-atlas-ink font-black ring-1 ring-atlas-gold'
                        : 'text-atlas-ink hover:bg-atlas-warm/50',
                    ].join(' ')}
                  >
                    <span className="font-mono flex gap-2 items-center text-atlas-muted font-bold">
                      {podium ? <span className="text-lg">{podium}</span> : `#${String(idx + 1).padStart(2, '0')}`}
                    </span>
                    <span className="col-span-2 truncate flex items-center font-bold">
                      {row.agent}
                      {row.agent === session.agent && <span className="ml-2 px-2 py-0.5 rounded-full text-label uppercase tracking-wider bg-atlas-gold/30 text-atlas-ink font-black font-display shadow-sm">You</span>}
                    </span>
                    <span className="text-right font-mono text-atlas-ink font-bold">{row.totalStars}</span>
                    <span className="col-span-2 text-right font-mono text-atlas-muted font-bold">{`${row.gamesPassed}/${GAME_DEFINITIONS.length}`}</span>
                  </div>
                )})}
              </div>
          </div>
        )}

        <p className="text-center text-atlas-muted text-label font-mono tracking-widest mt-12 mb-8 font-bold">
          ATLAS EXPLORER — EXPEDITION COMPLETE
        </p>

      </main>
    </AppLayout>
  );
}
