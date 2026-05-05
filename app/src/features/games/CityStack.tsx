import { useEffect, useRef, useState } from 'react';
import type { GameProps, StateEntry } from '@/types';
import { useAudio } from '@/hooks/useAudio';
import InfoCard from '@/components/ui/InfoCard';
import { useParticles } from '@/components/ui/ParticleSystem';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { publicAsset } from '@/lib/assets';
import { useScorePopups } from '@/components/ui/ScorePopup';
import { TZ_FILLS } from '@/lib/timezones';
import StateOutline from '@/components/map/StateOutline';
import {
  buildTzRounds,
  isCorrectTzPlacement,
  type TzRound,
  type StateCard,
  TOTAL_ROUNDS,
  BUCKETS_PER_ROUND,
  STATES_PER_BUCKET,
  TIME_PER_ROUND,
  TOTAL_CORRECT,
} from '@/lib/tz-sorter';

// ─── Card state ────────────────────────────────────────────────────────────────

type CardStatus = 'idle' | 'correct' | 'wrong';

// ─── Component ────────────────────────────────────────────────────────────────

export default function CityStack({ onComplete, isRetry: _isRetry }: GameProps) {
  const { playSound } = useAudio();
  const { triggerBurst } = useParticles();
  const { triggerScore, ScorePopups } = useScorePopups();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [rounds,  setRounds]  = useState<TzRound[]>([]);
  const [states,  setStates]  = useState<StateEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Game state ────────────────────────────────────────────────────────────
  const [ri,           setRi]           = useState(0); // round index
  const [score,        setScore]        = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(TIME_PER_ROUND);
  const [placed,       setPlaced]       = useState<Set<string>>(new Set());
  const [cardStatus,   setCardStatus]   = useState<Record<string, CardStatus>>({});
  const [bucketPlaced, setBucketPlaced] = useState<Record<string, StateCard[]>>({});
  const [correctState, setCorrectState] = useState<StateEntry | null>(null);
  const [_finished,    setFinished]     = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const timerRef          = useRef<ReturnType<typeof setTimeout>>(undefined);
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
    fetch(publicAsset('/data/states.json'))
      .then((r) => r.json())
      .then((stateData: StateEntry[]) => {
        setStates(stateData);
        setRounds(buildTzRounds(stateData));
        setLoading(false);
      });
  }, []);

  // ── Start each round ──────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !rounds.length || ri >= TOTAL_ROUNDS) return;

    setPlaced(new Set());
    setCardStatus({});
    setBucketPlaced({});
    setCorrectState(null);
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

    if (correctInRound >= BUCKETS_PER_ROUND * STATES_PER_BUCKET) {
      playSound('pass');
    }

    correctCntRef.current += correctInRound;
    scoreRef.current      += correctInRound * (10 + (speedBonus ? 3 : 0));

    if (correctInRound >= BUCKETS_PER_ROUND * STATES_PER_BUCKET) {
      triggerScore(window.innerWidth / 2, window.innerHeight / 2, correctInRound * 10);
    }

    setScore(scoreRef.current);
    setStreak(streakRef.current);

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

  function onDragStart(e: React.DragEvent, cardId: string) {
    draggedIdRef.current = cardId;
    playSound('click');
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).dataset.hover = 'true';
  }

  function onDragLeave(e: React.DragEvent) {
    delete (e.currentTarget as HTMLElement).dataset.hover;
  }

  function placeCard(cardId: string, timezone: string, targetEl?: HTMLElement) {
    if (finishedRef.current) return;

    const currentRound = rounds[ri];
    const card = currentRound?.states.find((s) => s.id === cardId);
    if (!card || placedRef.current.has(cardId)) return;

    if (isCorrectTzPlacement(card, timezone)) {
      playSound('correct');
      triggerBurst(null, 'leaf-spark');

      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        triggerScore(rect.left + rect.width / 2, rect.top, 10);
      }

      placedRef.current.add(cardId);
      setPlaced(new Set(placedRef.current));
      setCardStatus((prev) => ({ ...prev, [cardId]: 'correct' }));

      const newBucketPlaced: Record<string, StateCard[]> = {
        ...bucketPlaced,
        [timezone]: [...(bucketPlaced[timezone] ?? []), card],
      };
      setBucketPlaced(newBucketPlaced);

      // Show state info card when bucket fills up
      if (newBucketPlaced[timezone].length === STATES_PER_BUCKET) {
        const stateInfo = states.find((s) => s.code === card.code);
        if (stateInfo) {
          setCorrectState(stateInfo);
          setTimeout(() => setCorrectState(null), 2500);
        }
      }

      streakRef.current += 1;
      if (streakRef.current >= 3) playSound('streak');
      if (streakRef.current > streakPeakRef.current) streakPeakRef.current = streakRef.current;
      setStreak(streakRef.current);

      const totalStates = BUCKETS_PER_ROUND * STATES_PER_BUCKET;
      if (placedRef.current.size === totalStates) {
        const elapsed = (Date.now() - roundStartRef.current) / 1000;
        finishRound(totalStates, elapsed <= 45);
      }
    } else {
      playSound('wrong');
      streakRef.current = 0;
      setStreak(0);
      setCardStatus((prev) => ({ ...prev, [cardId]: 'wrong' }));
      setTimeout(() => {
        setCardStatus((prev) => ({ ...prev, [cardId]: 'idle' }));
      }, 400);
    }

    setSelectedCard(null);
  }

  function onDrop(e: React.DragEvent, timezone: string) {
    e.preventDefault();
    delete (e.currentTarget as HTMLElement).dataset.hover;

    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId) return;

    placeCard(cardId, timezone, e.currentTarget as HTMLElement);
    draggedIdRef.current = null;
  }

  function onBucketTap(timezone: string, el: HTMLElement) {
    if (!selectedCard) return;
    placeCard(selectedCard, timezone, el);
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentRound = rounds[ri];
  const timerPct     = (timeLeft / TIME_PER_ROUND) * 100;
  const timerDanger  = timerPct < 30;
  const timerUrgent  = timerPct < 30 && timeLeft > 0;

  // States still in the tray (not placed)
  const trayStates   = currentRound?.states.filter((s) => !placed.has(s.id)) ?? [];

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#080c11] text-white">
        <div className="w-12 h-12 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin mb-4" />
        <p className="text-[#10B981] text-xs uppercase tracking-[0.2em] font-bold">Calibrating Sectors</p>
      </main>
    );
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <main ref={containerRef} className="flex-1 flex flex-col bg-[#050c09] p-5 gap-4 overflow-hidden relative">

      {/* Thematic Background: Forest Canopy (Performance Optimized) */}
      <div 
        className="absolute inset-0 w-full h-full object-cover opacity-[0.2] pointer-events-none z-0 animate-ambient-float"
        style={{ 
          backgroundImage: `url(${publicAsset('/assets/generated/poster-forest.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Terrain Pattern: Topo Map */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.1]"
        style={{ backgroundImage: `url("${publicAsset('/assets/patterns/topo-pattern.png')}")`, backgroundSize: '400px' }}
      />

      {/* Timer Urgency Vignette */}
      <div className={`timer-urgency ${timerUrgent ? 'active' : ''}`} />

      {/* Score Popups */}
      <ScorePopups />

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <span className="font-black text-[#10B981] text-xl">AE</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-black text-lg tracking-tight">Tz Sorter</span>
            <span className="text-[#10B981] text-[9px] uppercase tracking-[0.3em] font-black">
              Zone Recon
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
            <div className={`relative ${streak >= 3 ? 'animate-bounce' : ''}`}>
              <strong className={`font-mono text-xl leading-none transition-colors duration-300 ${streak >= 3 ? 'text-[#8B5CF6] drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]' : 'text-[#10B981]'}`}>
                {streak}x
              </strong>
              {streak >= 5 && (
                <img
                  src={publicAsset('/assets/stickers/fire.gif')}
                  className="absolute -top-4 -right-4 w-6 h-6 pointer-events-none"
                  alt=""
                />
              )}
            </div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[8px] uppercase tracking-widest font-black mb-0.5">Round</span>
            <strong className="text-white/60 font-mono text-lg leading-none">{ri + 1}/{TOTAL_ROUNDS}</strong>
          </div>
        </AnimatedCard>
      </div>

      {/* Timer Bar Area */}
      <div className="relative z-10 px-2 flex items-center gap-4">
        <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
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
        <div className={`flex-shrink-0 min-w-[4rem] text-right text-[11px] font-mono font-black tracking-widest ${timerDanger ? 'text-[#EF4444] animate-pulse' : 'text-white/90'}`}>
          {timeLeft}S
        </div>
      </div>

      {/* Instruction banner */}
      <div className="relative z-10 text-center">
        <p className="text-white/50 text-xs uppercase tracking-[0.25em] font-bold">
          Drag or tap each state/province into its timezone
        </p>
      </div>

      {/* State card tray */}
      <AnimatedCard
        tiltAmount={1}
        className="flex flex-wrap gap-3 justify-center min-h-[100px] p-5 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl relative z-10"
      >
        {trayStates.map((card) => (
          <StateCardTile
            key={card.id}
            card={card}
            status={cardStatus[card.id] ?? 'idle'}
            isSelected={selectedCard === card.id}
            onDragStart={onDragStart}
            onTap={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
            states={states}
          />
        ))}
        {trayStates.length === 0 && (
          <span className="text-[#10B981] text-[10px] font-black uppercase tracking-[0.4em] self-center animate-pulse">
            All Regions Assigned
          </span>
        )}
      </AnimatedCard>

      {/* Timezone Buckets */}
      <div
        className="grid gap-4 relative z-10 flex-1 min-h-0"
        style={{ gridTemplateColumns: `repeat(${BUCKETS_PER_ROUND}, 1fr)` }}
      >
        {currentRound?.buckets.map((bucket) => (
          <TzBucketZone
            key={bucket.timezone}
            bucket={bucket}
            placedCards={bucketPlaced[bucket.timezone] ?? []}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onTap={onBucketTap}
            hasSelection={!!selectedCard}
            states={states}
          />
        ))}
      </div>

      {/* Info Card Overlay (shown when bucket fills up) */}
      {correctState && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-emerald-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <InfoCard state={correctState} theme="forest" accentColor="#10B981" />
        </div>
      )}

      {/* Forest Watercolor Accent */}
      <div
        className="watercolor-splash left-[-40px] top-[-40px]"
        style={{ backgroundImage: `url("${publicAsset('/assets/illustrations/splash-forest.png')}")` }}
      />

      {/* Decoration */}
      <img src={publicAsset('/assets/illustrations/pine-tree.svg')} className="absolute bottom-8 right-8 w-14 h-14 opacity-15 pointer-events-none grayscale sepia" alt="" />

      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        .animate-shake { animation: shake 0.35s ease-in-out; }
      `}</style>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StateCardTile({
  card,
  status,
  isSelected,
  onDragStart,
  onTap,
  states,
}: {
  card: StateCard;
  status: CardStatus;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onTap: () => void;
  states: StateEntry[];
}) {
  const stateEntry = states.find((s) => s.code === card.code);
  const isCA = card.country === 'CA';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onClick={onTap}
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-2xl cursor-grab transition-all select-none shadow-xl',
        'border backdrop-blur-md active:scale-95',
        status === 'correct'
          ? 'opacity-0 scale-50 pointer-events-none border-transparent'
          : status === 'wrong'
          ? 'bg-[#EF4444]/20 border-[#EF4444]/50 text-[#EF4444] animate-shake'
          : isSelected
          ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400 text-white hover:-translate-y-1'
          : 'bg-white/[0.07] border-white/15 text-white hover:border-white/30 hover:bg-white/[0.12] hover:-translate-y-1 active:cursor-grabbing',
      ].join(' ')}
    >
      {/* Mini state silhouette */}
      {stateEntry && (
        <div className="w-10 h-10 flex-shrink-0">
          <StateOutline
            stateCode={card.code}
            className="w-full h-full"
            fill={status === 'wrong' ? '#EF4444' : 'rgba(255,255,255,0.2)'}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1.5}
          />
        </div>
      )}

      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[11px] font-black truncate max-w-[130px]">{card.name}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px]">{isCA ? '🇨🇦' : '🇺🇸'}</span>
        </div>
      </div>
    </div>
  );
}

function TzBucketZone({
  bucket,
  placedCards,
  onDragOver,
  onDragLeave,
  onDrop,
  onTap,
  hasSelection,
  states,
}: {
  bucket: { timezone: string; timezoneLabel: string };
  placedCards: StateCard[];
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, timezone: string) => void;
  onTap: (timezone: string, el: HTMLElement) => void;
  hasSelection: boolean;
  states: StateEntry[];
}) {
  const [hovered, setHovered] = useState(false);
  const tzColor = TZ_FILLS[bucket.timezone] ?? '#6B7280';
  const bucketRef = useRef<HTMLDivElement>(null);

  return (
    <div
      onDragOver={(e) => { onDragOver(e); setHovered(true); }}
      onDragLeave={(e) => { onDragLeave(e); setHovered(false); }}
      onDrop={(e) => { onDrop(e, bucket.timezone); setHovered(false); }}
      onClick={() => { if (hasSelection && bucketRef.current) onTap(bucket.timezone, bucketRef.current); }}
      ref={bucketRef}
      className={['flex-1', hasSelection ? 'cursor-pointer' : ''].join(' ')}
    >
      <AnimatedCard
        tiltAmount={1}
        className="h-full"
      >
        <div
          className={[
            'flex flex-col gap-2 min-h-[180px] p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl h-full',
            hovered ? 'scale-[1.03] shadow-2xl' : 'border-white/10 bg-white/[0.02]',
          ].join(' ')}
          style={
            hovered
              ? {
                  borderColor: `${tzColor}80`,
                  backgroundColor: `${tzColor}22`,
                  boxShadow: `0 0 40px ${tzColor}33`,
                }
              : undefined
          }
        >
        {/* Bucket Header */}
        <div className="flex flex-col items-center pb-3 border-b border-white/10 gap-1">
          {/* Timezone color pill */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${tzColor}33`, border: `2px solid ${tzColor}` }}
          >
            <span className="text-[7px] font-black" style={{ color: tzColor }}>{bucket.timezone}</span>
          </div>
          <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] text-center">
            {bucket.timezoneLabel}
          </h3>
          <span className="text-white/30 text-[8px] font-bold">
            {placedCards.length}/{STATES_PER_BUCKET} placed
          </span>
        </div>

        {/* Placed state cards */}
        <div className="flex flex-col gap-2 flex-1 justify-start">
          {placedCards.map((card) => {
            const stateEntry = states.find((s) => s.code === card.code);
            return (
              <div
                key={card.id}
                className="flex items-center gap-2 rounded-xl px-3 py-2 border animate-in zoom-in duration-300"
                style={{
                  backgroundColor: `${tzColor}22`,
                  borderColor: `${tzColor}44`,
                }}
              >
                {stateEntry && (
                  <div className="w-8 h-8 flex-shrink-0">
                    <StateOutline
                      stateCode={card.code}
                      className="w-full h-full"
                      fill={tzColor}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1.5}
                    />
                  </div>
                )}
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-[10px] font-black truncate" style={{ color: tzColor }}>
                    {card.name}
                  </span>
                  <span className="text-[8px] font-mono text-white/40">{card.code}</span>
                </div>
                <span className="ml-auto text-[10px] opacity-60">{card.country === 'CA' ? '🇨🇦' : '🇺🇸'}</span>
              </div>
            );
          })}

          {/* Drop zone placeholder */}
          {placedCards.length === 0 && !hovered && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-10 min-h-[60px]">
              <div
                className="w-10 h-10 rounded-full border-2 border-dashed animate-spin-slow mb-1"
                style={{ borderColor: tzColor }}
              />
              <span className="text-[8px] font-black uppercase tracking-widest text-white">Drop Here</span>
            </div>
          )}
          {hovered && placedCards.length < STATES_PER_BUCKET && (
            <div
              className="flex-1 min-h-[60px] rounded-2xl border-2 border-dashed flex items-center justify-center animate-pulse"
              style={{ borderColor: `${tzColor}80` }}
            >
              <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: tzColor }}>
                Release to Place
              </span>
            </div>
          )}
        </div>

        {/* Large ghost timezone code */}
        <div
          className="absolute -bottom-4 -right-4 text-7xl font-black italic tracking-tighter opacity-[0.04] select-none pointer-events-none"
          style={{ color: tzColor }}
        >
          {bucket.timezone}
        </div>
        </div>{/* end inner styled div */}
      </AnimatedCard>
    </div>
  );
}
