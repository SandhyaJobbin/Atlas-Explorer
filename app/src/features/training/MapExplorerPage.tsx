import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import type { StateEntry } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import TrainingTopBar from '@/components/layout/TrainingTopBar';
import InteractiveMap from '@/components/map/InteractiveMap';
import StateInfoPanel from '@/components/map/StateInfoPanel';

const TOTAL = 63;

export default function MapExplorerPage() {
  const { session, updateTraining } = useSession();
  const navigate = useNavigate();

  const [states, setStates] = useState<StateEntry[]>([]);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const clicked = session?.training.mapExplorerClicked ?? [];
  const activeState = states.find((s) => s.code === activeCode) ?? null;
  const allDone = clicked.length >= TOTAL;

  // Load state data
  useEffect(() => {
    fetch('/data/states.json')
      .then((r) => r.json())
      .then(setStates)
      .catch(console.error);
  }, []);

  function handleRegionClick(code: string) {
    setActiveCode(code);
    updateTraining('map', code);
  }

  return (
    <AppLayout variant="training">
      <TrainingTopBar
        explored={clicked.length}
        total={TOTAL}
        label="Map Explorer"
      />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0d1a0d]">
        {!hasStarted && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0d1a0d]/80 backdrop-blur-sm p-4">
            <div className="bg-[#F5F0E8] p-8 rounded-3xl max-w-md text-center shadow-2xl border border-white/20">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-3xl font-black text-[#232F3E] mb-4 leading-tight">Map Explorer</h2>
              <p className="text-[#2D3B2F]/80 mb-8 font-medium">
                Your mission is to explore all {TOTAL} states and provinces of North America. Click on the map regions to reveal their details and complete the zone!
              </p>
              <button
                onClick={() => setHasStarted(true)}
                className="bg-[#00A8A2] hover:bg-[#008f89] text-white font-bold py-4 px-8 rounded-xl text-lg transition-all w-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Start Mission
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 flex flex-col gap-3 min-h-0 relative">
          <div className="flex items-center justify-between z-10">
            <h2 className="text-white font-bold text-lg">Interactive Map</h2>
            <span className="text-[#00A8A2] text-sm font-semibold bg-[#0d1a0d]/50 px-3 py-1 rounded-full backdrop-blur-sm">
              {clicked.length}/{TOTAL} explored
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden z-10">
            <div
              className="h-full bg-[#00A8A2] rounded-full transition-all duration-500"
              style={{ width: `${(clicked.length / TOTAL) * 100}%` }}
            />
          </div>

          <div className="flex-1 overflow-hidden relative rounded-xl ring-1 ring-white/10 shadow-2xl">
            <InteractiveMap
              onRegionClick={handleRegionClick}
              highlightedCodes={clicked}
              activeCode={activeCode}
              mode="explore"
            />
          </div>

          <p className="text-white/30 text-xs text-center z-10">
            Click each state and province to explore it
          </p>

          {/* Floating Card */}
          {activeState && (
            <div className="absolute top-16 right-6 z-40 animate-in fade-in slide-in-from-right-4 duration-300">
              <StateInfoPanel state={activeState} onClose={() => setActiveCode(null)} />
            </div>
          )}

          {/* Continue button floating when done */}
          {allDone && (
            <div className="absolute bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4">
              <button
                onClick={() => navigate('/train/complete')}
                className="bg-[#FF9900] hover:bg-[#e68a00] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm shadow-xl flex items-center gap-2"
              >
                Continue to Results <span className="text-xl">→</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
