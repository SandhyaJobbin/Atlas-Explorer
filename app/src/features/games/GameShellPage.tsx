import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import type { GameAttempt, GameState, EarnedBadge, GameResult } from '@/types';
import { GAME_DEFINITIONS, getTotalScore } from '@/lib/session';
import { resolveGameParam } from '@/lib/game-route';
import { GameStateProvider } from '@/hooks/useGameState';
import { gameEvents } from '@/hooks/useGameEvents';
import AppLayout from '@/components/layout/AppLayout';
import GameTopBar from '@/components/layout/GameTopBar';
import GameIntro from './GameIntro';
import PassInterstitial from './PassInterstitial';
import FailInterstitial from './FailInterstitial';
import CodeDrop from './CodeDrop';
import PinRush from './PinRush';
import CityStack from './CityStack';
import WaveLeaderboardWidget from '@/components/layout/WaveLeaderboardWidget';
import ReviewRound from './ReviewRound';

// ─── State machine ────────────────────────────────────────────────────────────

type OutcomeData = {
  gameIndex: number;
  attempt: GameAttempt;
  game: GameState;
  newBadges: EarnedBadge[];
  sessionCompleted: boolean;
  nextGameIndex: number;
};

type ShellPhase =
  | { phase: 'intro';   gameIndex: number }
  | { phase: 'playing'; gameIndex: number; isRetry: boolean }
  | { phase: 'pass';    outcome: OutcomeData }
  | { phase: 'fail';    outcome: OutcomeData }
  | { phase: 'review' };

type ShellAction =
  | { type: 'START';   gameIndex: number; isRetry: boolean }
  | { type: 'PASS';    outcome: OutcomeData }
  | { type: 'FAIL';    outcome: OutcomeData }
  | { type: 'START_REVIEW' }
  | { type: 'CONTINUE' }
  | { type: 'RETRY' };

function reducer(state: ShellPhase, action: ShellAction): ShellPhase {
  switch (action.type) {
    case 'START':
      return { phase: 'playing', gameIndex: action.gameIndex, isRetry: action.isRetry };
    case 'PASS':
      return { phase: 'pass', outcome: action.outcome };
    case 'FAIL':
      return { phase: 'fail', outcome: action.outcome };
    case 'START_REVIEW':
      return { phase: 'review' };
    case 'CONTINUE':
      if (state.phase === 'pass') {
        return { phase: 'intro', gameIndex: state.outcome.nextGameIndex };
      }
      return state;
    case 'RETRY':
      if (state.phase === 'fail') {
        return { phase: 'playing', gameIndex: state.outcome.gameIndex, isRetry: true };
      }
      return state;
  }
}

// ─── Game router — picks the right component by game index ───────────────────

const GAME_COMPONENTS = [CodeDrop, PinRush, CityStack] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GameShellPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, recordAttemptFull } = useSession();
  
  const queryParams = new URLSearchParams(location.search);
  const paramIndex = queryParams.get('game');
  const initialGameIndex = resolveGameParam(paramIndex, session?.currentGameIndex ?? 0);
  
  const [shellState, dispatch] = useReducer(reducer, {
    phase: 'intro',
    gameIndex: initialGameIndex,
  } as ShellPhase);

  const [streak, setStreak] = useState(0);
  const hasEmittedStartRef = useRef(false);

  const currentGameIndex =
    shellState.phase === 'pass' || shellState.phase === 'fail'
      ? shellState.outcome.gameIndex
      : shellState.phase === 'review'
      ? 2
      : shellState.gameIndex;

  // Reset streak when game phase changes or game index changes
  useEffect(() => {
    setStreak(0);
  }, [shellState.phase, currentGameIndex]);

  // Emit gameStart when entering playing phase
  useEffect(() => {
    if (shellState.phase === 'playing' && !hasEmittedStartRef.current) {
      hasEmittedStartRef.current = true;
      const baseline = session
        ? getTotalScore(session) - session.games[shellState.gameIndex].score
        : 0;
      gameEvents.emit('gameStart', {
        gameIndex: shellState.gameIndex,
        isRetry: shellState.isRetry,
        baselineScore: baseline,
      });
    }
    if (shellState.phase !== 'playing') {
      hasEmittedStartRef.current = false;
    }
  }, [shellState.phase, session]);

  // Emit scoreUpdate on streak changes
  useEffect(() => {
    gameEvents.emit('scoreUpdate', {
      gameIndex: currentGameIndex,
      score: 0,
      streak,
    });
  }, [streak, currentGameIndex]);

  // If session is already completed on mount, go straight to results (unless review needs to be completed, or explicitly re-playing a game via parameter)
  useEffect(() => {
    if (session?.completed && !paramIndex) {
      const mistakeCodes = session.games.flatMap((g) => g.mistakes || []);
      if (mistakeCodes.length > 0 && !session.reviewCompleted) {
        dispatch({ type: 'START_REVIEW' });
      } else {
        navigate('/play/results', { replace: true });
      }
    }
  }, [session?.completed, session?.reviewCompleted, paramIndex, navigate]);

  const handleGameComplete = useCallback(
    (gameIndex: number, result: GameResult) => {
      gameEvents.emit('gameComplete', { gameIndex, result });
      const outcome = recordAttemptFull(gameIndex, result);
      const data: OutcomeData = {
        gameIndex:        outcome.gameIndex,
        attempt:          outcome.attempt,
        game:             outcome.game,
        newBadges:        outcome.newBadges,
        sessionCompleted: outcome.sessionCompleted,
        nextGameIndex:    outcome.nextGameIndex,
      };
      if (outcome.status === 'passed') {
        dispatch({ type: 'PASS', outcome: data });
      } else {
        dispatch({ type: 'FAIL', outcome: data });
      }
    },
    [recordAttemptFull],
  );

  function handleContinue() {
    if (shellState.phase !== 'pass') return;
    if (shellState.outcome.sessionCompleted) {
      const mistakeCodes = session?.games.flatMap((g) => g.mistakes || []) ?? [];
      if (mistakeCodes.length > 0 && !session?.reviewCompleted) {
        dispatch({ type: 'START_REVIEW' });
      } else {
        navigate('/play/results');
      }
    } else {
      dispatch({ type: 'CONTINUE' });
    }
  }

  function handleRetry() {
    dispatch({ type: 'RETRY' });
  }

  function handleExit() {
    if (window.confirm('Are you sure you want to exit the current expedition? Progress in this game will not be saved.')) {
      navigate('/');
    }
  }

  // ── Derive top-bar props ──────────────────────────────────────────────────

  const currentDef = GAME_DEFINITIONS[currentGameIndex];
  const isReview = shellState.phase === 'review';
  const gameLabel  = isReview ? 'Review Round' : (currentDef?.label ?? 'Game');

  // ── Render ────────────────────────────────────────────────────────────────

  if (!session) return null;
  if (!session.games[currentGameIndex]) return null;

  const clearedCount  = session.games.filter((g) => g.passed).length;
  const totalGames    = GAME_DEFINITIONS.length;

  return (
    <GameStateProvider>
    <AppLayout variant="game">
      <GameTopBar
        gameLabel={gameLabel}
        level={currentGameIndex + 1}
        totalLevels={totalGames}
        attemptNumber={(session.games[currentGameIndex]?.attempts?.length ?? 0) + 1}
        onExit={handleExit}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          {shellState.phase === 'intro' && session.games[shellState.gameIndex] && (
            <GameIntro
              gameIndex={shellState.gameIndex}
              game={session.games[shellState.gameIndex]}
              clearedCount={clearedCount}
              totalGames={totalGames}
              onStart={(isRetry) =>
                dispatch({ type: 'START', gameIndex: shellState.gameIndex, isRetry })
              }
            />
          )}

          {shellState.phase === 'playing' && (() => {
            const GameComponent = GAME_COMPONENTS[shellState.gameIndex];
            if (!GameComponent) return null;
            return (
              <GameComponent
                key={`${shellState.gameIndex}-${shellState.isRetry}`}
                isRetry={shellState.isRetry}
                onComplete={(result) => handleGameComplete(shellState.gameIndex, result)}
                onStreakChange={setStreak}
              />
            );
          })()}

          {shellState.phase === 'pass' && (
            <PassInterstitial
              gameLabel={shellState.outcome.game.label}
              attempt={shellState.outcome.attempt}
              isFinalExpedition={shellState.outcome.sessionCompleted}
              newBadges={shellState.outcome.newBadges}
              onContinue={handleContinue}
            />
          )}

          {shellState.phase === 'fail' && (
            <FailInterstitial
              gameLabel={shellState.outcome.game.label}
              attempt={shellState.outcome.attempt}
              allAttempts={shellState.outcome.game.attempts}
              onRetry={handleRetry}
            />
          )}

          {shellState.phase === 'review' && (
            <ReviewRound
              onComplete={() => navigate('/play/results')}
            />
          )}
        </div>
      </div>

      <WaveLeaderboardWidget isAnimating={shellState.phase !== 'playing'} />
    </AppLayout>
    </GameStateProvider>
  );
}
