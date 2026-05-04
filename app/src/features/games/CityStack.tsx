import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameProps } from '@/types';
import { useAudio } from '@/hooks/useAudio';
import { useParticles } from '@/components/ui/ParticleSystem';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import {
  buildRounds,
  isCorrectPlacement,
  type Round,
  type CityWithId,
  TOTAL_ROUNDS,
  BUCKETS_PER_ROUND,
  CITIES_PER_BUCKET,
  TIME_PER_ROUND,
  TOTAL_CORRECT,
} from '@/lib/city-sorter';

// ─── City card state ──────────────────────────────────────────────────────────

type CardStatus = 'idle' | 'correct' | 'wrong';

// ─── Component ────────────────────────────────────────────────────────────────

export default function CityStack({ onComplete, isRetry }: GameProps) {
  const { playSound } = useAudio();
  const { triggerBurst } = useParticles();
  
  // ── Data ──────────────────────────────────────────────────────────────────
  const [rounds,  setRounds]  = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Game state ────────────────────────────────────────────────────────────
  const [ri,           setRi]           = useState(0); // round index
  const [score,        setScore]        = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [streakPeak,   setStreakPeak]   = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(TIME_PER_ROUND);
  const [cityLookup,   setCityLookup]   = useState<Map<string, CityWithId>>(new Map());
  const [placed,       setPlaced]       = useState<Set<string>>(new Set());
  const [cardStatus,   setCardStatus]   = useState<Record<string, CardStatus>>({});
  const [bucketPlaced, setBucketPlaced] = useState<Record<string, CityWithId[]>>({});
  const [finished,     setFinished]     = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const timerRef          = useRef<ReturnType<typeof setInterval>>();
  const roundStartRef     = useRef(0);
  const scoreRef          = useRef(0);
  const correctCntRef     = useRef(0);
  const streakRef         = useRef(0);
  const streakPeakRef     = useRef(0);
  const placedRef         = useRef<Set<string>>(new Set());
  const finishedRef       = useRef(false);
  const draggedIdRef      = useRef<string | null>(null);
  const containerRef      = useRef<HTMLDivElement>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/data/cities.json')
      .then((r) => r.json())
      .then((data) => {
        setRounds(buildRounds(data));
        setLoading(false);
      });
  }, []);

  // ── Start each round ──────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !rounds.length || ri >= TOTAL_ROUNDS) return;

    const round = rounds[ri];
    const lookup = new Map(round.cities.map((c) => [c.id, c]));

    setCityLookup(lookup);
    setPlaced(new Set());
    setCardStatus({});
    setBucketPlaced({});
    setFinished(false);
    setTimeLeft(TIME_PER_ROUND);

    placedRef.current   = new Set();
    finishedRef.current = false;
    roundStartRef.current = Date.now();

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === 4) playSound('timer-warning');
        if (t <= 4 && t > 1) playSound('tick');
        if (t <= 1) {
          clearInterval(timerRef.current);
          finishRound(placedRef.current.size, false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [ri, loading, rounds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Round finish ──────────────────────────────────────────────────────────

  function finishRound(correctInRound: number, speedBonus: boolean) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearInterval(timerRef.current);

    if (correctInRound >= BUCKETS_PER_ROUND * CITIES_PER_BUCKET) {
      playSound('pass');
    }

    correctCntRef.current += correctInRound;
    scoreRef.current      += correctInRound * (10 + (speedBonus ? 3 : 0));
    setCorrectCount(correctCntRef.current);
    setScore(scoreRef.current);
    setStreak(streakRef.current);
    setStreakPeak(streakPeakRef.current);

    const nextRi = ri + 1;
    setTimeout(() => {
      if (nextRi >= TOTAL_ROUNDS) {
        onComplete({
          score:        scoreRef.current,
          correctCount: correctCntRef.current,
          totalCount:   TOTAL_CORRECT,
          streakPeak:   streakPeakRef.current,
        });
      } else {
        setRi(nextRi);
      }
    }, 1500);
  }

  // ── Drag & drop handlers ──────────────────────────────────────────────────

  function onDragStart(e: React.DragEvent, cityId: string) {
    draggedIdRef.current = cityId;
    playSound('click');
    e.dataTransfer.setData('text/plain', cityId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).dataset.hover = 'true';
  }

  function onDragLeave(e: React.DragEvent) {
    delete (e.currentTarget as HTMLElement).dataset.hover;
  }

  function onDrop(e: React.DragEvent, stateCode: string) {
    e.preventDefault();
    delete (e.currentTarget as HTMLElement).dataset.hover;
    if (finishedRef.current) return;

    const cityId = e.dataTransfer.getData('text/plain');
    if (!cityId) return;
    const city = cityLookup.get(cityId);
    if (!city || placedRef.current.has(cityId)) return;

    if (isCorrectPlacement(city, stateCode)) {
      playSound('correct');
      triggerBurst(null, 'leaf-spark');
      
      placedRef.current.add(cityId);
      setPlaced(new Set(placedRef.current));
      setCardStatus((prev) => ({ ...prev, [cityId]: 'correct' }));
      setBucketPlaced((prev) => ({
        ...prev,
        [stateCode]: [...(prev[stateCode] ?? []), city],
      }));

      streakRef.current += 1;
      if (streakRef.current >= 3) playSound('streak');
      if (streakRef.current > streakPeakRef.current) streakPeakRef.current = streakRef.current;
      setStreak(streakRef.current);
      setStreakPeak(streakPeakRef.current);

      const totalCities = BUCKETS_PER_ROUND * CITIES_PER_BUCKET;
      if (placedRef.current.size === totalCities) {
        const elapsed = (Date.now() - roundStartRef.current) / 1000;
        finishRound(totalCities, elapsed <= 45);
      }
    } else {
      playSound('wrong');
      streakRef.current = 0;
      setStreak(0);
      setCardStatus((prev) => ({ ...prev, [cityId]: 'wrong' }));
      setTimeout(() => {
        setCardStatus((prev) => ({ ...prev, [cityId]: 'idle' }));
      }, 400);
    }

    draggedIdRef.current = null;
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentRound = rounds[ri];
  const timerPct     = (timeLeft / TIME_PER_ROUND) * 100;
  const timerDanger  = timerPct < 30;

  // Cities still in the tray (not placed)
  const trayCities   = currentRound?.cities.filter((c) => !placed.has(c.id)) ?? [];

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#080c11] text-white">
        <div className="w-12 h-12 rounded-full border-2 border-[#FEBD69] border-t-transparent animate-spin mb-4" />
        <p className="text-[#FEBD69] text-xs uppercase tracking-[0.2em] font-bold">Assembling Hubs</p>
      </main>
    );
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <main ref={containerRef} className="flex-1 flex flex-col bg-[#062016] p-5 gap-4 overflow-hidden relative">
      
      {/* Background Video: Forest Canopy */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.2] pointer-events-none"
      >
        <source src="/assets/video/forest-bg.mp4" type="video/mp4" />
      </video>

      {/* Terrain Pattern: Topo Map */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.1]" 
        style={{ backgroundImage: 'url("/assets/patterns/topo-pattern.png")', backgroundSize: '400px' }} 
      />

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <span className="font-black text-[#10B981] text-xl">AE</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-black text-lg tracking-tight">City Stack</span>
            <span className="text-[#10B981] text-[9px] uppercase tracking-[0.3em] font-black">
              Forest Canopy
            </span>
          </div>
        </div>
        
        <AnimatedCard tiltAmount={2} className="flex items-center gap-6 bg-white/[0.05] border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[8px] uppercase tracking-widest font-black mb-0.5">Points</span>
            <strong className="text-white font-mono text-xl leading-none">{score.toLocaleString()}</strong>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[8px] uppercase tracking-widest font-black mb-0.5">Streak</span>
            <strong className="text-[#10B981] font-mono text-xl leading-none">{streak}x</strong>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[8px] uppercase tracking-widest font-black mb-0.5">Level</span>
            <strong className="text-white/60 font-mono text-lg leading-none">{ri + 1}/{TOTAL_ROUNDS}</strong>
          </div>
        </AnimatedCard>
      </div>

      {/* Timer Bar Area */}
      <div className="relative z-10 px-2">
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerDanger ? 'animate-pulse' : ''}`}
            style={{
              width: `${timerPct}%`,
              background: timerDanger
                ? 'linear-gradient(90deg, #EF4444, #F87171)'
                : 'linear-gradient(90deg, #10B981, #34D399)',
              boxShadow: timerDanger ? '0 0 15px rgba(239,68,68,0.5)' : '0 0 10px rgba(16,185,129,0.3)'
            }}
          />
        </div>
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono font-black tracking-[0.3em] ${timerDanger ? 'text-[#EF4444]' : 'text-white/40'}`}>
          {timeLeft}S REMAINING
        </div>
      </div>

      {/* City tray */}
      <AnimatedCard tiltAmount={1} className="flex flex-wrap gap-3 justify-center min-h-[110px] p-6 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl relative z-10 mt-2">
        {trayCities.map((city) => (
          <CityCard
            key={city.id}
            city={city}
            status={cardStatus[city.id] ?? 'idle'}
            onDragStart={onDragStart}
          />
        ))}
        {trayCities.length === 0 && (
          <span className="text-[#10B981] text-[10px] font-black uppercase tracking-[0.4em] self-center animate-pulse">All Hubs Dispatched</span>
        )}
      </AnimatedCard>

      {/* Buckets */}
      <div className="grid gap-4 relative z-10 mt-2" style={{ gridTemplateColumns: `repeat(${BUCKETS_PER_ROUND}, 1fr)` }}>
        {currentRound?.buckets.map((bucket) => (
          <Bucket
            key={bucket.stateCode}
            stateCode={bucket.stateCode}
            stateName={bucket.stateName}
            placedCities={bucketPlaced[bucket.stateCode] ?? []}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          />
        ))}
      </div>

      {/* Decoration */}
      <img src="/assets/illustrations/pine-tree.svg" className="absolute bottom-8 right-8 w-14 h-14 opacity-15 pointer-events-none grayscale sepia" alt="" />
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CityCard({
  city,
  status,
  onDragStart,
}: {
  city: CityWithId;
  status: CardStatus;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, city.id)}
      className={[
        'px-6 py-4 text-sm font-black cursor-grab transition-all select-none shadow-xl transform active:scale-95 relative overflow-hidden',
        'min-w-[140px] text-center backdrop-blur-md border-t-2 border-b-2',
        status === 'correct'
          ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981] opacity-0 scale-50 pointer-events-none'
          : status === 'wrong'
          ? 'bg-[#EF4444]/20 border-[#EF4444]/50 text-[#EF4444] animate-shake'
          : 'bg-white/[0.08] border-white/20 text-white hover:border-[#10B981] hover:bg-white/[0.12] active:cursor-grabbing hover:-translate-y-1',
      ].join(' ')}
      style={{
        maskImage: 'url("/assets/illustrations/torn-edge.png")',
        maskSize: '100% 100%',
        WebkitMaskImage: 'url("/assets/illustrations/torn-edge.png")',
        WebkitMaskSize: '100% 100%'
      }}
    >
      {city.name}
    </div>
  );
}

function Bucket({
  stateCode,
  stateName,
  placedCities,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  stateCode: string;
  stateName: string;
  placedCities: CityWithId[];
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stateCode: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <AnimatedCard
      tiltAmount={1}
      onDragOver={(e) => { onDragOver(e); setHovered(true); }}
      onDragLeave={(e) => { onDragLeave(e); setHovered(false); }}
      onDrop={(e) => { onDrop(e, stateCode); setHovered(false); }}
      className={[
        'flex flex-col gap-3 min-h-[260px] p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl',
        hovered
          ? 'border-[#10B981]/50 bg-[#10B981]/15 shadow-[0_0_40px_rgba(16,185,129,0.2)] scale-[1.03]'
          : 'border-white/10 bg-black/40',
      ].join(' ')}
    >
      <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] text-center pb-4 border-b border-white/10">
        {stateName}
      </h3>
      
      <div className="flex flex-col gap-3 relative z-10 flex-1 justify-start">
        {placedCities.map((city) => (
          <div
            key={city.id}
            className="rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981] px-5 py-3 text-xs font-black text-center shadow-inner animate-in zoom-in duration-300"
          >
            {city.name}
          </div>
        ))}
        {placedCities.length === 0 && !hovered && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/50 animate-spin-slow mb-2" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white">Standby</span>
          </div>
        )}
      </div>

      <div className="absolute -bottom-6 -right-6 text-8xl font-black italic tracking-tighter text-white opacity-[0.02] select-none pointer-events-none">
        {stateCode}
      </div>
    </AnimatedCard>
  );
}
