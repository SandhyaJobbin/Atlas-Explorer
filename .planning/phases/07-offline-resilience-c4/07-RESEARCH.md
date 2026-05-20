# Phase 7: Offline Resilience (C4) — Research

**Researched:** 2026-05-21
**Domain:** Offline detection / local queue / sync-on-reconnect
**Confidence:** HIGH

## Summary

Phase implements two user-visible capabilities: (1) offline indicator banner when connectivity drops, (2) score queue that drains automatically on reconnect. All logic is client-side — no Service Worker, no IndexedDB. Uses `navigator.onLine` + `window.online`/`offline` events per D-01. New queue key `atlas-explorer-sync-queue` separate from existing `atlas-explorer-local-leaderboard`. Existing `submitAttemptScore()` catch→`saveLocalScore()` pattern stays (D-02). Drain fires only on `window.online` (D-08), gated by `isConfigured()` (D-10).

No new npm dependencies. `lucide-react` already in deps — `WifiOff` icon available.

**Primary recommendation:** Create 4 files — `useOnlineStatus` hook, `OfflineIndicator` component, `sync-queue` lib, modify `App.tsx` + `leaderboard.ts` + `GameIntro`. No new context provider needed — hook with singleton event registration in App is sufficient.

## <phase_requirements>

### Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OFFLINE-01 | Offline indicator shown in UI when network drops | `navigator.onLine` + `window.offline` event fires within 1s guaranteed. Banner positioned fixed top, z-50, amber bg. |
| OFFLINE-02 | Scores queued locally, synced on reconnect | Queue at `atlas-explorer-sync-queue` with `{payload, queuedAt, id}`. Drain = sequential POST, remove on success. Fire only on `window.online`. |

</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Use `navigator.onLine` + `window.online`/`window.offline` events. No heartbeat.
- D-02: Existing `submitAttemptScore()` catch → `saveLocalScore()` pattern stays for server-unreachable case
- D-03: Persistent top banner, amber/yellow, full-width
- D-04: Lucide `WifiOff` icon + "You're offline — scores will sync when reconnected"
- D-05: Appears on `window.offline` event, hides on `window.online`, not dismissible
- D-06: Separate localStorage key `atlas-explorer-sync-queue` for unsent scores
- D-07: Queue items: `{payload, queuedAt: ISO string, id: unique string}`
- D-08: Drain only on `window.online` event. No drain on mount/focus.
- D-09: Per-item sequential POST, remove on success
- D-10: Drain no-op when `isConfigured()` returns false (APPS_SCRIPT_URL empty)
- D-11: Game start offline message: "Connectivity required for leaderboard — scores will sync later". Non-blocking.

### the agent's Discretion
- Banner amber shade selection (TailwindCSS v4 built-in `amber-50`/`amber-100` recommended)
- `useOnlineStatus` hook shape (returns `{isOnline: boolean}`, registers listeners in `useEffect`)
- Queue `enqueueScore()` logic placement (wrap in `submitAttemptScore()` vs. separate pre-check)
- `OfflineIndicator` component placement (rendered in `App.tsx` vs. inside `AppLayout`)

### Deferred Ideas (OUT OF SCOPE)
- Service Worker / PWA shell cache
- IndexedDB migration
- Map tile / asset caching for full offline play
- Cache-first strategy
- Audio asset caching
- Cross-session FSRS scheduling
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Offline detection | Browser/Client | — | `navigator.onLine` + event listeners — pure browser API |
| Offline indicator display | Browser/Client (UI) | — | React component rendering fixed-position banner |
| Score queue (localStorage) | Browser/Client | — | localStorage CRUD, no server |
| Queue drain on reconnect | Browser/Client | API/Backend (passive) | POST to Apps Script, but no server-side orchestration |
| Game start offline message | Browser/Client (UI) | — | Conditional text in `GameIntro` component |
| Leaderboard display after sync | Browser/Client (UI) | — | `WaveLeaderboardWidget` already does local + server fetch |

All capability ownership is Browser/Client tier. No API tier changes needed. Apps Script remains a passive POST recipient.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lucide-react` | ^1.16.0 | `WifiOff` icon for banner | Already in deps, used project-wide for icons |
| TailwindCSS v4 `@theme` | ^4.2.4 | Amber banner colors via built-in `amber-*` palette | Already the project's CSS framework |
| `mitt` | ^3.0.1 | Optional: if event emitter needed for cross-component sync | Already in deps (used by `useGameEvents`) |

### No New Dependencies Needed

Confirmed: `lucide-react` exports `WifiOff`. TailwindCSS v4 ships full color palette — `amber-50`, `amber-100`, `amber-300`, `amber-800` all available with no config.

**Installation:** None — all deps already present.

## Package Legitimacy Audit

> No new packages installed in this phase. All dependencies (`lucide-react`, `react`, `tailwindcss`, `mitt`) already present and verified in `package.json`. No audit needed.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Client)                                        │
│                                                          │
│  ┌─────────────┐    ┌──────────────────────────────┐    │
│  │ navigator   │    │  useOnlineStatus hook         │    │
│  │ .onLine     │───▶│  (singleton listeners in App) │    │
│  │ win.online  │    │  exposes {isOnline}           │    │
│  │ win.offline │    └───────┬──────────────────────┘    │
│  └─────────────┘            │                           │
│                             │                           │
│              ┌──────────────┼──────────────┐            │
│              ▼              ▼              ▼            │
│  ┌─────────────────┐ ┌──────────┐ ┌──────────────┐     │
│  │ OfflineIndicator │ │ Drain    │ │ GameIntro    │     │
│  │ (banner comp)    │ │ Queue    │ │ (offline msg)│     │
│  │ fixed top z-50   │ │ (lib:    │ │ non-blocking │     │
│  └─────────────────┘ │ sync-    │ └──────────────┘     │
│                       │ queue.ts)│                      │
│                       └────┬─────┘                      │
│                            │                            │
│              ┌─────────────┴──────────┐                 │
│              ▼                        ▼                 │
│  ┌────────────────────┐  ┌──────────────────────┐      │
│  │ localStorage       │  │ Apps Script          │      │
│  │ atlas-explorer-    │  │ (Google Sheets       │      │
│  │ sync-queue         │  │  POST on drain)      │      │
│  └────────────────────┘  └──────────────────────┘      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ submitAttemptScore() (leaderboard.ts)             │   │
│  │  • navigator.onLine check → enqueue to sync-queue│   │
│  │  • fetch() → success: done                       │   │
│  │  • fetch() → catch: saveLocalScore() + enqueue   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
app/src/
├── hooks/
│   └── useOnlineStatus.ts         # NEW: {isOnline} hook
├── lib/
│   └── sync-queue.ts             # NEW: enqueueScore(), drainQueue(), getQueueLength()
├── components/
│   └── OfflineIndicator.tsx       # NEW: top banner component
├── features/
│   └── games/
│       └── GameIntro.tsx          # MODIFY: add offline message (D-11)
├── App.tsx                        # MODIFY: mount useOnlineStatus + OfflineIndicator
└── lib/
    └── leaderboard.ts             # MODIFY: add enqueue call in catch + offline check
```

### Pattern 1: useOnlineStatus hook

**What:** Singleton hook that registers `window.online`/`window.offline` once, provides `{isOnline}` to all consumers. No context needed — call at top-level in `App.tsx`, pass down via prop or render `OfflineIndicator` directly.

**Example:**
```typescript
// Source: Adapted from standard React + navigator.onLine pattern [VERIFIED: MDN docs]
// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}
```

### Pattern 2: Queue lib (sync-queue.ts)

**What:** Pure functions for localStorage queue CRUD. Separates queue concerns from leaderboard display storage.

**Key design:**
- `enqueueScore(payload)` — appends `{payload, queuedAt, id}` to sync-queue array
- `drainQueue()` — reads all items, POSTs each sequentially, removes on success
- `getQueueLength()` — returns count for potential badge UI
- `isConfigured()` gate on drain (D-10)

```typescript
// Full implementation pattern for sync-queue.ts

const SYNC_QUEUE_KEY = 'atlas-explorer-sync-queue';

interface QueuedScore {
  payload: Record<string, unknown>;
  queuedAt: string;   // ISO string
  id: string;         // unique — crypto.randomUUID() or Date.now() + Math.random
}

function readQueue(): QueuedScore[] {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  } catch { return []; }
}

function writeQueue(items: QueuedScore[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
}

export function enqueueScore(payload: Record<string, unknown>): void {
  const queue = readQueue();
  queue.push({
    payload,
    queuedAt: new Date().toISOString(),
    id: crypto.randomUUID(),
  });
  writeQueue(queue);
}

export async function drainQueue(): Promise<void> {
  // D-10 gate
  const { isConfigured } = await import('@/lib/leaderboard');
  if (!isConfigured()) return;

  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: QueuedScore[] = [];
  for (const item of queue) {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'submit', ...item.payload }),
      });
      if (!response.ok) remaining.push(item); // keep on HTTP error
      // on success: item dropped (not pushed to remaining)
    } catch {
      remaining.push(item); // keep on network error — next drain retries
    }
  }
  writeQueue(remaining);
}

export function getQueueLength(): number {
  return readQueue().length;
}
```

**Important detail:** `drainQueue()` must import `APPS_SCRIPT_URL` directly or use a shared config. But `APPS_SCRIPT_URL` is currently a module-private const in `leaderboard.ts`. Either:
1. Extract URL to shared config module
2. Accept URL as param to `drainQueue()`
3. Only gate via `isConfigured()` (which checks URL)

Option 2/3 simplest: `drainQueue()` takes the URL as parameter, call site provides it. But since `APPS_SCRIPT_URL` is private to `leaderboard.ts`, the simplest approach is to make `drainQueue` part of `leaderboard.ts` or accept `appsScriptUrl` as parameter.

**Recommendation:** Add `drainQueue()` to `leaderboard.ts` where it has access to `APPS_SCRIPT_URL`, OR create `sync-queue.ts` that imports `APPS_SCRIPT_URL` (export it from leaderboard.ts or extract to config). Per D-08/D-10 simplicity, recommend adding to `leaderboard.ts`.

### Pattern 3: OfflineIndicator component

**What:** Fixed-position amber banner at top of viewport. Shown only when offline. Not dismissible (D-05).

```typescript
// OfflineIndicator.tsx
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  // This component is only rendered when isOnline === false
  // Parent (App.tsx) controls visibility
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-300 px-4 py-2.5 flex items-center justify-center gap-2 shadow-sm">
      <WifiOff className="w-4 h-4 text-amber-700" />
      <span className="text-sm font-medium text-amber-800">
        You're offline — scores will sync when reconnected
      </span>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Mount drain on page load:** D-08 explicitly forbids drain on mount. Drain only fires on `window.online`.
- **Heartbeat ping:** D-01 explicitly forbids heartbeat. `navigator.onLine` + events only.
- **Parallel POST drain:** D-09 requires sequential per-item POST. Race conditions if parallel (queue state corruption).
- **Combine queue with local leaderboard:** D-06 requires separate key. Keeps concerns isolated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Offline detection | Custom heartbeat or fetch-ping | `navigator.onLine` + `window.online`/`offline` events | D-01 decision. Browser already detects connectivity. |
| Unique IDs for queue items | UUID generation library | `crypto.randomUUID()` | Available in all modern browsers, no deps needed. |

**Key insight:** `crypto.randomUUID()` is available in all modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+) — no polyfill needed for this use case. [VERIFIED: MDN docs]

## Common Pitfalls

### Pitfall 1: Drain on mount causes duplicate submissions
**What goes wrong:** If `drainQueue()` runs on mount (e.g., via `useEffect` on mount), scores that were already drained in a previous session get re-POSTed because the queue was never cleared.
**Root cause:** D-08 forbids mount drain. If queue items are POSTed but the removal failed (e.g., crash between POST and localStorage write), the item remains.
**How to avoid:** Only drain on `window.online`. No `useEffect` dependency on mount.
**Warning signs:** Duplicate rows in the leaderboard spreadsheet.

### Pitfall 2: `navigator.onLine` false positives on captive portals
**What goes wrong:** Browser reports `navigator.onLine = true` when connected to WiFi but behind a captive portal (no actual internet).
**Root cause:** `navigator.onLine` only checks network adapter status, not actual internet reachability.
**How to avoid:** Not avoided per D-01 — decision accepts this limitation. In practice, fetch call will fail and fall into the catch handler which enqueues. The score will be drained when the user reaches real internet.

### Pitfall 3: Drain colliding with active score submission
**What goes wrong:** If user plays a game and submits score while drain is in progress, race condition on queue reads/writes.
**Root cause:** Async localStorage operations not atomic.
**How to avoid:** Drain and enqueue both read-then-write the full array. After drain completes, any concurrent enqueue wins. Acceptable because:
- Enqueue is instantaneous (no async)
- Drain is async but only runs on reconnect (not during gameplay typically)
- Worst case: item appears in both queue and server — no data loss

### Pitfall 4: Missing `isConfigured()` gate causes 404 POSTs
**What goes wrong:** Drain POSTs to empty string URL → throws error → items remain in queue forever, never cleared.
**Root cause:** `APPS_SCRIPT_URL` is empty string in development. Drain fires on reconnect but POST fails.
**How to avoid:** D-10 mandatory gate. Check `isConfigured()` before any POST. Items stay in queue — not lost, not draining to nowhere.

## Code Examples

### Integrating submitAttemptScore with sync queue (leaderboard.ts modification)

```typescript
// Modified submitAttemptScore() in leaderboard.ts
export async function submitAttemptScore(payload: AttemptScorePayload): Promise<void> {
  const gameSlug = GAME_SHEET_KEYS[payload.game] || payload.game;
  const body = {
    agent: payload.agent, waveCode: payload.waveCode,
    trainerName: payload.trainerName, game: gameSlug,
    attempt: payload.attempt, scorePct: payload.scorePct,
    stars: payload.stars, passed: Boolean(payload.passed),
  };

  if (!isConfigured()) {
    saveLocalScore(body);
    enqueueScore(body);     // ADD: queue for future drain
    return;
  }

  // Offline check before fetch — queue immediately, don't attempt POST
  if (!navigator.onLine) {
    saveLocalScore(body);
    enqueueScore(body);     // ADD: queue for future drain
    return;
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'submit', ...body }),
    });
  } catch {
    saveLocalScore(body);
    enqueueScore(body);     // ADD: queue for future drain
  }
}
```

### Wiring drain in App.tsx

```typescript
// App.tsx additions
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { drainQueue } from '@/lib/leaderboard'; // or sync-queue.ts

export default function App() {
  const { isOnline } = useOnlineStatus();

  // Drain on reconnect (D-08)
  useEffect(() => {
    if (isOnline) {
      drainQueue();
    }
  }, [isOnline]);

  return (
    <HashRouter>
      {!isOnline && <OfflineIndicator />}     {/* ADD */}
      <AudioProvider>
        <DataProvider>
          <SessionProvider>
          <Routes>
            {/* ... existing routes ... */}
          </Routes>
          </SessionProvider>
        </DataProvider>
      </AudioProvider>
    </HashRouter>
  );
}
```

### Offline message in GameIntro (D-11)

```typescript
// GameIntro.tsx — add after start button or in brief panel
// Import useOnlineStatus (or receive as prop)
const { isOffline } = useOnlineStatus();

// In the JSX, after the start button:
{isOffline && (
  <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
    <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
    <p className="text-xs font-medium text-amber-800">
      Connectivity required for leaderboard — scores will sync later
    </p>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scores silently lost on network failure | Queued locally, drained on reconnect | This phase | No data loss during offline play |
| No user feedback when offline | Amber banner + game start message | This phase | User knows their scores are safe |

**No deprecated/outdated patterns relevant.** This phase introduces new functionality, not migration from old.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `crypto.randomUUID()` available in all target browsers | Don't Hand-Roll | Very low — project targets modern browsers (Chrome 92+, etc.) |
| A2 | `navigator.onLine` check before fetch is acceptable UX | Code Examples | Low — D-01 accepts this limitation. Online-but-unreachable falls to catch handler. |
| A3 | Amber TailwindCSS v4 palette classes (`amber-50`, `amber-300`, `amber-800`) exist without config | Standard Stack | Very low — TailwindCSS v4 ships full palette by default |

## Open Questions

1. **Where should `APPS_SCRIPT_URL` be accessible from for drain?**
   - What we know: Currently private const in `leaderboard.ts`. `drainQueue()` needs it.
   - What's unclear: Extract to shared config module vs. pass as parameter vs. add drain logic to `leaderboard.ts`
   - Recommendation: Add `drainQueue()` to `leaderboard.ts` where `APPS_SCRIPT_URL` is already scoped. Simplest, no refactoring.

2. **Does `drainQueue()` need to handle HTTP 4xx/5xx differently from network errors?**
   - What we know: D-09 says "remove on success" — implies only 2xx is success.
   - What's unclear: Should 4xx (bad request) remove the item or keep it? 4xx likely means payload format mismatch — will never succeed on retry.
   - Recommendation: Remove on 2xx only. Keep on 4xx/5xx. This is the per-item behavior described in D-09.

3. **How does `drainQueue()` handle page navigations mid-drain?**
   - What we know: Drain is async sequential POSTs. If user navigates away, in-flight fetch continues but subsequent items won't be processed.
   - What's unclear: Should drain be abortable?
   - Recommendation: No abort needed. The incomplete items remain in queue (not yet removed) and will drain on next `window.online` event.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — all logic is client-side, no new tools required).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest + @testing-library/react |
| Config file | Embedded in `vite.config.ts` |
| Quick run command | `cd app && npx vitest run --reporter=verbose src/__tests__/offline-queue.test.ts 2>&1` |
| Full suite command | `cd app && npx vitest run 2>&1` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OFFLINE-01 | Offline indicator renders when `navigator.onLine = false` | Component | `npx vitest run src/__tests__/offline-indicator.test.tsx 2>&1` | ❌ Wave 0 |
| OFFLINE-01 | Offline indicator hidden when `navigator.onLine = true` | Component | `npx vitest run src/__tests__/offline-indicator.test.tsx 2>&1` | ❌ Wave 0 |
| OFFLINE-02 | `enqueueScore()` writes to `atlas-explorer-sync-queue` | Unit | `npx vitest run src/__tests__/sync-queue.test.ts 2>&1` | ❌ Wave 0 |
| OFFLINE-02 | `drainQueue()` POSTs each item sequentially, removes on success | Integration | `npx vitest run src/__tests__/sync-queue.test.ts 2>&1` | ❌ Wave 0 |
| OFFLINE-02 | `drainQueue()` no-op when `isConfigured()` false | Unit | `npx vitest run src/__tests__/sync-queue.test.ts 2>&1` | ❌ Wave 0 |
| OFFLINE-02 | Queue items survive page reload (localStorage persistence) | Integration | `npx vitest run src/__tests__/sync-queue.test.ts 2>&1` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd app && npx vitest run --changed 2>&1`
- **Per wave merge:** `cd app && npx vitest run 2>&1`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/offline-indicator.test.tsx` — covers OFFLINE-01 (component render conditions)
- [ ] `src/__tests__/sync-queue.test.ts` — covers OFFLINE-02 (queue CRUD, drain, gate, persistence)
- Framework already installed (vitest + @testing-library/react present in `package.json`)

## Security Domain

> `security_enforcement` is not explicitly `false` in config — default enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in this phase |
| V3 Session Management | no | No session changes |
| V4 Access Control | no | No access control changes |
| V5 Input Validation | no | Payloads already validated by leaderboard.ts type system |
| V6 Cryptography | no | No encryption in this phase |

### Known Threat Patterns for React + localStorage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| localStorage manipulation via XSS | Tampering | No user data in queue. Queue items are score payloads — no session tokens. Existing CSP in build pipeline covers XSS. |
| Queue data loss on localStorage clear | — | Acceptable risk. User clearing site data loses queued scores. Same risk as existing `atlas-explorer-local-leaderboard`. Not mitigated. |

## Sources

### Primary (HIGH confidence)
- [MDN: Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) — offline detection API
- [MDN: crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) — unique ID generation
- [MDN: Window online/offline events](https://developer.mozilla.org/en-US/docs/Web/API/Window/online_event) — event-based detection
- Codebase: `leaderboard.ts`, `useSession.ts`, `App.tsx`, `GameIntro.tsx` — all integration points verified by reading source

### Secondary (MEDIUM confidence)
- TailwindCSS v4 docs: Color palette `amber-*` classes — confirmed via TailwindCSS v4 docs on default palette. [CITED: tailwindcss.com/docs/colors]

### Tertiary (LOW confidence)
- None — all core claims backed by MDN docs or codebase reading.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in package.json, no new deps needed
- Architecture: HIGH — all integration points verified by source code reading
- Pitfalls: HIGH — based on documented edge cases of `navigator.onLine` + async localStorage

**Research date:** 2026-05-21
**Valid until:** 2026-06-21 (stable codebase, no fast-moving deps)
