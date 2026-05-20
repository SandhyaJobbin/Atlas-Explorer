# Discussion Log: Phase 7 — Offline Resilience (C4)

**Date:** 2026-05-21
**Phase:** 7 — Offline Resilience (C4)
**Status:** Context captured, ready for planning

## Areas Discussed

### 1. Offline Detection Mechanism
- **Options presented:** Browser events only (simple), Hybrid (browser + fetch), Heartbeat ping
- **Selection:** Browser events only — `navigator.onLine` + `online`/`offline` events
- **Notes:** Existing `catch → saveLocalScore` remains independent for server-unreachable case. Indicator and queue enqueue decoupled.

### 2. Indicator Placement + Design
- **Options presented:** Persistent top banner, Dismissible toast, Subtle badge
- **Selection:** Persistent top banner, full-width, yellow/amber, `WifiOff` icon
- **Notes:** "You're offline — scores will sync when reconnected". Always visible while offline, not dismissible.

### 3. Queue Persistence + Drain Strategy
- **Q1 — Queue storage:** Separate localStorage key vs sync flag on existing scores
  - **Selection:** Separate key `atlas-explorer-sync-queue`
- **Q2 — Drain trigger:** online event only vs on mount vs focus
  - **Selection:** `window.online` event only
- **Q3 — Deduplication:** Per-item sequential vs idempotency key vs batch
  - **Selection:** Per-item sequential POST, remove on success
- **APPS_SCRIPT_URL gate:** Drain is no-op when `isConfigured()` is false
- **Game start message:** Show gentle message when offline, don't block gameplay

### 4. Scope Boundary Check
- **Confirmed out of scope:** Service Worker, PWA shell cache, IndexedDB migration, map tile caching
- **Added:** Gentle game-start offline message (don't block gameplay)

## Decisions Summary

| ID | Decision |
|----|----------|
| D-01 | navigator.onLine + online/offline events for indicator |
| D-02 | Fetch catch remains independent for queue enqueue |
| D-03 | Persistent top banner, amber, WifiOff icon |
| D-04 | Lucide WifiOff + "You're offline — scores will sync when reconnected" |
| D-05 | Always visible while offline, not dismissible |
| D-06 | Separate localStorage key `atlas-explorer-sync-queue` |
| D-07 | Queue items: `{payload, queuedAt, id}` |
| D-08 | Drain on `window.online` only |
| D-09 | Per-item sequential POST, remove on success |
| D-10 | Drain no-op when `isConfigured()` false |
| D-11 | Gentle game-start offline message, no gameplay block |

## Deferred Ideas
None — discussion stayed within phase scope.
