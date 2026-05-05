import { useEffect, useRef, useState } from 'react';
import type { GameAttempt, EarnedBadge, StateEntry } from '@/types';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useParticles } from '@/components/ui/ParticleSystem';
import { useAudio } from '@/hooks/useAudio';
import { publicAsset } from '@/lib/assets';

const CONFETTI_COLORS = ['#FF9900', '#00A8A2', '#FEBD69', '#35D07F', '#F59E0B', '#FFFFFF'];

const CONFETTI = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: (i * 47) % 100,
  delay: (i % 18) * 0.09,
  duration: 2 + (i % 6) * 0.22,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 5 + (i % 5) * 2,
  isRect: i % 3 !== 0,
}));

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
      triggerBurst(null, 'leaf-spark', { count: 40, spread: 250 });
    }, 300);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main ref={containerRef} className="flex-1 flex flex-col items-center justify-start md:justify-center gap-8 p-6 md:p-12 text-center relative overflow-y-auto custom-scrollbar bg-[#2D3B2F]">

      {/* Terrain Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05]" 
        style={{ backgroundImage: `url("${publicAsset('/assets/patterns/dots-pattern.png')}")`, backgroundSize: '120px' }} 
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {CONFETTI.map((piece) => (
          <span
            key={piece.id}
            className="absolute top-[-12px]"
            style={{
              left: `${piece.x}%`,
              width: piece.size,
              height: piece.isRect ? piece.size * 0.5 : piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.isRect ? 2 : '50%',
              opacity: 0.85,
              animation: `confettiFall ${piece.duration}s ${piece.delay}s ease-in forwards`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="text-[#10B981] text-[10px] font-black uppercase tracking-widest drop-shadow-md">
          {gameLabel}
        </span>
        <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
          CLEARANCE GRANTED
        </h1>
      </div>

      <AnimatedCard tiltAmount={4} className="flex-shrink-0 bg-black/40 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl relative group overflow-hidden paper-texture">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
        
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="text-7xl md:text-8xl font-black text-[#F59E0B] tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <AnimatedScore target={attempt.score} />
          </div>
          <div className="text-white/40 text-[9px] font-black uppercase tracking-wider">
            Intelligence Secured
          </div>
        </div>

        <StarStrip stars={attempt.stars} />

        <div className="relative z-10 mt-6 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex gap-6 text-[10px] font-black tracking-widest text-white/60">
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

      {/* Fun Fact Section */}
      {randomFact && (
        <div className="relative z-10 max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">💡</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#F59E0B]">Explorer Tip</span>
          </div>
          <p className="text-white/80 text-sm leading-relaxed font-medium italic">
            "{randomFact}"
          </p>
        </div>
      )}

      {/* Badges */}
      {newBadges.length > 0 && (
        <div className="relative z-10 flex flex-col gap-2">
           <span className="text-white/30 text-[9px] font-black tracking-widest">Merit Discovered</span>
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
        className="relative z-10 btn-chunky btn-chunky-orange px-16 py-5 text-xl mt-4 mb-2 flex-shrink-0"
      >
        {isFinalMission ? 'Mission Log' : 'Next Sector'}
      </button>

      <p className="relative z-10 text-white/20 text-[9px] font-black tracking-widest animate-pulse">
        Press continue to synchronize data
      </p>
    </main>
  );
}
