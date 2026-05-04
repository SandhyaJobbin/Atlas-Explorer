import { useCallback, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import type { GameAttempt, GameState, EarnedBadge, GameResult } from '@/types';
import { GAME_DEFINITIONS, getTotalScore } from '@/lib/session';
import AppLayout from '@/components/layout/AppLayout';
import GameTopBar from '@/components/layout/GameTopBar';
import GameIntro from './GameIntro';
import PassInterstitial from './PassInterstitial';
import FailInterstitial from './FailInterstitial';
import CodeDrop from './CodeDrop';
import PinRush from './PinRush';
import CityStack from './CityStack';

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
  | { phase: 'fail';    outcome: OutcomeData };

type ShellAction =
  | { type: 'START';   gameIndex: number; isRetry: boolean }
  | { type: 'PASS';    outcome: OutcomeData }
  | { type: 'FAIL';    outcome: OutcomeData }
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
  const { session, recordAttemptFull } = useSession();

  const initialGameIndex = session?.currentGameIndex ?? 0;
  const [shellState, dispatch] = useReducer(reducer, {
    phase: 'intro',
    gameIndex: initialGameIndex,
  } as ShellPhase);

  // If session is already completed on mount, go straight to results
  useEffect(() => {
    if (session?.completed) {
      navigate('/play/results', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGameComplete = useCallback(
    (gameIndex: number, result: GameResult) => {
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
      navigate('/play/results');
    } else {
      dispatch({ type: 'CONTINUE' });
    }
  }

  function handleRetry() {
    dispatch({ type: 'RETRY' });
  }

  // ── Derive top-bar props ──────────────────────────────────────────────────

  const currentGameIndex =
    shellState.phase === 'pass' || shellState.phase === 'fail'
      ? shellState.outcome.gameIndex
      : shellState.gameIndex;

  const currentDef = GAME_DEFINITIONS[currentGameIndex];
  const gameLabel  = currentDef?.label ?? 'Game';
  const totalScore = session ? getTotalScore(session) : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  if (!session) return null;

  const clearedCount  = session.games.filter((g) => g.passed).length;
  const totalGames    = GAME_DEFINITIONS.length;

  return (
    <AppLayout variant="game">
      <GameTopBar
        gameLabel={gameLabel}
        score={totalScore}
        level={currentGameIndex + 1}
        totalLevels={totalGames}
      />

      {shellState.phase === 'intro' && (
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
          />
        );
      })()}

      {shellState.phase === 'pass' && (
        <PassInterstitial
          gameLabel={shellState.outcome.game.label}
          attempt={shellState.outcome.attempt}
          isFinalMission={shellState.outcome.sessionCompleted}
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
    </AppLayout>
  );
}
