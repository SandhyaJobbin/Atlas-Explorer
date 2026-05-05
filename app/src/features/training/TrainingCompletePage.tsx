import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StateEntry, Timezone } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import { publicAsset } from '@/lib/assets';

// ─── Timezone metadata ────────────────────────────────────────────────────────

const TZ_INFO: Record<Timezone, { label: string; color: string }> = {
  PST:  { label: 'Pacific',          color: '#3B82F6' },
  MST:  { label: 'Mountain',         color: '#F97316' },
  CST:  { label: 'Central',          color: '#22C55E' },
  EST:  { label: 'Eastern',          color: '#A855F7' },
  AKST: { label: 'Alaska',           color: '#0EA5E9' },
  HST:  { label: 'Hawaii-Aleutian',  color: '#06B6D4' },
  AST:  { label: 'Atlantic',         color: '#7C3AED' },
  NST:  { label: 'Newfoundland',     color: '#EC4899' },
};

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#FF9900', '#00A8A2', '#232F3E', '#FEBD69', '#35D07F', '#FF6577'];

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  isRect: boolean;
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2.5 + Math.random() * 2.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    isRect: Math.random() > 0.5,
  }));
}

// Stable across renders — generated once at module level
const CONFETTI = generateConfetti(30);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrainingCompletePage() {
  const navigate = useNavigate();
  const [states, setStates] = useState<StateEntry[]>([]);

  useEffect(() => {
    fetch(publicAsset('/data/states.json'))
      .then((r) => r.json())
      .then(setStates)
      .catch(console.error);
  }, []);

  // Build timezone breakdown counts
  const tzRows = useMemo(() => {
    const tzCounts = states.reduce<Partial<Record<Timezone, number>>>((acc, s) => {
      acc[s.timezone] = (acc[s.timezone] ?? 0) + 1;
      return acc;
    }, {});

    return (Object.entries(TZ_INFO) as [Timezone, { label: string; color: string }][])
      .map(([tz, info]) => ({ tz, ...info, count: tzCounts[tz] ?? 0 }))
      .filter((r) => r.count > 0);
  }, [states]);

  // Memoize trivia fact to prevent flicker on scroll/re-render
  const triviaFact = useMemo(() => {
    if (states.length === 0) return null;
    const withTrivia = states.filter(s => s.trivia && s.trivia.length > 0);
    if (withTrivia.length === 0) return null;
    const rs = withTrivia[Math.floor(Math.random() * withTrivia.length)];
    const tList = rs.trivia || [];
    const rt = tList[Math.floor(Math.random() * tList.length)];
    return { fact: rt, stateName: rs.name };
  }, [states]);

  return (
    <AppLayout>
      {/* ── Confetti layer ──────────────────────────────────────────────────── */}
      <div className="confetti-container fixed inset-0 pointer-events-none overflow-hidden z-50" style={{ contain: 'layout paint' }}>
        {CONFETTI.map((p) => (
          <div
            key={p.id}
            className="confetti-piece absolute"
            style={{
              left: `${p.x}%`,
              top: '-12px',
              width: p.size,
              height: p.isRect ? p.size * 0.5 : p.size,
              backgroundColor: p.color,
              borderRadius: p.isRect ? '2px' : '50%',
              animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto w-full">
        <div className="flex flex-col items-center justify-center min-h-full gap-6 p-6 py-8 text-center">

        {/* Hero */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-7xl animate-bounce">🎉</div>
          <h1 className="text-4xl font-black text-[#F59E0B]">Training Complete!</h1>
          <p className="text-white/70 text-lg max-w-sm">
            You explored all 63 states and provinces across North America.
          </p>
        </div>

        {/* Milestone Badges */}
        <div className="flex gap-4 justify-center">
          {[
            { count: 10, label: 'Scout', icon: '⛺' },
            { count: 25, label: 'Wayfinder', icon: '🧭' },
            { count: 50, label: 'Cartographer', icon: '🗺️' },
            { count: 63, label: 'Completionist', icon: '🏆' },
          ].map((m) => (
            <div key={m.count} className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#2A3441] flex items-center justify-center text-4xl shadow-2xl border-2 border-white/10 relative group transition-all hover:scale-110 hover:border-[#FF9900]/50 hover:shadow-[0_0_30px_rgba(255,153,0,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF9900]/5 to-transparent rounded-full" />
                {m.icon}
                
                {/* Completion Checkmark Badge */}
                <div className="absolute -top-1 -right-1 bg-[#22C55E] text-white w-7 h-7 rounded-full flex items-center justify-center border-4 border-[#1F2937] shadow-lg animate-in zoom-in duration-500 delay-300 fill-mode-backwards">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Count Badge */}
                <div className="absolute -bottom-2 bg-[#FF9900] text-[#232F3E] text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#1F2937] shadow-md">
                  {m.count}
                </div>
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Timezone breakdown */}
        {tzRows.length > 0 && (
          <div className="bg-[#232F3E] rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">
              Timezone Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {tzRows.map(({ tz, label, color, count }) => (
                <div
                  key={tz}
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-colors border border-white/5"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                    style={{ backgroundColor: color }}
                  />
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-white text-[13px] font-bold leading-none truncate">{label}</div>
                  </div>
                  <span className="text-white font-black text-2xl leading-none tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Trivia Highlight */}
            {triviaFact && (
              <div className="mt-6 pt-6 border-t border-white/5 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💡</span>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#00A8A2]">Master Explorer Fact</p>
                </div>
                <p className="text-white/80 text-sm leading-relaxed font-medium bg-white/5 p-4 rounded-xl border border-white/5 italic">
                  "{triviaFact.fact}"
                </p>
                <p className="text-[10px] text-white/30 mt-2 text-right">— {triviaFact.stateName}</p>
              </div>
            )}

            <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.15em] mt-6 text-center border-t border-white/5 pt-4">
              {states.filter((s) => s.country === 'US').length} US States &nbsp;·&nbsp;{' '}
              {states.filter((s) => s.country === 'CA').length} Canadian Provinces & Territories
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate('/play')}
          className="group relative bg-[#F59E0B] hover:bg-[#FBBF24] text-[#1F2937] font-black px-16 py-5 rounded-2xl text-xl transition-all shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 mt-4"
        >
          <span className="relative z-10 flex items-center gap-3">
            PROCEED TO MISSION PHASE
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
        </div>
      </div>
    </AppLayout>
  );
}
