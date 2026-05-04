import { useEffect, useRef } from 'react';
import type { GameAttempt, EarnedBadge } from '@/types';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useParticles } from '@/components/ui/ParticleSystem';
import { useAudio } from '@/hooks/useAudio';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarStrip({ stars }: { stars: number }) {
  return (
    <div className="flex gap-4 justify-center py-4">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`text-5xl transition-all duration-700 ${
            n <= stars 
              ? 'opacity-100 scale-110 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]' 
              : 'opacity-10 grayscale brightness-50'
          }`}
          style={{ transitionDelay: `${n * 150}ms` }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

function AnimatedScore({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === 0) return;
    const duration = 1000;
    const start = performance.now();
    const raf = requestAnimationFrame(function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const easeOut = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(easeOut * target));
      if (t < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return <span ref={ref}>0</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PassInterstitialProps {
  gameLabel: string;
  attempt: GameAttempt;
  isFinalMission: boolean;
  newBadges: EarnedBadge[];
  onContinue: () => void;
}

export default function PassInterstitial({
  gameLabel,
  attempt,
  isFinalMission,
  newBadges,
  onContinue,
}: PassInterstitialProps) {
  const { triggerBurst } = useParticles();
  const { playSound } = useAudio();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    playSound('correct');
    const timer = setTimeout(() => {
      triggerBurst(null, 'leaf-spark', { count: 40, spread: 250 });
    }, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main ref={containerRef} className="flex-1 flex flex-col items-center justify-center gap-8 p-12 text-center relative overflow-hidden bg-[#2D3B2F]">

      {/* Terrain Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05]" 
        style={{ backgroundImage: 'url("/assets/patterns/dots-pattern.png")', backgroundSize: '120px' }} 
      />

      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="text-[#10B981] text-[10px] font-black uppercase tracking-[0.4em] drop-shadow-md">
          {gameLabel}
        </span>
        <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
          CLEARANCE GRANTED
        </h1>
      </div>

      <AnimatedCard tiltAmount={4} className="bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] shadow-2xl relative group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="text-8xl font-black text-[#F59E0B] tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <AnimatedScore target={attempt.score} />
          </div>
          <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
            Intelligence Secured
          </div>
        </div>

        <StarStrip stars={attempt.stars} />

        <div className="relative z-10 mt-6 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex gap-6 text-[11px] font-black uppercase tracking-widest text-white/60">
          <div>
            <span className="text-white/20 mr-2">Accuracy:</span>
            {Math.round(attempt.ratio * 100)}%
          </div>
          <div className="w-px h-3 bg-white/10 self-center" />
          <div>
            <span className="text-white/20 mr-2">Hits:</span>
            {attempt.correctCount}/{attempt.totalCount}
          </div>
        </div>
      </AnimatedCard>

      {/* Badges */}
      {newBadges.length > 0 && (
        <div className="relative z-10 flex flex-col gap-2">
           <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">Merit Discovered</span>
           <div className="flex gap-3 justify-center">
             {newBadges.map((badge) => (
               <div key={badge.id} className="px-4 py-2 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-black uppercase tracking-widest animate-bounce">
                 🏅 {badge.name}
               </div>
             ))}
           </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onContinue}
        className="relative z-10 bg-[#F59E0B] hover:bg-[#FFB12B] text-[#2D3B2F] font-black px-16 py-5 rounded-2xl text-xl transition-all shadow-[0_10px_0_#D97706] hover:translate-y-0.5 active:translate-y-1 active:shadow-[0_4px_0_#D97706] uppercase tracking-[0.2em] mt-4"
      >
        {isFinalMission ? 'Mission Log' : 'Next Sector'}
      </button>

      <p className="relative z-10 text-white/20 text-[9px] font-black uppercase tracking-widest animate-pulse">
        Press continue to synchronize data
      </p>
    </main>
  );
}
