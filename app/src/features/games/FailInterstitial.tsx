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
      className={`relative z-10 btn-chunky px-16 py-5 text-xl transition-all font-display ${seconds > 0 ? 'opacity-40 cursor-not-allowed bg-atlas-border text-atlas-muted' : 'btn-chunky-orange'}`}
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
    <main className="flex-1 flex flex-col items-center justify-start md:justify-center gap-8 p-6 md:p-12 text-center relative overflow-y-auto custom-scrollbar bg-atlas-warm font-display">

      {/* Reddish Glitchy Background */}
      <div className="absolute inset-0 bg-atlas-error/5 animate-pulse pointer-events-none" />
      
      {/* Terrain Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05] grayscale sepia" 
        style={{ backgroundImage: `url("${publicAsset('/assets/patterns/dots-pattern.png')}")`, backgroundSize: '120px' }} 
      />

      <div className="relative z-10 flex flex-col items-center gap-2 font-display">
        <span className="text-atlas-error text-xs font-black uppercase tracking-widest drop-shadow-md font-display">
          {gameLabel}
        </span>
        <h1 className="text-6xl font-black text-atlas-ink tracking-tighter drop-shadow-2xl font-display">
          PROTOCOL ERROR
        </h1>
      </div>

      <AnimatedCard tiltAmount={4} className="flex-shrink-0 bg-atlas-card backdrop-blur-xl border border-atlas-border p-8 md:p-10 rounded-[40px] shadow-2xl relative group overflow-hidden border-t-atlas-error/30 paper-texture font-display">
        <div className="absolute inset-0 bg-gradient-to-br from-atlas-error/10 to-transparent opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center gap-2 mb-6 font-display">
          <div className="text-7xl font-black text-atlas-ink tabular-nums tracking-tighter opacity-80 font-mono">
            <AnimatedScore target={attempt.score} />
          </div>
          <div className="text-atlas-muted text-xs font-black uppercase tracking-wider font-display">
            Efficiency Logged
          </div>
        </div>

        {/* Attempt history dots */}
        {dots.length > 0 && (
          <div className="flex gap-3 items-center justify-center mb-6 relative z-10 font-display">
            {dots.map((dot, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  dot.passed ? 'bg-atlas-accent' : 'bg-atlas-error'
                } ${dot.isCurrent ? 'ring-4 ring-atlas-ink/20 scale-125' : 'opacity-40'}`}
              />
            ))}
          </div>
        )}

        <div className="relative z-10 px-6 py-3 rounded-2xl bg-atlas-warm border border-atlas-border flex flex-col gap-1 font-display">
           <span className="text-atlas-muted text-xs font-black uppercase tracking-widest font-display">Motivational Brief</span>
           <p className="text-atlas-ink/80 text-xs font-bold tracking-tight font-sans">{message}</p>
        </div>
      </AnimatedCard>

      {/* Personal best badge */}
      {personalBest && (
        <div className="relative z-10 px-4 py-2 rounded-full bg-atlas-gold/20 border border-atlas-gold/30 text-atlas-gold text-xs font-black uppercase tracking-widest animate-pulse font-display">
          ⚡ New Efficiency High
        </div>
      )}

      <RetryButton onClick={onRetry} />

      <p className="relative z-10 text-atlas-muted text-xs font-black uppercase tracking-widest font-display">
        System recalibrating for attempt {attempt.attemptNumber + 1}
      </p>
    </main>
  );
}

