import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameProps, StateEntry } from '@/types';
import InteractiveMap from '@/components/map/InteractiveMap';
import InfoCard from '@/components/ui/InfoCard';
import { useParticles } from '@/components/ui/ParticleSystem';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useAudio } from '@/hooks/useAudio';
import { publicAsset } from '@/lib/assets';
import { useScorePopups } from '@/components/ui/ScorePopup';
import StateOutline from '@/components/map/StateOutline';
import { TZ_FILLS } from '@/lib/timezones';
import {
  pickPinQuestions,
  checkMapClick,
  checkTimezoneClick,
  calculatePoints,
  isMapQuestion,
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

export default function PinRush({ onComplete, isRetry: _isRetry }: GameProps) {
  const { playSound } = useAudio();
  const { triggerBurst } = useParticles();
  const { triggerScore, ScorePopups } = useScorePopups();
  
  // ── Data ──────────────────────────────────────────────────────────────────
  const [states,    setStates]    = useState<StateEntry[]>([]);
  const [questions, setQuestions] = useState<PinQuestion[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── Game state ────────────────────────────────────────────────────────────
  const [qi,           setQi]           = useState(0);
  const [score,        setScore]        = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(TIME_PER_QUESTION);
  const [locked,       setLocked]       = useState(false);
  const [correctCode,  setCorrectCode]  = useState<string | null>(null);
  const [wrongCode,    setWrongCode]    = useState<string | null>(null);
  const [correctState, setCorrectState] = useState<StateEntry | null>(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const startedAtRef    = useRef(0);
  const timerRef        = useRef<ReturnType<typeof setTimeout>>(undefined);
  const scoreRef        = useRef(0);
  const correctCntRef   = useRef(0);
  const streakRef       = useRef(0);
  const streakPeakRef   = useRef(0);
  const containerRef    = useRef<HTMLDivElement>(null);
  const scrollRef       = useRef<HTMLDivElement>(null);

  // ── Question tracking ─────────────────────────────────────────────────────
  const [results, setResults] = useState<Record<number, 'pending' | 'active' | 'found' | 'missed'>>({});

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(publicAsset('/data/states.json'))
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
    setCorrectState(null);
    setTimeLeft(TIME_PER_QUESTION);
    startedAtRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
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

    // Update results status
    setResults(prev => ({ ...prev, [qi]: 'active' }));

    // Scroll active card into view
    if (scrollRef.current) {
      const activeCard = scrollRef.current.querySelector(`[data-index="${qi}"]`);
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qi, loading, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Click handler ─────────────────────────────────────────────────────────

  const onRegionClick = useCallback((code: string) => {
    if (locked) return;
    playSound('click');
    if (timerRef.current) clearInterval(timerRef.current);
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
    if (timerRef.current) clearInterval(timerRef.current);

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
      
      // Phase 2: Set correct state to show info card
      if (q.type === 'map') {
        setCorrectState(q.state);
      } else if (clickedCode) {
        const state = states.find(s => s.code === clickedCode);
        if (state) setCorrectState(state);
      }
    } else {
      playSound('wrong');
    }

    const pts = calculatePoints(isCorrect, elapsed, SPEED_WINDOW);

    // Trigger score popup
    if (isCorrect) {
      triggerScore(window.innerWidth / 2, window.innerHeight / 2, pts);
    }

    scoreRef.current      += pts;
    correctCntRef.current += isCorrect ? 1 : 0;
    streakRef.current      = isCorrect ? streakRef.current + 1 : 0;
    if (streakRef.current > streakPeakRef.current) streakPeakRef.current = streakRef.current;

    setScore(scoreRef.current);
    setStreak(streakRef.current);
    setResults(prev => ({ ...prev, [qi]: isCorrect ? 'found' : 'missed' }));

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
    }, isCorrect ? 3000 : 1200);
  }, [locked]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = useCallback(() => {
    if (locked) return;
    playSound('click');
    if (timerRef.current) clearInterval(timerRef.current);
    pendingClickRef.current = null;
    setLocked(true);
  }, [locked, playSound]);

  // Handle timeout (timer reaches 0)
  useEffect(() => {
    if (timeLeft > 0 || locked || !questions.length || qi >= TOTAL_QUESTIONS) return;
    if (timerRef.current) clearInterval(timerRef.current);
    pendingClickRef.current = null;
    setLocked(true);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentQ    = questions[qi];
  const timerPct    = (timeLeft / TIME_PER_QUESTION) * 100;
  const timerDanger = timerPct < 30;
  const timerUrgent = timerPct < 30 && timeLeft > 0 && !locked;

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
    <main ref={containerRef} className="flex-1 flex flex-col bg-[#18120e] p-3 gap-2 overflow-hidden relative">
      
      {/* Thematic Background: Desert Expedition (Performance Optimized) */}
      <div 
        className="absolute inset-0 w-full h-full object-cover opacity-[0.12] pointer-events-none z-0 animate-ambient-float"
        style={{ 
          backgroundImage: `url(${publicAsset('/assets/generated/poster-desert.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Terrain Pattern Overlay: Dot Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.06]" 
        style={{ backgroundImage: `url("${publicAsset('/assets/patterns/dots-pattern.png')}")`, backgroundSize: '200px' }} 
      />

      {/* Timer Urgency Vignette */}
      <div className={`timer-urgency ${timerUrgent ? 'active' : ''}`} />

      {/* Score Popups */}
      <ScorePopups />

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <span className="font-black text-white text-xl">AE</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-black text-lg tracking-tight">Pin Rush</span>
            <span className="text-[#E5E7EB] text-[9px] uppercase tracking-widest font-black opacity-60">
              Desert Expedition
            </span>
          </div>
        </div>
        
        <AnimatedCard tiltAmount={2} className="flex items-center gap-6 bg-white/[0.04] border border-white/10 px-6 py-2.5 rounded-2xl backdrop-blur-md">
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[8px] font-black tracking-widest mb-0.5">POINTS</span>
            <strong className="text-white font-mono text-xl leading-none">{score.toLocaleString()}</strong>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[8px] font-black tracking-widest mb-0.5">STREAK</span>
            <div className={`relative ${streak >= 3 ? 'animate-bounce' : ''}`}>
              <strong className={`font-mono text-xl leading-none transition-colors duration-300 ${streak >= 3 ? 'text-[#8B5CF6] drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]' : 'text-white'}`}>
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
            <span className="text-white/30 text-[8px] font-black tracking-widest mb-0.5">OBJECTIVE</span>
            <strong className="text-white font-mono text-lg leading-none">{qi + 1}/{TOTAL_QUESTIONS}</strong>
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
                ? 'linear-gradient(90deg, #EF4444, #FF6B35)'
                : 'linear-gradient(90deg, #F59E0B, #FF9900)',
              boxShadow: timerDanger ? '0 0 15px rgba(239,68,68,0.5)' : '0 0 10px rgba(245,158,11,0.3)'
            }}
          />
        </div>
        <div className={`flex-shrink-0 min-w-[4rem] text-right text-[11px] font-mono font-black tracking-widest ${timerDanger ? 'text-[#EF4444] animate-pulse' : 'text-white/90'}`}>
          {timeLeft}S
        </div>
      </div>

      {/* Map area container */}
      <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-2xl mt-1">
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
          <div className="bg-[#2D3B2F]/95 border border-[#F59E0B]/50 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-[0_15px_40px_rgba(0,0,0,0.6)] animate-in zoom-in duration-300">
            <span className="text-[#F59E0B] text-[10px] uppercase tracking-wider font-black block mb-1 text-center">Satellite Target</span>
            <span className="text-white text-xl font-black tracking-tight text-center block">
              {prompt}
            </span>
          </div>
        </div>

        {/* Timezone badge (for tz questions) */}
        {currentQ?.type === 'timezone' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div 
              className="px-6 py-2 rounded-full text-white text-[10px] font-black shadow-2xl border-2 border-white/10 animate-in slide-in-from-bottom duration-500 uppercase tracking-wider"
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
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className={[
              'w-full h-full relative z-0 transition-all duration-300',
              locked ? 'opacity-40 grayscale-[0.8] scale-95' : 'opacity-100 scale-100',
              '[&_.atlas-region]:fill-[#5A8B6B] [&_.atlas-region]:stroke-[#2D4A3A]',
              '[&_.atlas-region:hover]:fill-[#F59E0B]/40 [&_.atlas-region:hover]:stroke-[#F59E0B] [&_.atlas-region:hover]:translate-y-[-2px] transition-all',
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

      {/* Compact State Card Strip */}
      <div className="relative z-10 -mx-3 px-3 flex-shrink-0">
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {questions.map((q, index) => {
            if (!isMapQuestion(q)) return null;
            const status = results[index] || 'pending';
            const isActive = index === qi;
            const isFound = status === 'found';
            const isMissed = status === 'missed';
            
            const fill = isFound 
              ? TZ_FILLS[q.state.timezone] 
              : (isActive ? '#F59E0B' : 'rgba(255,255,255,0.15)');
            
            const isCA = q.state.country === 'CA';

            return (
              <div
                key={index}
                data-index={index}
                className={[
                  'flex-shrink-0 flex items-center gap-2.5 rounded-xl border transition-all duration-300 overflow-hidden relative',
                  isActive ? 'border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.25)] bg-white/10 pl-2 pr-3 py-1.5' : 'border-white/5 bg-black/20 px-2.5 py-1.5',
                  isFound ? 'bg-white/[0.08]' : '',
                  isMissed ? 'border-red-500/30 grayscale opacity-50' : '',
                  !isActive && !isFound && !isMissed ? 'opacity-40' : ''
                ].join(' ')}
                style={{ 
                  scrollSnapAlign: 'center',
                  borderColor: isFound ? `${fill}60` : undefined,
                }}
              >
                {/* Mini State Outline */}
                <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center relative">
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-[#F59E0B]/20 rounded-full blur-lg animate-pulse" />
                    </div>
                  )}
                  <StateOutline 
                    stateCode={q.state.code} 
                    className={`w-full h-full transition-all duration-500 ${isActive ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''}`}
                    fill={fill}
                    stroke={isFound || isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                </div>

                {/* Name & Status */}
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className={`text-[11px] font-black truncate max-w-[90px] ${isActive ? 'text-white' : 'text-white/60'}`}>{q.state.name}</span>
                  <span className="text-[9px] font-mono text-[#F59E0B] font-bold tracking-wider">{q.state.code}</span>
                </div>

                {/* Status badge */}
                {isFound && (
                  <span 
                    className="text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex-shrink-0"
                    style={{ backgroundColor: fill }}
                  >
                    {q.state.timezone}
                  </span>
                )}
                {isFound && <span className="text-[10px] flex-shrink-0">{isCA ? '🇨🇦' : '🇺🇸'}</span>}
                {isMissed && <span className="bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0">✗</span>}
                {isActive && (
                  <button
                    onClick={handleSkip}
                    className="flex-shrink-0 bg-[#F59E0B] hover:bg-[#FFB12B] text-[#2D3B2F] text-[9px] font-black px-3 py-1.5 rounded-lg border-b-2 border-[#B47B00] transition-all shadow-md active:border-b-0 active:translate-y-0.5"
                  >
                    Skip Target
                  </button>
                )}
                {!isActive && !isFound && !isMissed && (
                  <div className="flex gap-0.5 flex-shrink-0">
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Card Overlay */}
      {correctState && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-orange-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <InfoCard state={correctState} theme="desert" accentColor="#F59E0B" />
        </div>
      )}

      {/* Desert Watercolor Accent */}
      <div 
        className="watercolor-splash right-[-50px] top-[-50px]" 
        style={{ backgroundImage: `url("${publicAsset('/assets/illustrations/splash-desert.png')}")` }} 
      />

      {/* Decoration */}
      <img src={publicAsset('/assets/illustrations/cactus.svg')} className="absolute bottom-8 left-8 w-14 h-14 opacity-15 pointer-events-none grayscale sepia" alt="" />
      
      <style>{`
        @keyframes pin-radar { 100% { transform: rotate(360deg); } }
        .atlas-region { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        [id^="div"] { display: none !important; }
      `}</style>
    </main>
  );
}
