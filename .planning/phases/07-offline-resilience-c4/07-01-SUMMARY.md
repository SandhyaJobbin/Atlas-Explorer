---
phase: "07"
plan: "01"
subsystem: "offline-resilience"
tags: [offline, network, indicator, banner]
requires: []
provides: [offline-indicator]
affects: [App.tsx]
tech-stack:
  added:
    - useOnlineStatus hook (navigator.onLine + events)
  patterns:
    - Conditional render based on online/offline state
key-files:
  created:
    - app/src/hooks/useOnlineStatus.ts
    - app/src/components/OfflineIndicator.tsx
    - app/src/__tests__/offline-indicator.test.tsx
  modified:
    - app/src/App.tsx
decisions:
  - OfflineIndicator renders null when online (no DOM overhead)
  - Hook returns both isOnline/isOffline for caller flexibility
  - Amber color scheme matches warning semantics (not error red)
metrics:
  duration: ~5 min
  completed_date: "2026-05-21"
---

# Phase 07 Plan 01: Offline Indicator Summary

Offline indicator vertical slice — amber banner with WifiOff icon when network drops. TDD-driven: test first, implement, wire into App.tsx.

## Files Created

### `app/src/hooks/useOnlineStatus.ts`
Tracks `navigator.onLine`, subscribes to `online`/`offline` events. Returns `{ isOnline, isOffline }`.

### `app/src/components/OfflineIndicator.tsx`
Amber banner (`bg-amber-50`, `border-amber-300`) fixed at viewport top, z-50. Shows `WifiOff` icon + "You're offline — scores will sync when reconnected". Returns `null` when online.

### `app/src/__tests__/offline-indicator.test.tsx`
4 tests — nothing when online, amber banner when offline, WifiOff icon present, amber background class.

### `app/src/App.tsx` (modified)
Added `OfflineIndicator` inside `HashRouter`, immediately before `AudioProvider`. Visible on all routes.

## Test Results

All 89 tests pass (10 suites), including 4 new offline-indicator tests. Zero regressions.

## Deviations

None — plan executed as written.

## Commits

| Hash | Message |
|------|---------|
| 6e50f1e | test(07-01): add failing test for offline indicator |
| caee59f | feat(07-01): implement offline indicator hook and component |
| 9ebd7e1 | feat(07-01): wire OfflineIndicator into App.tsx |
