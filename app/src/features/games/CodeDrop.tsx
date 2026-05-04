import { useEffect, useRef, useState } from 'react';
import type { GameProps, StateEntry } from '@/types';
import { useAudio } from '@/hooks/useAudio';
import { useParticles } from '@/components/ui/ParticleSystem';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import {
  pickQuestions,
  checkCodeAnswer,
  checkTimezoneAnswer,
  calculatePoints,
  type DropQuestion,
  TOTAL_QUESTIONS,
  FALL_DURATION_MS,
  SPEED_WINDOW,
  START_TOP,
} from '@/lib/crack-the-code';

// ─── Component ────────────────────────────────────────────────────────────────

export default function CodeDrop({ onComplete, isRetry: _isRetry }: GameProps) {
  const { playSound } = useAudio();
  const { triggerBurst } = useParticles();
  
  // ── Data ──────────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<DropQuestion[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── Game state ────────────────────────────────────────────────────────────
  const [qi,           setQi]           = useState(0);
  const [score,        setScore]        = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [inputVal,     setInputVal]     = useState('');
  const [locked,       setLocked]       = useState(false);
  const [blockTopPx,   setBlockTopPx]   = useState(-60);
  const [blockVisible, setBlockVisible] = useState(false);
  const [blockLocked,  setBlockLocked]  = useState(false);
  const [wrongFlash,   setWrongFlash]   = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const startedAtRef           = useRef(0);
  const zoneRef                = useRef<HTMLDivElement>(null);
  const inputRef               = useRef<HTMLInputElement>(null);
  const cancelCurrentRef       = useRef<() => void>(() => {});
  const scoreRef               = useRef(0);
  const correctCountRef        = useRef(0);
  const streakRef              = useRef(0);
  const streakPeakRef          = useRef(0);
  const timerRef               = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef           = useRef<HTMLDivElement>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/data/states.json')
      .then((r) => r.json())
      .then((data: StateEntry[]) => {
        setQuestions(pickQuestions(data));
        setLoading(false);
      });
  }, []);

  // ── Start each question ───────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !questions.length || qi >= TOTAL_QUESTIONS) return;

    setInputVal('');
    setLocked(false);
    setBlockLocked(false);
    setBlockVisible(true);
    setBlockTopPx(START_TOP);
    startedAtRef.current = Date.now();

    const zoneHeight = zoneRef.current?.clientHeight ?? 520;
    const endTop     = Math.max(START_TOP + 50, zoneHeight - 48);

    let rafId:  number;
    let timer1: ReturnType<typeof setTimeout>;
    let done = false;
    let warningPlayed = false;

    function cancel() {
      done = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    cancelCurrentRef.current = cancel;

    function animate() {
      if (done) return;
      const elapsed   = Date.now() - startedAtRef.current;
      const progress  = Math.min(1, elapsed / FALL_DURATION_MS);
      setBlockTopPx(START_TOP + (endTop - START_TOP) * progress);

      if (progress > 0.7 && !warningPlayed) {
        warningPlayed = true;
        playSound('timer-warning');
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    }
    rafId = requestAnimationFrame(animate);

    // Miss timer
    timer1 = setTimeout(() => {
      if (done) return;
      done = true;
      cancelAnimationFrame(rafId);
      playSound('wrong');
      streakRef.current = 0;
      setStreak(0);
      setBlockVisible(false);
      setLocked(true);
      timerRef.current = setTimeout(() => {
        const next = qi + 1;
        if (next >= TOTAL_QUESTIONS) {
          onComplete({
            score:        scoreRef.current,
            correctCount: correctCountRef.current,
            totalCount:   TOTAL_QUESTIONS,
            streakPeak:   streakPeakRef.current,
          });
        } else {
          setQi(next);
        }
      }, 1000);
    }, FALL_DURATION_MS);

    return cancel;
  }, [qi, loading, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus input each question
  useEffect(() => {
    if (!locked && !loading) inputRef.current?.focus();
  }, [qi, locked, loading]);

  // ── Answer handlers ───────────────────────────────────────────────────────

  function commitCorrect(element?: HTMLElement) {
    cancelCurrentRef.current();
    playSound('correct');
    triggerBurst(element || null, 'gold-spark');
    
    const elapsed    = (Date.now() - startedAtRef.current) / 1000;
    const pts        = calculatePoints(true, elapsed, SPEED_WINDOW);
    const newScore   = scoreRef.current + pts;
    const newCorrect = correctCountRef.current + 1;
    const newStreak  = streakRef.current + 1;
    const newPeak    = Math.max(streakPeakRef.current, newStreak);

    scoreRef.current        = newScore;
    correctCountRef.current = newCorrect;
    streakRef.current       = newStreak;
    streakPeakRef.current   = newPeak;

    if (newStreak >= 3) playSound('streak');

    setScore(newScore);
    setStreak(newStreak);
    setBlockLocked(true);
    setLocked(true);

    setTimeout(() => {
      const next = qi + 1;
      if (next >= TOTAL_QUESTIONS) {
        onComplete({ score: newScore, correctCount: newCorrect, totalCount: TOTAL_QUESTIONS, streakPeak: newPeak });
      } else {
        setQi(next);
      }
    }, 600);
  }

  function handleCodeSubmit() {
    if (locked || !questions.length) return;
    const q = questions[qi];
    if (q.type !== 'code') return;

    if (checkCodeAnswer(q.state.code, inputVal)) {
      commitCorrect(inputRef.current || undefined);
    } else {
      playSound('wrong');
      setInputVal('');
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 350);
    }
  }

  function handleTimezoneChoice(choice: string) {
    if (locked || !questions.length) return;
    const q = questions[qi];
    if (q.type !== 'timezone') return;
    playSound('click');

    if (checkTimezoneAnswer(q.state.timezone, choice as Parameters<typeof checkTimezoneAnswer>[0])) {
      commitCorrect();
    } else {
      playSound('wrong');
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 350);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentQ   = questions[qi];
  const progress   = questions.length ? Math.round((qi / TOTAL_QUESTIONS) * 100) : 0;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#080c11] text-white">
        <div className="w-12 h-12 rounded-full border-2 border-[#FF9900] border-t-transparent animate-spin mb-4" />
        <p className="text-[#FF9900] text-xs uppercase tracking-[0.2em] font-bold">Cracking Ciphers</p>
      </main>
    );
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <main ref={containerRef} className="flex-1 flex flex-col bg-[#001f3f] p-5 gap-4 overflow-hidden relative">
      
      {/* Background Video: Ocean Descent */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-[0.15] pointer-events-none"
      >
        <source src="/assets/video/water-bg.mp4" type="video/mp4" />
      </video>

      {/* Terrain Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.08]" 
        style={{ backgroundImage: 'url("/assets/patterns/topo-pattern.png")', backgroundSize: '400px' }} 
      />

      {/* Top bar */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/20 border border-[#06B6D4]/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <span className="font-black text-[#06B6D4] text-xl">AE</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-black text-lg tracking-tight">Code Drop</span>
            <span className="text-[#06B6D4] text-[9px] uppercase tracking-[0.3em] font-black">
              Ocean Descent
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
            <strong className="text-[#06B6D4] font-mono text-xl leading-none">{streak}x</strong>
          </div>
        </AnimatedCard>
      </div>

      {/* Progress Header */}
      <div className="relative z-10 px-2 space-y-2">
        <div className="flex justify-between items-end text-[9px] font-black tracking-[0.2em] uppercase">
          <span className="text-white/30">Depth Progress: {progress}%</span>
          <span className="text-[#06B6D4]">{qi + 1} OF {TOTAL_QUESTIONS}</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#06B6D4] to-[#22C55E] transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Falling zone */}
      <div
        ref={zoneRef}
        className="relative flex-1 rounded-3xl overflow-hidden border border-white/5 bg-black/40 backdrop-blur-sm shadow-2xl mt-2"
        style={{ minHeight: 300 }}
      >
        {/* Falling block */}
        {blockVisible && currentQ && (
          <div
            className={[
              'absolute left-1/2 -translate-x-1/2 transition-none px-10 py-6 rounded-3xl border shadow-[0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-xl',
              blockLocked
                ? 'bg-[#22C55E]/20 border-[#22C55E]/40 text-[#22C55E] scale-110 rotate-0'
                : 'bg-white/[0.08] border-[#06B6D4]/30 text-white animate-in slide-in-from-top-12 duration-500',
            ].join(' ')}
            style={{ 
              top: blockTopPx,
              transform: `translateX(-50%) rotate(${(qi % 2 === 0 ? 1 : -1) * (blockLocked ? 0 : 2)}deg)`
            }}
          >
            <span className="block text-[#06B6D4] text-[10px] uppercase tracking-[0.3em] font-black mb-2 text-center">Cipher Signal</span>
            <span className="block font-black text-3xl tracking-tight text-center">
              {blockLocked ? 'SECURED' : currentQ.state.name}
            </span>
            {!blockLocked && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
                <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-black">
                  {currentQ.type === 'code' ? 'Input ID' : 'Select Zone'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Floating Bubbles (Decorative) */}
        <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none opacity-20 flex justify-around items-end">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="w-4 h-4 rounded-full border border-white/40 animate-bounce" 
              style={{ animationDelay: `${i * 0.5}s`, animationDuration: `${3 + i}s` }}
            />
          ))}
        </div>
      </div>

      {/* Interaction Panel */}
      <AnimatedCard tiltAmount={1} className="relative z-10 p-6 rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-2xl">
        {currentQ?.type === 'code' ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleCodeSubmit(); }}
            className="flex flex-col gap-4"
          >
            <div className="relative">
              <input
                id="code-input"
                ref={inputRef}
                type="text"
                maxLength={2}
                autoComplete="off"
                placeholder="--"
                disabled={locked}
                value={inputVal}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setInputVal(val);
                  if (val.length === 2) {
                    setTimeout(handleCodeSubmit, 50);
                  }
                }}
                className={[
                  'w-full rounded-2xl border-2 px-6 py-5 text-center text-4xl font-mono font-black uppercase tracking-[0.5em]',
                  'bg-black/60 text-white placeholder:text-white/5 outline-none transition-all duration-300 shadow-inner',
                  wrongFlash
                    ? 'border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]'
                    : 'border-white/10 focus:border-[#06B6D4]/50 focus:shadow-[0_0_25px_rgba(6,182,212,0.2)]',
                  locked && 'opacity-40 cursor-not-allowed',
                ].join(' ')}
              />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Code Cipher</div>
            </div>
            
            <button
              type="submit"
              disabled={locked || inputVal.length < 2}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#06B6D4] to-[#22C55E] text-[#001f3f] font-black uppercase tracking-[0.2em] shadow-[0_8px_0_#048E9B] hover:translate-y-0.5 active:translate-y-1 transition-all disabled:opacity-20 disabled:grayscale"
            >
              COMMIT KEY
            </button>
          </form>
        ) : currentQ?.type === 'timezone' ? (
          <div className="space-y-4">
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] text-center">Sector Sync Protocol</div>
            <div className={`grid grid-cols-2 gap-4 ${wrongFlash ? 'animate-shake' : ''}`}>
              {currentQ.choices.map((tz) => (
                <button
                  key={tz}
                  disabled={locked}
                  onClick={() => handleTimezoneChoice(tz)}
                  className={[
                    'rounded-2xl border-2 px-6 py-4 font-black text-sm uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group',
                    'bg-white/[0.05] border-white/10 text-white hover:border-[#06B6D4]/50 hover:bg-[#06B6D4]/10',
                    locked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.03] active:scale-95',
                  ].join(' ')}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">{tz}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </AnimatedCard>

      {/* Decoration */}
      <img src="/assets/illustrations/anchor.svg" className="absolute bottom-6 right-6 w-12 h-12 opacity-10 pointer-events-none grayscale" alt="" />
    </main>
  );
}
