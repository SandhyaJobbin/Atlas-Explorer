import type { StateEntry } from '@/types';
import { publicAsset } from '@/lib/assets';
import { useMemo, useState, useEffect } from 'react';
import { BookmarkPlus, RefreshCw, X } from 'lucide-react';

interface StateInfoPanelProps {
  state: StateEntry;
  onClose: () => void;
  onSaveFact?: (entry: string) => void;
}

export default function StateInfoPanel({ state, onClose, onSaveFact }: StateInfoPanelProps) {
  const [canDismiss, setCanDismiss] = useState(false);
  const [progress, setProgress] = useState(0);
  const [factOffset, setFactOffset] = useState(0);
  const [savedFact, setSavedFact] = useState<string | null>(null);

  useEffect(() => {
    const start = Date.now();
    const duration = 3000;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        setProgress(100);
        setCanDismiss(true);
        clearInterval(interval);
      } else {
        setProgress((elapsed / duration) * 100);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [state?.code]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const visibleTrivia = useMemo(() => {
    const trivia = state.trivia || [];
    if (trivia.length === 0) return [];
    const visibleCount = Math.min(3, Math.max(2, trivia.length));
    return Array.from({ length: visibleCount }, (_, index) => trivia[(factOffset + index) % trivia.length]);
  }, [factOffset, state.trivia]);

  const canCycleTrivia = (state.trivia?.length || 0) > 1;
  const journalFact = visibleTrivia[0] || null;

  function handleAnotherFact() {
    const triviaLength = state.trivia?.length || 0;
    if (triviaLength === 0) return;
    setFactOffset((current) => (current + 1) % triviaLength);
    setSavedFact(null);
  }

  function handleSaveFact() {
    if (!journalFact || !onSaveFact) return;
    const entry = `${state.name} (${state.code}): ${journalFact}`;
    onSaveFact(entry);
    setSavedFact(journalFact);
  }

  const flagEmoji = state.country === 'CA' ? '🇨🇦' : '🇺🇸';
  const countryLabel = state.country === 'CA' ? 'Canada' : 'United States';
  const pillStyle = state.country === 'CA'
    ? 'bg-atlas-accent-light text-atlas-accent border border-atlas-error/30'
    : 'bg-atlas-accent-light text-atlas-accent';

  return (
    <div className="pointer-events-auto relative flex max-h-full min-h-0 w-full max-w-[340px] flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl border border-atlas-border bg-atlas-card/95 p-5 shadow-2xl backdrop-blur-md paper-texture">
      {/* Country Watercolor Accent */}
      <div
        className="watercolor-splash right-[-100px] top-[-100px] opacity-10"
        style={{
          backgroundImage: `url("${publicAsset(state.country === 'CA' ? '/assets/illustrations/splash-forest.png' : '/assets/illustrations/splash-water.png')}")`,
          width: '200px',
          height: '200px'
        }}
      />

      <button
        onClick={onClose}
        disabled={!canDismiss}
        className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          canDismiss 
            ? 'text-atlas-muted hover:bg-atlas-warm hover:text-atlas-ink cursor-pointer' 
            : 'text-atlas-muted/40 cursor-not-allowed opacity-50'
        }`}
        aria-label="Close"
      >
        {!canDismiss ? (
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-atlas-border"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-atlas-accent transition-all duration-75"
              strokeDasharray={`${progress}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
        ) : (
          <X className="w-5 h-5" />
        )}
      </button>

      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-2 bg-atlas-warm px-2.5 py-1 rounded-md border border-atlas-border self-start">
          <span className="text-label font-black uppercase tracking-wider text-atlas-ink">{state.region}</span>
        </div>

        <div className="mt-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl sm:text-4xl font-black text-atlas-ink leading-[1.1] tracking-tight font-display">
              {state.name}
            </h2>
            <span className="text-body font-black text-atlas-muted">{state.code}</span>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-body">
        <div className="bg-atlas-warm rounded-lg p-3 border border-atlas-border/50">
          <p className="text-atlas-muted text-label font-bold tracking-wide mb-1">State Code</p>
          <p className="font-semibold text-atlas-ink text-body">{state.code}</p>
        </div>
        <div className="bg-atlas-warm rounded-lg p-3 border border-atlas-border/50">
          <p className="text-atlas-muted text-label font-bold tracking-wide mb-1">Timezone</p>
          <p className="font-semibold text-atlas-ink text-body">{state.timezoneLabel} | {state.timezone}</p>
        </div>
        <div className="bg-atlas-warm rounded-lg p-3 border border-atlas-border/50">
          <p className="text-atlas-muted text-label font-bold tracking-wide mb-1">Capital</p>
          <p className="font-semibold text-atlas-ink text-body">{state.capital}</p>
        </div>
        <div className="bg-atlas-warm rounded-lg p-3 border border-atlas-border/50">
          <p className="text-atlas-muted text-label font-bold tracking-wide mb-1">Country</p>
          <p className="font-semibold text-atlas-ink text-body flex items-center gap-1.5">
            <span>{flagEmoji}</span> {countryLabel}
          </p>
        </div>
      </div>

      {/* Specialties */}
      {state.specialties.length > 0 && (
        <div>
          <p className="text-atlas-muted text-label font-bold tracking-wide mb-2">Known For</p>
          <div className="flex flex-wrap gap-2">
            {state.specialties.map((s) => (
              <span
                key={s}
                className={`${pillStyle} text-label font-bold px-3 py-1 rounded-lg`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Trivia */}
      {visibleTrivia.length > 0 && (
        <div className="mt-2 rounded-xl border border-dashed border-atlas-gold p-4 bg-atlas-warm/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <p className="text-atlas-gold text-label font-black tracking-wider uppercase">Did you know?</p>
          </div>
          <div className="space-y-2.5">
            {visibleTrivia.map((fact, index) => (
              <p key={`${fact}-${index}`} className="text-body font-medium leading-relaxed text-atlas-ink">
                <span className="mr-2 font-black text-atlas-gold">{index + 1}.</span>
                {fact}
              </p>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {canCycleTrivia && (
              <button
                type="button"
                onClick={handleAnotherFact}
                className="inline-flex items-center gap-1.5 rounded-lg border border-atlas-border bg-atlas-card px-3 py-2 text-label font-black text-atlas-ink transition-colors hover:bg-atlas-warm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Another fact
              </button>
            )}
            {onSaveFact && journalFact && (
              <button
                type="button"
                onClick={handleSaveFact}
                className="inline-flex items-center gap-1.5 rounded-lg bg-atlas-accent px-3 py-2 text-label font-black text-white transition-colors hover:bg-atlas-accent/90"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                {savedFact === journalFact ? 'Saved' : 'Save to journal'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
