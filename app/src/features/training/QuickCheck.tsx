import { useState, useMemo, useEffect } from 'react';
import type { StateEntry } from '@/types';
import { useAudio } from '@/hooks/useAudio';
import { Check, X } from 'lucide-react';

type QuestionType = 'postal' | 'timezone' | 'country';
type QuickCheckQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

interface QuickCheckProps {
  recentStates: StateEntry[];
  allStates: StateEntry[];
  skippedLastCheck?: boolean;
  onComplete: (skipped?: boolean) => void;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function rotatePick<T>(items: T[], seed: string, count: number): T[] {
  if (items.length === 0) return [];
  const start = hashString(seed) % items.length;
  return Array.from({ length: Math.min(count, items.length) }, (_, index) => items[(start + index) % items.length]);
}

function seededShuffle(items: string[], seed: string): string[] {
  return [...items].sort((a, b) => hashString(`${seed}:${a}`) - hashString(`${seed}:${b}`));
}

function buildQuestion(targetState: StateEntry, allStates: StateEntry[], seed: string): QuickCheckQuestion {
  const types: QuestionType[] = ['postal', 'timezone', 'country'];
  const selectedType = types[hashString(seed) % types.length];

  if (selectedType === 'postal') {
    const otherCodes = rotatePick(
      allStates.filter((s) => s.code !== targetState.code).map((s) => s.code),
      `${seed}:postal`,
      3,
    );
    return {
      question: `What's the postal code for ${targetState.name}?`,
      options: seededShuffle([targetState.code, ...otherCodes], `${seed}:options`),
      correctAnswer: targetState.code,
      explanation: `${targetState.name}'s postal code is ${targetState.code}.`,
    };
  }

  if (selectedType === 'timezone') {
    const otherTzs = rotatePick(
      ['PST', 'MST', 'CST', 'EST', 'AKST', 'AST', 'NST', 'HST'].filter((tz) => tz !== targetState.timezone),
      `${seed}:timezone`,
      3,
    );
    return {
      question: `Which timezone is ${targetState.name} in?`,
      options: seededShuffle([targetState.timezone, ...otherTzs], `${seed}:options`),
      correctAnswer: targetState.timezone,
      explanation: `${targetState.name} is in the ${targetState.timezoneLabel} (${targetState.timezone}) timezone.`,
    };
  }

  const country = targetState.country === 'US' ? 'United States' : 'Canada';
  return {
    question: `Is ${targetState.name} in the US or Canada?`,
    options: ['United States', 'Canada'],
    correctAnswer: country,
    explanation: `${targetState.name} is in ${country}.`,
  };
}

export default function QuickCheck({ recentStates, allStates, skippedLastCheck, onComplete }: QuickCheckProps) {
  const { playSound } = useAudio();
  
  const targetState = useMemo(() => {
    const pool = recentStates.length > 0 ? recentStates : allStates;
    if (pool.length === 0) return allStates[0];
    const seed = pool.map((state) => state.code).join('|');
    return pool[hashString(seed) % pool.length] || allStates[0];
  }, [recentStates, allStates]);

  const { question, options, correctAnswer, explanation } = useMemo(
    () => buildQuestion(targetState, allStates, `${targetState?.code}:${recentStates.length}:${allStates.length}`),
    [targetState, allStates, recentStates.length],
  );

  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (opt: string) => {
    if (showResult) return;
    setSelected(opt);
    setShowResult(true);
    
    if (opt === correctAnswer) {
      playSound('correct');
    } else {
      playSound('wrong');
    }
  };

  // Allow Escape at any time to dismiss, or Enter when result is shown
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onComplete(true);
      } else if (e.key === 'Enter' && showResult) {
        onComplete(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showResult, onComplete]);

  // Auto-dismiss after 30s of no interaction
  useEffect(() => {
    if (showResult) return;
    const timer = setTimeout(() => {
      onComplete(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [showResult, onComplete]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-atlas-ink/60 backdrop-blur-sm p-4 fade-in">
      <div className="w-full max-w-md bg-atlas-card rounded-3xl p-8 shadow-2xl relative overflow-hidden pop-in border border-atlas-border">
        <div className="absolute top-0 inset-x-0 h-2 bg-atlas-accent" />
        
        <div className="text-center mb-8">
          <div className="text-xs font-black uppercase tracking-widest text-atlas-accent mb-2 font-display">
            {skippedLastCheck ? "Quick Check · Welcome Back!" : "Quick Check"}
          </div>
          <h2 className="text-2xl font-black text-atlas-ink font-display">{question}</h2>
          {skippedLastCheck && (
            <p className="text-xs text-atlas-muted mt-1 font-sans font-medium">
              Let's do a quick check-in on the regions you explored earlier.
            </p>
          )}
        </div>

        <div className="grid gap-3 mb-6">
          {options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = opt === correctAnswer;
            
            let btnClass = "btn-chunky py-4 text-lg w-full text-left px-6 ";
            if (!showResult) {
              btnClass += "bg-atlas-warm border-2 border-atlas-border text-atlas-ink hover:border-atlas-accent hover:bg-atlas-accent/10";
            } else {
              if (isCorrect) {
                btnClass += "bg-atlas-accent shadow-md border-none text-white font-bold";
              } else if (isSelected) {
                btnClass += "bg-atlas-error/20 border-2 border-atlas-error text-atlas-error opacity-70";
              } else {
                btnClass += "bg-atlas-warm border-2 border-atlas-border text-atlas-muted opacity-50";
              }
            }

            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={showResult}
                className={btnClass}
              >
                <div className="flex justify-between items-center w-full">
                  <span>{opt}</span>
                  {showResult && isCorrect && <Check className="w-5 h-5 text-white inline" />}
                  {showResult && isSelected && !isCorrect && <X className="w-5 h-5 text-atlas-error inline" />}
                </div>
              </button>
            );
          })}
        </div>

        {!showResult && (
          <div className="text-center mt-2">
            <button
              onClick={() => onComplete(true)}
              className="text-xs font-bold text-atlas-muted hover:text-atlas-ink underline underline-offset-4 cursor-pointer transition-colors font-display"
            >
              Skip this check
            </button>
          </div>
        )}

        {showResult && (
          <div className="text-center slide-up">
            <div className="p-4 bg-atlas-warm rounded-2xl mb-6 border border-atlas-border">
              <p className="text-sm font-bold text-atlas-ink mb-1 font-display">
                {selected === correctAnswer ? "🎉 Nice! You're paying attention." : "Not quite!"}
              </p>
              <p className="text-xs text-atlas-muted">{explanation}</p>
            </div>
            <button 
              onClick={() => onComplete(false)}
              className="w-full btn-chunky py-4 bg-atlas-gold text-atlas-ink border border-atlas-border hover:bg-atlas-gold/80 font-display"
            >
              Continue Exploration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
