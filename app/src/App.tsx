import { useEffect, useRef } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessionContext, useSessionState } from '@/hooks/useSession';
import { AudioProvider } from '@/hooks/useAudio';
import { DataProvider } from '@/hooks/useData';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import OfflineIndicator from '@/components/OfflineIndicator';
import { drainQueue } from '@/lib/leaderboard';
import LandingPage from '@/features/landing/LandingPage';
import MapExplorerPage from '@/features/training/MapExplorerPage';
import TrainingCompletePage from '@/features/training/TrainingCompletePage';
import GameShellPage from '@/features/games/GameShellPage';
import ResultsPage from '@/features/results/ResultsPage';
import TrainerDashboard from '@/features/trainer/TrainerDashboard';

// ─── Route guards ─────────────────────────────────────────────────────────────

function TrainingGuard({ children }: { children: React.ReactElement }) {
  const raw = globalThis.localStorage?.getItem('atlas-explorer-session');
  const hasOverride = window.location.hash.includes('demo=');
  if (!raw && !hasOverride) return <Navigate to="/" replace />;
  return children;
}

function PlayGuard({ children }: { children: React.ReactElement }) {
  const raw = globalThis.localStorage?.getItem('atlas-explorer-session');
  
  // Allow bypass if game or debug param is present in the hash/search
  const hasOverride = window.location.hash.includes('game=') || window.location.hash.includes('debug=');
  
  if (!raw) {
    if (hasOverride) return children; // Allow proceeding to let GameShell/Session handle missing session
    return <Navigate to="/" replace />;
  }

  let shouldTrain = false;
  let isInvalidSession = false;
  try {
    const session = JSON.parse(raw);
    if (!session?.training?.completed && !hasOverride) {
      shouldTrain = true;
    }
  } catch {
    isInvalidSession = true;
  }
  if (shouldTrain) return <Navigate to="/train/map" replace />;
  if (isInvalidSession && !hasOverride) return <Navigate to="/" replace />;
  return children;
}

// ─── Session Provider ─────────────────────────────────────────────────────────

function SessionProvider({ children }: { children: React.ReactNode }) {
  const value = useSessionState();
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { isOnline } = useOnlineStatus();
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isOnline) drainQueue();
  }, [isOnline]);

  return (
    <HashRouter>
      <OfflineIndicator />
      <AudioProvider>
        <DataProvider>
          <SessionProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/train/map" element={<TrainingGuard><MapExplorerPage /></TrainingGuard>} />
            <Route path="/train/complete" element={<TrainingGuard><TrainingCompletePage /></TrainingGuard>} />

            <Route path="/play" element={<PlayGuard><GameShellPage /></PlayGuard>} />
            <Route path="/play/results" element={<PlayGuard><ResultsPage /></PlayGuard>} />

            <Route path="/trainer" element={<TrainerDashboard />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </SessionProvider>
        </DataProvider>
      </AudioProvider>
    </HashRouter>
  );
}
