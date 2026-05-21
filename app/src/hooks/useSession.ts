import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, GameResult, EarnedBadge, GameAttempt, GameState } from '@/types';
import {
  createSession as libCreateSession,
  createDemoSession as libCreateDemoSession,
  loadSession,
  saveSession as libSaveSession,
  clearSession,
  updateTraining as libUpdateTraining,
  saveJournalEntry as libSaveJournalEntry,
  isTrainingComplete as libIsTrainingComplete,
  recordGameAttempt as libRecordGameAttempt,
} from '@/lib/session';
import { evaluateBadges } from '@/lib/badges';
import { submitAttemptScore } from '@/lib/leaderboard';

// ─── Context value shape ──────────────────────────────────────────────────────

export type AttemptFullResult = {
  status: 'passed' | 'retry';
  game: GameState;
  attempt: GameAttempt;
  gameIndex: number;
  newBadges: EarnedBadge[];
  sessionCompleted: boolean;
  nextGameIndex: number;
};

interface SessionContextValue {
  session: Session | null;
  createNewSession: (name: string, waveCode: string, trainerName: string) => void;
  createDemoSession: () => void;
  updateTraining: (type: 'map', code: string) => void;
  saveJournalEntry: (entry: string) => void;
  isTrainingComplete: () => boolean;
  recordAttempt: (
    gameIndexOrKey: number | string,
    rawAttempt: Partial<GameResult> & { attemptNumber?: number },
  ) => ReturnType<typeof libRecordGameAttempt>;
  recordAttemptFull: (gameIndexOrKey: number | string, result: GameResult) => AttemptFullResult;
  completeReviewRound: () => void;
  clearCurrentSession: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

// ─── Provider factory (used by SessionProvider component) ──────────────────────

export function useSessionState(): SessionContextValue {
  const [session, setSession] = useState<Session | null>(() => {
    const loaded = loadSession();
    if (loaded) return loaded;
    const hasOverride = window.location.hash.includes('game=') || window.location.hash.includes('debug=');
    if (!hasOverride) return null;
    const demoSession = libCreateDemoSession();
    libSaveSession(demoSession);
    return demoSession;
  });

  // Persist on every session change
  useEffect(() => {
    if (session) {
      libSaveSession(session);
    }
  }, [session]);

  const createNewSession = useCallback(
    (name: string, waveCode: string, trainerName: string) => {
      const s = libCreateSession(name, waveCode, trainerName);
      libSaveSession(s);
      setSession(s);
    },
    [],
  );

  const createDemoSession = useCallback(() => {
    const s = libCreateDemoSession();
    libSaveSession(s);
    setSession(s);
  }, []);

  const updateTraining = useCallback(
    (type: 'map', code: string) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        libUpdateTraining(next, type, code);
        return next;
      });
    },
    [],
  );

  const saveJournalEntry = useCallback((entry: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      libSaveJournalEntry(next, entry);
      return next;
    });
  }, []);

  const isTrainingComplete = useCallback(
    () => (session ? libIsTrainingComplete(session) : false),
    [session],
  );

  const recordAttempt = useCallback(
    (
      gameIndexOrKey: number | string,
      rawAttempt: Partial<GameResult> & { attemptNumber?: number },
    ) => {
      if (!session) throw new Error('No active session');
      const next = structuredClone(session);
      const result = libRecordGameAttempt(next, gameIndexOrKey, rawAttempt);
      setSession(next);
      return result;
    },
    [session],
  );

  const recordAttemptFull = useCallback(
    (gameIndexOrKey: number | string, result: GameResult): AttemptFullResult => {
      if (!session) throw new Error('No active session');
      const next = structuredClone(session);
      const outcome = libRecordGameAttempt(next, gameIndexOrKey, result);
      let newBadges: EarnedBadge[] = [];
      if (outcome.status === 'passed') {
        newBadges = evaluateBadges(outcome.gameIndex, result, next, outcome.attempt.ratio);
        if (newBadges.length) {
          next.games[outcome.gameIndex].earnedBadges = [
            ...new Set([
              ...next.games[outcome.gameIndex].earnedBadges,
              ...newBadges.map((b) => b.id),
            ]),
          ];
        }
      }
      submitAttemptScore({
        agent: next.agent,
        waveCode: next.waveCode,
        trainerName: next.trainerName,
        game: outcome.game.key,
        attempt: outcome.attempt.attemptNumber,
        scorePct: outcome.attempt.score,
        stars: outcome.attempt.stars,
        passed: outcome.attempt.passed,
      });
      setSession(next);
      return {
        ...outcome,
        newBadges,
        sessionCompleted: next.completed,
        nextGameIndex: next.currentGameIndex,
      };
    },
    [session],
  );

  const completeReviewRound = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.reviewCompleted = true;
      return next;
    });
  }, []);

  const resetReviewRound = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.reviewCompleted = false;
      return next;
    });
  }, []);

  const clearCurrentSession = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return useMemo(
    () => ({
      session,
      createNewSession,
      createDemoSession,
      updateTraining,
      saveJournalEntry,
      isTrainingComplete,
      recordAttempt,
      recordAttemptFull,
      completeReviewRound,
      resetReviewRound,
      clearCurrentSession,
    }),
    [session, createNewSession, createDemoSession, updateTraining, saveJournalEntry, isTrainingComplete, recordAttempt, recordAttemptFull, completeReviewRound, resetReviewRound, clearCurrentSession],
  );
}
