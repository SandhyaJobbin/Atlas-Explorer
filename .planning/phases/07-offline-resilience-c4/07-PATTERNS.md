# Phase 7: Offline Resilience (C4) — Pattern Map

**Mapped:** 2026-05-21
**Files analyzed:** 6 (3 new, 3 modify)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/src/hooks/useOnlineStatus.ts` | hook | event-driven | `app/src/hooks/useSessionTimer.ts` | exact (same role + flow) |
| `app/src/components/OfflineIndicator.tsx` | component | event-driven | `app/src/components/ui/StampBadge.tsx` | role-match (simple presentational) |
| `app/src/lib/sync-queue.ts` | utility | CRUD (localStorage) | `app/src/lib/leaderboard.ts` | exact (same localStorage CRUD pattern) |
| `app/src/lib/leaderboard.ts` | service | CRUD | self (same file, add functions) | — |
| `app/src/App.tsx` | config | n/a | self (same file, add provider pattern) | — |
| `app/src/features/games/GameIntro.tsx` | component | n/a | self (same file, add conditional message) | — |

## Pattern Assignments

### `app/src/hooks/useOnlineStatus.ts` (hook, event-driven)

**Analog:** `app/src/hooks/useSessionTimer.ts`

**Imports pattern** (lines 1-2):
```typescript
import { useState, useEffect } from 'react';
```

**Core hook pattern** (lines 7-21) — useState + useEffect with window event listeners, cleanup in return:
```typescript
export function useSessionTimer() {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);
  // ...
}
```

**Pattern to apply for useOnlineStatus:**
- `useState(() => navigator.onLine)` — lazy init from browser API
- `useEffect` with `window.addEventListener('online', ...)` and `window.addEventListener('offline', ...)`
- Cleanup removes listeners
- Return `{ isOnline, isOffline }` object (no context needed — called in App.tsx, passed as prop)

---

### `app/src/components/OfflineIndicator.tsx` (component, event-driven)

**Analog:** `app/src/components/ui/StampBadge.tsx`

**Imports pattern** (line 1) — direct component import, no barrel:
```typescript
import { publicAsset } from '@/lib/assets';
```

**Component pattern** (lines 9-41) — simple function component, typed props, TailwindCSS classes:
```typescript
interface StampBadgeProps {
  label: string;
  type: 'success' | 'error' | 'warning' | 'info';
  className?: string;
}

export default function StampBadge({ label, type, className = '' }: StampBadgeProps) {
  // ...
  return (
    <div className={`
      relative inline-block px-6 py-2 border-4 rounded-lg font-black uppercase tracking-[0.2em] text-2xl
      ${colors[type]}
      ${className}
    `}>
      {/* JSX content */}
    </div>
  );
}
```

**Pattern to apply for OfflineIndicator:**
- No props needed — parent controls visibility (`{!isOnline && <OfflineIndicator />}`)
- Import `{ WifiOff } from 'lucide-react'`
- Fixed-position div: `fixed top-0 left-0 right-0 z-50`
- Amber theme: `bg-amber-50 border-b border-amber-300` + `text-amber-700`/`text-amber-800`
- Icon + text layout: `flex items-center justify-center gap-2`
- Use existing atlas theme tokens where possible, amber from TailwindCSS v4 built-in palette

---

### `app/src/lib/sync-queue.ts` (utility, CRUD)

**Analog:** `app/src/lib/leaderboard.ts` (localStorage CRUD pattern)

**Imports pattern** — no imports needed (pure utility, no types):
```typescript
// No imports — uses only browser APIs: localStorage, crypto.randomUUID()
```

**localStorage read pattern** (lines 141-147 in leaderboard.ts) — try/catch, fallback to default:
```typescript
export function readLocalScores(): Record<string, unknown>[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_LEADERBOARD_KEY) || '[]') as Record<string, unknown>[];
  } catch {
    return [];
  }
}
```

**localStorage write pattern** (lines 135-139 in leaderboard.ts):
```typescript
function saveLocalScore(payload: Record<string, unknown>): void {
  const scores = readLocalScores();
  scores.push({ ...payload, timestamp: new Date().toISOString() });
  localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(scores));
}
```

**Pattern to apply for sync-queue.ts:**
- `SYNC_QUEUE_KEY = 'atlas-explorer-sync-queue'` (D-06 separate key)
- `QueuedScore` interface: `{ payload, queuedAt: ISO string, id: string }` (D-07)
- `readQueue()` — try/catch JSON parse, empty array fallback
- `writeQueue(items)` — `localStorage.setItem(KEY, JSON.stringify(items))`
- `enqueueScore(payload)` — read, push with `crypto.randomUUID()`, write
- `drainQueue(appsScriptUrl)` — sequential for-loop, POST each, remove on 2xx (D-09), gate with `isConfigured()` (D-10)
- `getQueueLength()` — read + return length

---

### `app/src/lib/leaderboard.ts` (MODIFY — service, CRUD)

**Analog:** Same file — add `enqueueScore()` and `drainQueue()` calls

**Modification points:**

**submitAttemptScore()** (lines 24-42) — add `enqueueScore(body)` in all three branches:
```typescript
export async function submitAttemptScore(payload: AttemptScorePayload): Promise<void> {
  // ... body construction ...

  if (!isConfigured()) {
    saveLocalScore(body);
    enqueueScore(body);     // ADD
    return;
  }

  if (!navigator.onLine) {   // ADD new offline check
    saveLocalScore(body);
    enqueueScore(body);     // ADD
    return;
  }

  try {
    await fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'submit', ...body }) });
  } catch {
    saveLocalScore(body);
    enqueueScore(body);     // ADD
  }
}
```

**Add new drain function** — must live here for access to `APPS_SCRIPT_URL`:
```typescript
export async function drainQueue(): Promise<void> {
  if (!isConfigured()) return;  // D-10 gate
  // read from sync-queue key, sequential POST, remove on success
}
```

Import `enqueueScore` and `drainQueue` from sync-queue, OR inline queue CRUD. RESEARCH.md recommends putting drain in leaderboard.ts since `APPS_SCRIPT_URL` is module-private.

---

### `app/src/App.tsx` (MODIFY — config/layout)

**Analog:** Same file — existing provider composition pattern (lines 56-80)

**Imports pattern** (lines 1-5):
```typescript
import { useEffect } from 'react';                                 // ADD
import { useOnlineStatus } from '@/hooks/useOnlineStatus';          // ADD
import { OfflineIndicator } from '@/components/OfflineIndicator';   // ADD
import { drainQueue } from '@/lib/leaderboard';                     // ADD
```

**Provider composition pattern** (lines 59-77) — mount indicator + drain inside component body:
```typescript
export default function App() {
  const { isOnline } = useOnlineStatus();     // ADD

  useEffect(() => {                           // ADD — drain on reconnect
    if (isOnline) drainQueue();               // D-08: only on online event
  }, [isOnline]);                             // D-08: no mount drain

  return (
    <HashRouter>
      {!isOnline && <OfflineIndicator />}     {/* ADD — before providers */}
      <AudioProvider>
        <DataProvider>
          <SessionProvider>
          <Routes>...</Routes>
          </SessionProvider>
        </DataProvider>
      </AudioProvider>
    </HashRouter>
  );
}
```

**Key pattern:** OfflineIndicator renders above providers but inside HashRouter (z-50 fixed position ensures it's always on top). Drain effect uses `useEffect` with `isOnline` dependency to fire only on transitions.

---

### `app/src/features/games/GameIntro.tsx` (MODIFY — component)

**Analog:** Same file — add conditional offline message

**Modification point** — add offline message after start button (after line 268):
```typescript
// Import at top:
import { useOnlineStatus } from '@/hooks/useOnlineStatus';  // ADD
import { WifiOff } from 'lucide-react';                      // ADD

// Inside component body:
const { isOffline } = useOnlineStatus();                     // ADD

// In JSX, after start button section (after line 249 closing </button>):
{isOffline && (
  <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
    <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
    <p className="text-xs font-medium text-amber-800">
      Connectivity required for leaderboard — scores will sync later
    </p>
  </div>
)}
```

**Alternative** (if avoiding hook import in component): Pass `isOffline` as prop from `GameShellPage.tsx` where already using hooks.

---

## Shared Patterns

### localStorage CRUD
**Source:** `app/src/lib/leaderboard.ts` (lines 135-147)
**Apply to:** `app/src/lib/sync-queue.ts`

```typescript
function readAll<T = Record<string, unknown>>(): T[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function writeAll(items: unknown[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}
```

### Hook with window event listeners
**Source:** `app/src/hooks/useSessionTimer.ts` (lines 1-21)
**Apply to:** `app/src/hooks/useOnlineStatus.ts`

```typescript
export function useXxx() {
  const [state, setState] = useState(initialValue);
  useEffect(() => {
    const handler = () => setState(newValue);
    window.addEventListener('event', handler);
    return () => window.removeEventListener('event', handler);
  }, []);
  return { state };
}
```

### Simple presentational component
**Source:** `app/src/components/ui/StampBadge.tsx` (lines 1-42)
**Apply to:** `app/src/components/OfflineIndicator.tsx`

Pattern: typed interface props, default export, TailwindCSS classes, no external state, no context.

### Sequential async drain with per-item removal
**Apply to:** `drainQueue()` in leaderboard.ts

```typescript
const remaining: ItemType[] = [];
for (const item of queue) {
  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(item.payload) });
    if (!res.ok) remaining.push(item);  // 4xx/5xx: keep for retry
    // 2xx: drop (not pushed to remaining)
  } catch {
    remaining.push(item);               // network error: keep for retry
  }
}
writeQueue(remaining);
```

### `isConfigured()` gate (D-10)
**Source:** `app/src/lib/leaderboard.ts` (lines 92-94)
**Apply to:** `drainQueue()` entry point

```typescript
if (!isConfigured()) return;  // no-op when APPS_SCRIPT_URL is empty
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| *None* | | | All 6 files have direct analogs in existing codebase |

## Metadata

**Analog search scope:** `app/src/hooks/`, `app/src/lib/`, `app/src/components/`, `app/src/features/games/`, `app/src/App.tsx`
**Files scanned:** 18
**Pattern extraction date:** 2026-05-21
