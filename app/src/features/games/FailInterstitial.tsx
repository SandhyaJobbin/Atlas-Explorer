import { useEffect, useRef, useState } from 'react';
import type { GameAttempt } from '@/types';
import { getMotivationalCopy, hasPersonalBest, getAttemptDots } from '@/lib/flow-ui';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useParticles } from '@/components/ui/ParticleSystem';
import { useAudio } from '@/hooks/useAudio';
import { publicAsset } from '@/lib/assets';

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedScore({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === 0) return;
    const duration = 800;
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

function RetryButton({ onClick }: { onClick: () => void }) {
  const [seconds, setSeconds] = useState(3);
  const { playSound } = useAudio();

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => {
      setSeconds((s) => s - 1);
      if (seconds > 1) playSound('click');
    }, 1000);
    return () => clearTimeout(id);
  }, [seconds, playSound]);

  return (
    <button
      onClick={onClick}
      disabled={seconds > 0}
      className={`relative z-10 btn-chunky px-16 py-5 text-xl transition-all ${seconds > 0 ? 'opacity-40 cursor-not-allowed bg-gray-500 text-white' : 'btn-chunky-orange'}`}
    >
      {seconds > 0 ? `Syncing... (${seconds}s)` : 'Initiate Retry'}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FailInterstitialProps {
  gameLabel: string;
  attempt: GameAttempt;
  allAttempts: GameAttempt[];
  onRetry: () => void;
}

export default function FailInterstitial({
  gameLabel,
  attempt,
  allAttempts,
  onRetry,
}: FailInterstitialProps) {
  const { triggerBurst } = useParticles();
  const { playSound } = useAudio();
  const dots = getAttemptDots(allAttempts);
  const personalBest = hasPersonalBest(allAttempts, attempt.ratio);
  const message = getMotivationalCopy(attempt.attemptNumber);

  useEffect(() => {
    playSound('wrong');
    triggerBurst(null, 'sand-burst', { count: 20, spread: 150 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="flex-1 flex flex-col items-center justify-start md:justify-center gap-8 p-6 md:p-12 text-center relative overflow-y-auto custom-scrollbar bg-[#2D2A2F]">

      {/* Reddish Glitchy Background */}
      <div className="absolute inset-0 bg-[#FF6577]/5 animate-pulse pointer-events-none" />
      
      {/* Terrain Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05] grayscale sepia" 
        style={{ backgroundImage: `url("${publicAsset('/assets/patterns/dots-pattern.png')}")`, backgroundSize: '120px' }} 
      />

      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="text-[#FF6577] text-[10px] font-black uppercase tracking-widest drop-shadow-md">
          {gameLabel}
        </span>
        <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
          PROTOCOL ERROR
        </h1>
      </div>

      <AnimatedCard tiltAmount={4} className="flex-shrink-0 bg-black/60 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl relative group overflow-hidden border-t-[#FF6577]/30 paper-texture">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center gap-2 mb-6">
          <div className="text-7xl font-black text-white tabular-nums tracking-tighter opacity-80">
            <AnimatedScore target={attempt.score} />
          </div>
          <div className="text-white/30 text-[9px] font-black uppercase tracking-wider">
            Efficiency Logged
          </div>
        </div>

        {/* Attempt history dots */}
        {dots.length > 0 && (
          <div className="flex gap-3 items-center justify-center mb-6 relative z-10">
            {dots.map((dot, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  dot.passed ? 'bg-[#10B981]' : 'bg-[#FF6577]'
                } ${dot.isCurrent ? 'ring-4 ring-white/20 scale-125' : 'opacity-40'}`}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
           <span className="text-white/20 text-[8px] font-black uppercase tracking-widest">Motivational Brief</span>
           <p className="text-white/60 text-xs font-bold tracking-tight">{message}</p>
        </div>
      </AnimatedCard>

      {/* Personal best badge */}
      {personalBest && (
        <div className="relative z-10 px-4 py-2 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#F59E0B] text-[10px] font-black uppercase tracking-widest animate-pulse">
          ⚡ New Efficiency High
        </div>
      )}

      <RetryButton onClick={onRetry} />

      <p className="relative z-10 text-white/10 text-[9px] font-black uppercase tracking-widest">
        System recalibrating for attempt {attempt.attemptNumber + 1}
      </p>
    </main>
  );
}
