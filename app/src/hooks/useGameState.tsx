import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { gameEvents } from './useGameEvents';

interface LiveGameState {
  score: number;
  streak: number;
  gameIndex: number;
  isPlaying: boolean;
  baselineScore: number;
}

const GameStateContext = createContext<LiveGameState>({
  score: 0,
  streak: 0,
  gameIndex: 0,
  isPlaying: false,
  baselineScore: 0,
});

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiveGameState>({
    score: 0,
    streak: 0,
    gameIndex: 0,
    isPlaying: false,
    baselineScore: 0,
  });

  useEffect(() => {
    const onStart = (e: { gameIndex: number; isRetry: boolean; baselineScore: number }) => {
      setState({ score: 0, streak: 0, gameIndex: e.gameIndex, isPlaying: true, baselineScore: e.baselineScore });
    };

    const onScoreUpdate = (e: { score: number; streak: number; gameIndex: number }) => {
      setState((prev) => ({
        ...prev,
        score: e.score,
        streak: e.streak,
        gameIndex: e.gameIndex,
      }));
    };

    const onComplete = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    gameEvents.on('gameStart', onStart);
    gameEvents.on('scoreUpdate', onScoreUpdate);
    gameEvents.on('gameComplete', onComplete);

    return () => {
      gameEvents.off('gameStart', onStart);
      gameEvents.off('scoreUpdate', onScoreUpdate);
      gameEvents.off('gameComplete', onComplete);
    };
  }, []);

  return (
    <GameStateContext.Provider value={state}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  return ctx;
}
