import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SessionContext, useSessionState } from '@/hooks/useSession';
import { AudioProvider } from '@/hooks/useAudio';
import LandingPage from '@/features/landing/LandingPage';
import MapExplorerPage from '@/features/training/MapExplorerPage';
import TrainingCompletePage from '@/features/training/TrainingCompletePage';
import GameShellPage from '@/features/games/GameShellPage';
import ResultsPage from '@/features/results/ResultsPage';

// ─── Route guards ─────────────────────────────────────────────────────────────

function TrainingGuard({ children }: { children: React.ReactElement }) {
  const raw = globalThis.localStorage?.getItem('atlas-explorer-session');
  if (!raw) return <Navigate to="/" replace />;
  return children;
}

function PlayGuard({ children }: { children: React.ReactElement }) {
  const raw = globalThis.localStorage?.getItem('atlas-explorer-session');
  if (!raw) return <Navigate to="/" replace />;
  try {
    const session = JSON.parse(raw);
    if (!session?.training?.completed) return <Navigate to="/train/map" replace />;
  } catch {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ─── Session Provider ─────────────────────────────────────────────────────────

function SessionProvider({ children }: { children: React.ReactNode }) {
  const value = useSessionState();
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <SessionProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/train/map" element={<TrainingGuard><MapExplorerPage /></TrainingGuard>} />
            <Route path="/train/complete" element={<TrainingGuard><TrainingCompletePage /></TrainingGuard>} />

            <Route path="/play" element={<PlayGuard><GameShellPage /></PlayGuard>} />
            <Route path="/play/results" element={<PlayGuard><ResultsPage /></PlayGuard>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </AudioProvider>
    </BrowserRouter>
  );
}

