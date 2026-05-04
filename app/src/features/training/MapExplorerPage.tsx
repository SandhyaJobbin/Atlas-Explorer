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
        label="Zone 1 — Map Explorer"
      />

      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Map panel */}
        <div className="flex-1 bg-[#0d1a0d] p-4 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-lg">Interactive Map</h2>
            <span className="text-[#00A8A2] text-sm font-semibold">
              {clicked.length}/{TOTAL} explored
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00A8A2] rounded-full transition-all duration-500"
              style={{ width: `${(clicked.length / TOTAL) * 100}%` }}
            />
          </div>

          <div className="flex-1 overflow-hidden">
            <InteractiveMap
              onRegionClick={handleRegionClick}
              highlightedCodes={clicked}
              activeCode={activeCode}
              mode="explore"
            />
          </div>

          <p className="text-white/30 text-xs text-center">
            Click each state and province to explore it
          </p>
        </div>

        {/* Info panel */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <StateInfoPanel state={activeState} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/train/tiles')}
              disabled={!allDone}
              className="w-full bg-[#232F3E] hover:bg-[#2D3B2F] disabled:opacity-30 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {allDone
                ? 'Continue to Geo Tiles →'
                : `${TOTAL - clicked.length} more to explore`}
            </button>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
