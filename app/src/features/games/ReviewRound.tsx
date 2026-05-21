import { useState, useMemo, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { useData } from '@/hooks/useData';
import { useAudio } from '@/hooks/useAudio';
import { getAggregatedMistakes } from '@/lib/scoring';
import InteractiveMap from '@/components/map/InteractiveMap';
import StateInfoPanel from '@/components/map/StateInfoPanel';

const MAX_LOOPS = 3;

interface ReviewRoundProps {
  onComplete: () => void;
}

export default function ReviewRound({ onComplete }: ReviewRoundProps) {
  const { session, completeReviewRound } = useSession();
  const { states } = useData();
  const { playSound } = useAudio();

  const aggregated = useMemo(() => {
    if (!session) return [];
    return getAggregatedMistakes(session, states);
  }, [session, states]);

  const allCodes = useMemo(() => aggregated.map((m) => m.code), [aggregated]);

  const [loopCount, setLoopCount] = useState(1);
  const [correctedCodes, setCorrectedCodes] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [clickedCode, setClickedCode] = useState<string | null>(null);

  // Which codes to show this loop (filter out already-corrected on loop 2+)
  const displayCodes = useMemo(() => {
    if (loopCount === 1) return allCodes;
    return allCodes.filter((code) => !correctedCodes.has(code));
  }, [allCodes, loopCount, correctedCodes]);

  const targetCode = displayCodes[currentIndex];
  const targetState = targetCode ? states.find((s) => s.code === targetCode) : null;

  const handleRegionClick = useCallback((code: string) => {
    if (hasAnswered) return;
    setClickedCode(code);
    setHasAnswered(true);
    const correct = code === displayCodes[currentIndex];
    setIsCorrect(correct);
    if (correct) {
      playSound('correct');
      setCorrectedCodes((prev) => {
        const next = new Set(prev);
        next.add(code);
        return next;
      });
    } else {
      playSound('wrong');
    }
  }, [hasAnswered, displayCodes, currentIndex, playSound]);

  const finishReview = useCallback(() => {
    completeReviewRound();
    onComplete();
  }, [completeReviewRound, onComplete]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;

    // Still items in current display list
    if (nextIndex < displayCodes.length) {
      setCurrentIndex(nextIndex);
      setHasAnswered(false);
      setIsCorrect(false);
      setClickedCode(null);
      return;
    }

    // End of display list — check loop conditions
    const unresolvedCount = allCodes.filter((c) => !correctedCodes.has(c)).length;

    if (unresolvedCount === 0 || loopCount >= MAX_LOOPS) {
      finishReview();
      return;
    }

    // Start another loop with only unresolved codes
    setCurrentIndex(0);
    setLoopCount((prev) => prev + 1);
    setHasAnswered(false);
    setIsCorrect(false);
    setClickedCode(null);
  }, [currentIndex, displayCodes.length, allCodes, correctedCodes, loopCount, finishReview]);

  const handleSkip = useCallback(() => {
    if (targetCode) {
      setCorrectedCodes((prev) => {
        const next = new Set(prev);
        next.add(targetCode);
        return next;
      });
    }
    // Immediately move to next
    const nextIndex = currentIndex + 1;
    if (nextIndex < displayCodes.length) {
      setCurrentIndex(nextIndex);
    } else {
      // Last item — check loop conditions or finish
      const unresolvedCount = allCodes.filter((c) => !correctedCodes.has(c)).length;
      // Also account for the skip we just did
      const newUnresolved = unresolvedCount - (targetCode && !correctedCodes.has(targetCode) ? 1 : 0);
      if (newUnresolved === 0 || loopCount >= MAX_LOOPS) {
        finishReview();
        return;
      }
      setCurrentIndex(0);
      setLoopCount((prev) => prev + 1);
    }
    setHasAnswered(false);
    setIsCorrect(false);
    setClickedCode(null);
  }, [targetCode, correctedCodes, currentIndex, displayCodes.length, allCodes, loopCount, finishReview]);

  if (!targetState) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-atlas-warm text-atlas-ink p-8">
        <p className="text-xl font-bold">No mistakes to review! Excellent job!</p>
        <button
          onClick={finishReview}
          className="mt-4 px-6 py-2.5 bg-atlas-accent text-white font-bold rounded-xl shadow-lg hover:bg-atlas-accent/90 transition-all"
        >
          Finish Expedition
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-atlas-ink relative overflow-hidden">
      <div className="absolute inset-0 z-0 p-4 sm:p-6 lg:p-8">
        <InteractiveMap
          onRegionClick={handleRegionClick}
          highlightedCodes={hasAnswered ? [targetState.code, clickedCode].filter((c): c is string => !!c) : []}
          correctCode={hasAnswered ? targetState.code : null}
          wrongCode={hasAnswered && !isCorrect ? clickedCode : null}
          activeCode={hasAnswered ? targetState.code : null}
          mode="gameplay"
        />
      </div>

      <div className="absolute top-4 left-4 z-10 max-w-sm pointer-events-auto bg-atlas-card/90 backdrop-blur-md border border-atlas-border rounded-2xl p-4 shadow-xl font-display">
        <span className="text-xs font-bold text-atlas-gold uppercase tracking-[0.2em] block mb-1">
          {loopCount > 1 ? `Review Round • Loop ${loopCount} of ${MAX_LOOPS}` : 'Review Round • Active Recall'}
        </span>
        <h2 className="text-base font-black text-atlas-ink uppercase tracking-tight">
          Locate {targetState.name}
        </h2>
        {aggregated.length > 1 && (
          <p className="text-xs text-atlas-muted font-medium mt-1">
            Missed {aggregated.find((m) => m.code === targetState.code)?.count ?? 1} time{(aggregated.find((m) => m.code === targetState.code)?.count ?? 1) > 1 ? 's' : ''}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs font-bold">
          <span className="text-atlas-muted">Progress</span>
          <span className="text-atlas-gold font-mono">{currentIndex + 1} / {displayCodes.length}</span>
        </div>
        <div className="w-full bg-atlas-warm rounded-full h-1.5 mt-1.5 overflow-hidden">
          <div
            className="bg-atlas-gold h-full transition-all duration-300"
            style={{ width: `${((currentIndex) / displayCodes.length) * 100}%` }}
          />
        </div>
      </div>

      {hasAnswered && (
        <div className="absolute right-4 top-4 bottom-4 z-10 flex flex-col items-end gap-3 pointer-events-none">
          <div className={`pointer-events-auto px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2 ${
            isCorrect
              ? 'bg-emerald-500/90 text-white border border-emerald-400/30'
              : 'bg-rose-500/90 text-white border border-rose-400/30'
          }`}>
            <span>{isCorrect ? '✅ Correct recall!' : '❌ Incorrect recall'}</span>
          </div>

          <div className="flex-1 min-h-0 pointer-events-auto flex items-end">
            <StateInfoPanel
              state={targetState}
              onClose={handleNext}
            />
          </div>
        </div>
      )}

      {!hasAnswered && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-atlas-muted bg-atlas-card/60 backdrop-blur-sm border border-atlas-border rounded-xl hover:bg-atlas-card/90 transition-all"
          >
            Skip this region
          </button>
        </div>
      )}
    </main>
  );
}
