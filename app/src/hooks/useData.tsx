import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { StateEntry } from '@/types';
import { publicAsset } from '@/lib/assets';

const CACHE_KEY = 'atlas_states_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface DataContextValue {
  states: StateEntry[];
  loading: boolean;
}

const DataContext = createContext<DataContextValue>({ states: [], loading: true });

function getCachedStates(): StateEntry[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function cacheStates(states: StateEntry[]) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({
    data: states,
    expires: Date.now() + CACHE_TTL_MS,
  }));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<StateEntry[]>(() => getCachedStates() || []);
  const [loading, setLoading] = useState(() => !getCachedStates());

  useEffect(() => {
    if (states.length > 0) return;
    fetch(publicAsset('/data/states.json'))
      .then((r) => r.json())
      .then((data: StateEntry[]) => {
        setStates(data);
        cacheStates(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <DataContext.Provider value={{ states, loading }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
