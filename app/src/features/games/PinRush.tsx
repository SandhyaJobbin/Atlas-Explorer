import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameProps, StateEntry } from '@/types';
import InteractiveMap from '@/components/map/InteractiveMap';
import { useAudio } from '@/hooks/useAudio';
import { useParticles } from '@/components/ui/ParticleSystem';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import {
  pickPinQuestions,
  checkMapClick,
  checkTimezoneClick,
  calculatePoints,
  type PinQuestion,
  TOTAL_QUESTIONS,
  TIME_PER_QUESTION,
  SPEED_WINDOW,
} from '@/lib/pin-it';

// ─── Timezone badge colours ───────────────────────────────────────────────────

const TZ_BG: Record<string, string> = {
  PST: '#3B82F6',
  MST: '#F97316',
  CST: '#22C55E',
  EST: '#A855F7',
  AKST:'#0EA5E9',
  HST: '#EC4899',
  AST: '#14B8A6',
  NST: '#EF4444',
};

function tzBg(tz: string) {
  return TZ_BG[tz] ?? '#6B7280';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PinRush({ onComplete, isRetry }: GameProps) {
  const { playSound } = useAudio();
  const { triggerBurst } = useParticles();
  
  // ── Data ──────────────────────────────────────────────────────────────────
  const [states,    setStates]    = useState<StateEntry[]>([]);
  const [questions, setQuestions] = useState<PinQuestion[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── Game state ────────────────────────────────────────────────────────────
  const [qi,           setQi]           = useState(0);
  const [score,        setScore]        = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [streakPeak,   setStreakPeak]   = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(TIME_PER_QUESTION);
  const [locked,       setLocked]       = useState(false);
  const [correctCode,  setCorrectCode]  = useState<string | null>(null);
  const [wrongCode,    setWrongCode]    = useState<string | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const startedAtRef    = useRef(0);
  const timerRef        = useRef<ReturnType<typeof setInterval>>();
  const scoreRef        = useRef(0);
  const correctCntRef   = useRef(0);
  const streakRef       = useRef(0);
  const streakPeakRef   = useRef(0);
  const containerRef    = useRef<HTMLDivElement>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/data/states.json')
      .then((r) => r.json())
      .then((data: StateEntry[]) => {
        setStates(data);
        setQuestions(pickPinQuestions(data));
        setLoading(false);
      });
  }, []);

  // ── Timer per question ────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !questions.length || qi >= TOTAL_QUESTIONS) return;

    setLocked(false);
    setCorrectCode(null);
    setWrongCode(null);
    setTimeLeft(TIME_PER_QUESTION);
    startedAtRef.current = Date.now();

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === 4) playSound('timer-warning');
        if (t <= 4 && t > 1) playSound('tick');
        if (t <= 1) {
          clearInterval(timerRef.current);
          setLocked(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [qi, loading, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Click handler ─────────────────────────────────────────────────────────

  const onRegionClick = useCallback((code: string) => {
    if (locked) return;
    playSound('click');
    clearInterval(timerRef.current);
    pendingClickRef.current = code;
    setLocked(true);
  }, [locked]);

  // Actual logic runs via a separate effect triggered by locked state change
  const pendingClickRef = useRef<string | null | undefined>(undefined);

  // Resolve click when locked flips to true
  useEffect(() => {
    if (!locked || !questions.length || qi >= TOTAL_QUESTIONS) return;

    const clickedCode = pendingClickRef.current;
    pendingClickRef.current = undefined;
    clearInterval(timerRef.current);

    const q        = questions[qi];
    const elapsed  = (Date.now() - startedAtRef.current) / 1000;
    let isCorrect  = false;

    if (q.type === 'map') {
      isCorrect = clickedCode ? checkMapClick(q.state.code, clickedCode) : false;
      setCorrectCode(q.state.code);
      if (clickedCode && !isCorrect) setWrongCode(clickedCode);
    } else {
      isCorrect = clickedCode ? checkTimezoneClick(q.timezone, clickedCode, states) : false;
      if (isCorrect && clickedCode) setCorrectCode(clickedCode);
    }

    if (isCorrect) {
      playSound('correct');
      triggerBurst(null, 'sand-burst');
      if (streakRef.current + 1 >= 3) playSound('streak');
    } else {
      playSound('wrong');
    }

    const pts = calculatePoints(isCorrect, elapsed, SPEED_WINDOW);

    scoreRef.current      += pts;
    correctCntRef.current += isCorrect ? 1 : 0;
    streakRef.current      = isCorrect ? streakRef.current + 1 : 0;
    if (streakRef.current > streakPeakRef.current) streakPeakRef.current = streakRef.current;

    setScore(scoreRef.current);
    setCorrectCount(correctCntRef.current);
    setStreak(streakRef.current);
    setStreakPeak(streakPeakRef.current);

    setTimeout(() => {
      const next = qi + 1;
      if (next >= TOTAL_QUESTIONS) {
        onComplete({
          score:        scoreRef.current,
          correctCount: correctCntRef.current,
          totalCount:   TOTAL_QUESTIONS,
          streakPeak:   streakPeakRef.current,
          timerRatio:   timeLeft / TIME_PER_QUESTION,
        });
      } else {
        setQi(next);
      }
    }, 1200);
  }, [locked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle timeout (timer reaches 0)
  useEffect(() => {
    if (timeLeft > 0 || locked || !questions.length || qi >= TOTAL_QUESTIONS) return;
    pendingClickRef.current = null;
    setLocked(true);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentQ    = questions[qi];
  const timerPct    = (timeLeft / TIME_PER_QUESTION) * 100;
  const timerDanger = timerPct < 30;

  // Build prompt text
  let prompt = '';
  if (currentQ?.type === 'map') {
    prompt = `Find: ${currentQ.state.name}`;
  } else if (currentQ?.type === 'timezone') {
    prompt = `Click any state in the ${currentQ.timezoneLabel} timezone`;
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#080c11] text-white">
        <div className="w-12 h-12 rounded-full border-2 border-[#00A8A2] border-t-transparent animate-spin mb-4" />
        <p className="text-[#00A8A2] text-xs uppercase tracking-[0.2em] font-bold">Initializing Radar</p>
      </main>
    );
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <main ref={containerRef} className="flex-1 flex flex-col bg-[#4a3728] p-5 gap-4 overflow-hidden relative">
      
      {/* Background Video: Desert Expedition */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.12] pointer-events-none"
      >
        <source src="/assets/video/desert-bg.mp4" type="video/mp4" />
      </video>

      {/* Terrain Pattern Overlay: Dot Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.06]" 
        style={{ backgroundImage: 'url("/assets/patterns/dots-pattern.png")', backgroundSize: '200px' }} 
      />

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <span className="font-black text-[#F59E0B] text-xl">AE</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-black text-lg tracking-tight">Pin Rush</span>
            <span className="text-[#F59E0B] text-[9px] uppercase tracking-[0.3em] font-black">
              Desert Expedition
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
            <strong className="text-[#F59E0B] font-mono text-xl leading-none">{streak}x</strong>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[8px] uppercase tracking-widest font-black mb-0.5">Objective</span>
            <strong className="text-white/60 font-mono text-lg leading-none">{qi + 1}/{TOTAL_QUESTIONS}</strong>
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
                ? 'linear-gradient(90deg, #EF4444, #FF6B35)'
                : 'linear-gradient(90deg, #F59E0B, #FF9900)',
              boxShadow: timerDanger ? '0 0 15px rgba(239,68,68,0.5)' : '0 0 10px rgba(245,158,11,0.3)'
            }}
          />
        </div>
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono font-black tracking-[0.3em] ${timerDanger ? 'text-[#EF4444]' : 'text-white/40'}`}>
          {timeLeft}S LIMIT
        </div>
      </div>

      {/* Map area container */}
      <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-md shadow-2xl mt-4">
        {/* Radar sweep (Golden tint) */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-20"
          style={{
            background: 'conic-gradient(from 0deg, transparent 70%, rgba(245,158,11,0.15) 100%)',
            animation: 'pin-radar 4s linear infinite',
            transformOrigin: '50% 50%',
          }}
        />

        {/* Prompt bubble with animation */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-[#2D3B2F]/90 border border-[#F59E0B]/30 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-[0_15px_40px_rgba(0,0,0,0.5)] animate-in zoom-in duration-300">
            <span className="text-[#F59E0B] text-[10px] uppercase tracking-[0.3em] font-black block mb-1 text-center">Satellite Target</span>
            <span className="text-white text-xl font-black tracking-tight text-center block">
              {prompt}
            </span>
          </div>
        </div>

        {/* Timezone badge (for tz questions) */}
        {currentQ?.type === 'timezone' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div 
              className="px-6 py-2 rounded-full text-white text-[10px] font-black shadow-2xl border-2 border-white/10 animate-in slide-in-from-bottom duration-500 uppercase tracking-widest"
              style={{ 
                background: `linear-gradient(135deg, ${tzBg(currentQ.timezone)}, rgba(0,0,0,0.4))`,
                backdropFilter: 'blur(12px)'
              }}
            >
              Sector: {currentQ.timezoneLabel}
            </div>
          </div>
        )}

        {/* Map Rendering */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div
            className={[
              'w-full h-full relative z-0 transition-all duration-300',
              locked ? 'opacity-40 grayscale-[0.8] scale-95' : 'opacity-100 scale-100',
              '[&_.atlas-region]:fill-white/[0.05] [&_.atlas-region]:stroke-white/[0.15]',
              '[&_.atlas-region:hover]:fill-[#F59E0B]/30 [&_.atlas-region:hover]:stroke-[#F59E0B] [&_.atlas-region:hover]:translate-y-[-2px] transition-all',
            ].join(' ')}
          >
            <InteractiveMap
              onRegionClick={locked ? () => {} : onRegionClick}
              highlightedCodes={correctCode ? [correctCode] : []}
              activeCode={wrongCode}
              correctCode={correctCode}
              wrongCode={wrongCode}
              mode="gameplay"
            />
          </div>
        </div>
      </div>

      {/* Decoration */}
      <img src="/assets/illustrations/cactus.svg" className="absolute bottom-8 left-8 w-14 h-14 opacity-15 pointer-events-none grayscale sepia" alt="" />
      
      <style>{`
        @keyframes pin-radar { 100% { transform: rotate(360deg); } }
        .atlas-region { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
      `}</style>
    </main>
  );
}

