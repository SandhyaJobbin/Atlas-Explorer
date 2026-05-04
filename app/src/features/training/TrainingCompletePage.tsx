import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StateEntry, Timezone } from '@/types';
import AppLayout from '@/components/layout/AppLayout';

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
const CONFETTI = generateConfetti(70);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrainingCompletePage() {
  const navigate = useNavigate();
  const [states, setStates] = useState<StateEntry[]>([]);

  useEffect(() => {
    fetch('/data/states.json')
      .then((r) => r.json())
      .then(setStates)
      .catch(console.error);
  }, []);

  // Build timezone breakdown counts
  const tzCounts = states.reduce<Partial<Record<Timezone, number>>>((acc, s) => {
    acc[s.timezone] = (acc[s.timezone] ?? 0) + 1;
    return acc;
  }, {});

  const tzRows = (Object.entries(TZ_INFO) as [Timezone, { label: string; color: string }][])
    .map(([tz, info]) => ({ tz, ...info, count: tzCounts[tz] ?? 0 }))
    .filter((r) => r.count > 0);

  return (
    <AppLayout>
      {/* ── Confetti layer ──────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {CONFETTI.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: '-12px',
              width: p.size,
              height: p.isRect ? p.size * 0.5 : p.size,
              backgroundColor: p.color,
              borderRadius: p.isRect ? '2px' : '50%',
              animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
            }}
          />
        ))}
      </div>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6 text-center">

        {/* Hero */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-7xl animate-bounce">🎉</div>
          <h1 className="text-4xl font-black text-[#232F3E]">Training Complete!</h1>
          <p className="text-[#2D3B2F]/70 text-lg max-w-sm">
            You explored all 63 states and provinces across North America.
          </p>
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
                  className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2.5 transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-white text-xs font-bold leading-none">{tz}</div>
                    <div className="text-white/40 text-[10px] leading-tight mt-0.5 truncate">{label}</div>
                  </div>
                  <span className="text-white font-black text-xl leading-none tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-white/30 text-xs mt-4 text-center">
              {states.filter((s) => s.country === 'US').length} US states &nbsp;·&nbsp;{' '}
              {states.filter((s) => s.country === 'CA').length} Canadian provinces &amp; territories
            </p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => navigate('/play')}
          className="bg-[#FF9900] hover:bg-[#FEBD69] text-[#232F3E] font-bold px-12 py-4 rounded-xl text-lg transition-colors shadow-lg"
        >
          Start the Games →
        </button>
      </div>
    </AppLayout>
  );
}
