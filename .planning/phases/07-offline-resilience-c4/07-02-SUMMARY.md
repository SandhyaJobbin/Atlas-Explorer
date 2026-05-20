---
phase: 07-offline-resilience-c4
plan: 07-02
name: Sync Queue + Drain + GameIntro Offline Message
wave: 2
subsystem: leaderboard, connectivity
tags:
  - offline
  - queue
  - sync
  - leaderboard
requires: [07-01]
provides:
  - offline-score-queue
  - auto-drain-on-reconnect
  - game-intro-offline-indicator
affects:
  - app/src/lib/leaderboard.ts
  - app/src/App.tsx
  - app/src/features/games/GameIntro.tsx
tech-stack:
  added:
    - localStorage-based queue for score persistence
  patterns:
    - sequential drain on reconnect (no concurrent flush)
    - online/offline event bridging via useEffect
key-files:
  created:
    - app/src/lib/sync-queue.ts
    - app/src/__tests__/sync-queue.test.ts
  modified:
    - app/src/lib/leaderboard.ts
    - app/src/App.tsx
    - app/src/features/games/GameIntro.tsx
metrics:
  duration: 8m
  completed-date: 2026-05-21
decisions: []
---

# Phase 07 Plan 02: Sync Queue + Drain + GameIntro Offline Message

Score queue and drain with localStorage persistence, wired into leaderboard fallback paths, auto-drain on reconnect, and offline notification on game start screen.

## Completed Tasks

| Task | Type | Name | Commit | Files |
|------|------|------|--------|-------|
| 1 | RED | Write sync-queue test (7 cases) | 9089b9e | `app/src/__tests__/sync-queue.test.ts` |
| 2 | GREEN | Create sync-queue.ts | 4b47ab7 | `app/src/lib/sync-queue.ts` |
| 3 | GREEN | Integrate into leaderboard.ts, App.tsx, GameIntro.tsx | 2b88195 | `app/src/lib/leaderboard.ts`, `app/src/App.tsx`, `app/src/features/games/GameIntro.tsx` |

## Implementation Details

### Task 1 — Test (RED)
Created 7 test cases for the sync queue module:
1. Writes to correct localStorage key
2. `getQueueLength` returns accurate count
3. Items have `{payload, queuedAt, id}` shape (ISO string, UUID)
4. Queue survives page reload (re-read from storage)
5. `drainQueue` POSTs items sequentially, clears on success
6. `drainQueue` preserves items on fetch failure
7. `drainQueue` no-op when URL is empty

### Task 2 — sync-queue.ts (GREEN)
Exported three functions:
- `enqueueScore(payload)` — append to localStorage queue with metadata
- `getQueueLength()` — read queue length from storage
- `drainQueue(appsScriptUrl?)` — sequential POST, retry-keeps on failure, early-return on empty/missing URL

### Task 3 — Integration (GREEN)
**leaderboard.ts:**
- Imported `enqueueScore` and `drainQueue` (renamed to avoid clash)
- `submitAttemptScore`: enqueue on `!isConfigured()`, `!navigator.onLine`, and catch paths
- Exported `drainQueue()` wrapper passing `APPS_SCRIPT_URL`

**App.tsx:**
- Added `useEffect` that calls `drainQueue()` when `isOnline` transitions to `true` (skips first render via `useRef`)

**GameIntro.tsx:**
- Shows amber offline banner with `WifiOff` icon and message when `isOffline` is true
- Banner placed between start button and dot-progress navigation

## Verification

All 96 tests pass across 11 test files:
```
✓ pin-it.test.ts        (5 tests)
✓ badges.test.ts        (12 tests)
✓ crack-the-code.test.ts (8 tests)
✓ scoring.test.ts       (14 tests)
✓ session.test.ts       (25 tests)
✓ sync-queue.test.ts    (7 tests)  ★ this plan
✓ offline-indicator.test.tsx (4 tests)
✓ city-sorter.test.ts   (6 tests)
✓ flow-ui.test.ts       (7 tests)
✓ leaderboard.test.ts   (4 tests)
✓ game-route.test.ts    (4 tests)
```

## TDD Gate Compliance

Commit sequence verified:
1. `9089b9e` — `test(07-02): add failing test for sync queue` (RED gate) ✓
2. `4b47ab7` — `feat(07-02): implement sync queue...` (GREEN gate) ✓
3. `2b88195` — `feat(07-02): integrate sync queue...` (integration) ✓

## Deviations from Plan

None. Plan executed as written.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints or auth paths introduced.

## Self-Check: PASSED

- `app/src/__tests__/sync-queue.test.ts` — FOUND
- `app/src/lib/sync-queue.ts` — FOUND
- Commit `9089b9e` — FOUND
- Commit `4b47ab7` — FOUND
- Commit `2b88195` — FOUND
