import { useEffect, useRef, useState } from 'react';
import type { GameAttempt, EarnedBadge, StateEntry } from '@/types';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useAudio } from '@/hooks/useAudio';
import { publicAsset } from '@/lib/assets';
import { triggerConfetti } from '@/lib/celebrations';



// ─── Sub-components ───────────────────────────────────────────────────────────

function StarStrip({ stars }: { stars: number }) {
  return (
    <div className="flex gap-4 justify-center py-4 font-display">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`text-5xl transition-all duration-700 ${n <= stars
              ? 'opacity-100 scale-110 drop-shadow-[0_0_20px_rgba(249,168,37,0.6)]'
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
  isFinalExpedition: boolean;
  newBadges: EarnedBadge[];
  onContinue: () => void;
}

export default function PassInterstitial({
  gameLabel,
  attempt,
  isFinalExpedition,
  newBadges,
  onContinue,
}: PassInterstitialProps) {
  const { playSound } = useAudio();
  const containerRef = useRef<HTMLDivElement>(null);

  const [randomFact, setRandomFact] = useState<string | null>(null);

  useEffect(() => {
    fetch(publicAsset('/data/states.json'))
      .then(r => r.json())
      .then((data: StateEntry[]) => {
        const stateWithTrivia = data.filter(s => s.trivia && s.trivia.length > 0);
        if (stateWithTrivia.length > 0) {
          const s = stateWithTrivia[Math.floor(Math.random() * stateWithTrivia.length)];
          if (s.trivia && s.trivia.length > 0) {
            setRandomFact(s.trivia[Math.floor(Math.random() * s.trivia.length)]);
          }
        }
      });

    playSound('correct');
    const timer = setTimeout(() => {
      triggerConfetti();
    }, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main ref={containerRef} className="flex-1 flex flex-col items-center justify-start md:justify-center gap-8 p-6 md:p-12 text-center relative overflow-y-auto custom-scrollbar bg-atlas-warm font-display">

      {/* Terrain Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: `url("${publicAsset('/assets/patterns/dots-pattern.png')}")`, backgroundSize: '120px' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-2 font-display">
        <span className="text-atlas-accent text-xs font-black uppercase tracking-widest drop-shadow-md font-display">
          {gameLabel}
        </span>
        <h1 className="text-6xl font-black text-atlas-ink tracking-tighter drop-shadow-2xl font-display">
          CLEARANCE GRANTED
        </h1>
      </div>

      <AnimatedCard tiltAmount={4} className="flex-shrink-0 bg-atlas-card backdrop-blur-xl border border-atlas-border p-8 md:p-10 rounded-[40px] shadow-2xl relative group overflow-hidden paper-texture font-display">
        <div className="absolute inset-0 bg-gradient-to-br from-atlas-warm/10 to-transparent opacity-50" />

        <div className="relative z-10 flex flex-col items-center gap-2 font-display">
          <div className="text-7xl md:text-8xl font-black text-atlas-gold tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(249,168,37,0.3)] font-mono">
            <AnimatedScore target={attempt.score} />
          </div>
          <div className="text-atlas-muted text-xs font-black uppercase tracking-wider font-display">
            Knowledge Secured
          </div>
        </div>

        <StarStrip stars={attempt.stars} />

        <div className="relative z-10 mt-6 px-6 py-3 rounded-2xl bg-atlas-warm border border-atlas-border flex gap-6 text-xs font-black tracking-widest text-atlas-ink/80 font-display justify-center">
          <div>
            <span className="text-atlas-muted mr-2">Accuracy:</span>
            {Math.round(attempt.ratio * 100)}%
          </div>
          <div className="w-px h-3 bg-atlas-border self-center" />
          <div>
            <span className="text-atlas-muted mr-2">Hits:</span>
            {attempt.correctCount}/{attempt.totalCount}
          </div>
        </div>
      </AnimatedCard>

      {/* Fun Fact Section */}
      {randomFact && (
        <div className="relative z-10 max-w-md bg-atlas-card border border-atlas-border rounded-2xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 font-display shadow-md">
          <div className="flex items-center justify-center gap-2 mb-2 font-display">
            <span className="text-xl">💡</span>
            <span className="text-xs font-black uppercase tracking-wider text-atlas-gold font-display">Explorer Tip</span>
          </div>
          <p className="text-atlas-ink text-sm leading-relaxed font-medium italic font-sans">
            "{randomFact}"
          </p>
        </div>
      )}

      {/* Badges */}
      {newBadges.length > 0 && (
        <div className="relative z-10 flex flex-col gap-2 font-display">
          <span className="text-atlas-muted text-xs font-black tracking-widest font-display">Merit Discovered</span>
          <div className="flex gap-3 justify-center font-display">
            {newBadges.map((badge) => (
              <div key={badge.id} className="px-4 py-2 rounded-full bg-atlas-gold/20 border border-atlas-gold/30 text-atlas-gold text-xs font-black uppercase tracking-widest animate-bounce font-display">
                🏅 {badge.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onContinue}
        className="relative z-10 btn-chunky btn-chunky-orange px-16 py-5 text-xl mt-4 mb-2 flex-shrink-0 font-display"
      >
        {isFinalExpedition ? 'Expedition Log' : 'Next Region'}
      </button>

      <p className="relative z-10 text-atlas-muted text-xs font-black tracking-widest animate-pulse font-display">
        Press continue to synchronize data
      </p>
    </main>
  );
}
