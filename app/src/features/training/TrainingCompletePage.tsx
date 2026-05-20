import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StateEntry, Timezone } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import { publicAsset } from '@/lib/assets';
import { TZ_FILLS } from '@/lib/timezones';
import { TOTAL_REGIONS } from '@/lib/session';

// ─── Timezone metadata ────────────────────────────────────────────────────────

const TZ_INFO: Record<Timezone, { label: string; color: string }> = {
  PST:  { label: 'Pacific',          color: TZ_FILLS.PST },
  MST:  { label: 'Mountain',         color: TZ_FILLS.MST },
  CST:  { label: 'Central',          color: TZ_FILLS.CST },
  EST:  { label: 'Eastern',          color: TZ_FILLS.EST },
  AKST: { label: 'Alaska',           color: TZ_FILLS.AKST },
  HST:  { label: 'Hawaii-Aleutian',  color: TZ_FILLS.HST },
  AST:  { label: 'Atlantic',         color: TZ_FILLS.AST },
  NST:  { label: 'Newfoundland',     color: TZ_FILLS.NST },
};

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#F9A825', '#2E7D32', '#1B1B1B', '#F57F17', '#388E3C', '#D32F2F'];

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

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

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

  const triviaFact = useMemo(() => {
    if (states.length === 0) return null;
    const withTrivia = states.filter(s => s.trivia && s.trivia.length > 0);
    if (withTrivia.length === 0) return null;
    const seed = withTrivia.map((state) => state.code).join('|');
    const rs = withTrivia[hashString(seed) % withTrivia.length];
    const tList = rs.trivia || [];
    const rt = tList[hashString(`${seed}:${rs.code}`) % tList.length];
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
      <div className="relative z-10 flex-1 overflow-y-auto w-full bg-atlas-warm">
        <div className="flex flex-col items-center justify-center min-h-full gap-6 p-6 py-8 text-center">

        {/* Hero */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-7xl animate-bounce" aria-hidden="true">🎉</div>
          <h1 className="text-4xl font-black text-atlas-gold font-display">Training Complete!</h1>
          <p className="text-atlas-ink/80 text-lg max-w-sm font-medium">
            You explored all {TOTAL_REGIONS} states and provinces across North America.
          </p>
        </div>

        {/* Milestone Badges */}
        <div className="flex gap-4 justify-center">
          {[
            { count: 10, label: 'Scout', icon: '⛺' },
            { count: 25, label: 'Wayfinder', icon: '🧭' },
            { count: 50, label: 'Cartographer', icon: '🗺️' },
            { count: TOTAL_REGIONS, label: 'Completionist', icon: '🏆' },
          ].map((m) => (
            <div key={m.count} className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-atlas-card flex items-center justify-center text-4xl shadow-md border border-atlas-border relative group transition-all hover:scale-110 hover:border-atlas-gold hover:shadow-[0_0_20px_rgba(249,168,37,0.3)]">
                <div className="absolute inset-0 bg-atlas-gold/5 rounded-full" />
                <span aria-hidden="true">{m.icon}</span>
                
                {/* Completion Checkmark Badge */}
                <div className="absolute -top-1 -right-1 bg-atlas-accent text-white w-7 h-7 rounded-full flex items-center justify-center border-2 border-atlas-card shadow-sm animate-in zoom-in duration-500 delay-300 fill-mode-backwards">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Count Badge */}
                <div className="absolute -bottom-2 bg-atlas-gold text-atlas-ink text-xs font-black px-2.5 py-0.5 rounded-full border border-atlas-border shadow-sm font-display">
                  {m.count}
                </div>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-atlas-muted font-display">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Timezone breakdown */}
        {tzRows.length > 0 && (
        <div className="bg-atlas-card rounded-[32px] p-8 w-full max-w-md shadow-lg border border-atlas-border backdrop-blur-xl relative overflow-hidden">
            <h2 className="text-atlas-ink text-xs font-bold mb-4 uppercase tracking-widest font-display">
              Timezone Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {tzRows.map(({ tz, label, color, count }) => (
                <div
                  key={tz}
                  className="flex items-center gap-3 bg-atlas-warm hover:bg-atlas-warm/80 rounded-2xl px-4 py-3 transition-colors border border-atlas-border shadow-sm"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-atlas-ink text-sm font-bold leading-none truncate">{label}</div>
                  </div>
                  <span className="text-atlas-ink font-black text-2xl leading-none tabular-nums font-display">
                    {count}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Trivia Highlight */}
            {triviaFact && (
              <div className="mt-6 pt-6 border-t border-atlas-border text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💡</span>
                  <p className="text-xs font-black uppercase tracking-wider text-atlas-accent font-display">Master Explorer Fact</p>
                </div>
                <p className="text-atlas-ink/90 text-sm leading-relaxed font-medium bg-atlas-warm p-4 rounded-xl border border-atlas-border italic">
                  "{triviaFact.fact}"
                </p>
                <p className="text-xs text-atlas-muted mt-2 text-right font-bold">— {triviaFact.stateName}</p>
              </div>
            )}

            <p className="text-atlas-muted text-xs font-bold mt-6 text-center border-t border-atlas-border pt-4">
              {states.filter((s) => s.country === 'US').length} US States &nbsp;·&nbsp;{' '}
              {states.filter((s) => s.country === 'CA').length} Canadian Provinces & Territories
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate('/play')}
          className="group relative bg-atlas-gold hover:bg-atlas-gold/80 text-atlas-ink font-black px-16 py-5 rounded-2xl text-xl transition-all shadow-md hover:scale-105 active:scale-95 mt-4 border border-atlas-border font-display"
        >
          <span className="relative z-10 flex items-center gap-3">
            Proceed to Expedition Phase
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
