# CONCERNS.md — Technical Debt, Risks & Areas of Concern

**Date:** 2026-05-20

## Critical Issues

### 1. Apps Script Backend Unconfigured

**File:** `app/src/lib/leaderboard.ts:4`

```ts
const APPS_SCRIPT_URL = ''; // Paste your deployed Apps Script /exec URL here
```

**Risk:** HIGH. Leaderboard, badge persistence, and score submission all fall back to `localStorage`. Deployed app has no persistent backend — data is per-device and lost on cache clear.

### 2. No Component-Level Tests

`@testing-library/react` v16 is installed but zero component tests exist. Only pure logic in `lib/` is tested. Complex interactive components (`InteractiveMap.tsx`, `CodeDrop.tsx`, `GameShellPage.tsx`) have zero test coverage.

## Medium Concerns

### 3. Widespread useEffect Dependency Suppressions

29 instances of `// eslint-disable-line react-hooks/exhaustive-deps` across codebase. This pattern suppresses React's dependency checker, which can mask stale closure bugs.

**Files affected:** `CodeDrop.tsx`, `PinRush.tsx`, `CityStack.tsx`, `ResultsPage.tsx`, `PassInterstitial.tsx`, `FailInterstitial.tsx`, `TrainingCompletePage.tsx`, `MapExplorerPage.tsx`, `TrainerDashboard.tsx`

### 4. ESLint React Hooks Rules Mostly Disabled

6 strict-mode hooks rules explicitly turned OFF. Indicates intentional choice to bypass React 19's recommended practices for convenience.

### 5. as any Type Casts in Tests

5 instances in `session.test.ts` for testing legacy migration paths. Acceptable for migration testing, but indicates missing type-safe test utilities.

### 6. SVG Map Embedded via dangerouslySetInnerHTML

**File:** `app/src/components/map/InteractiveMap.tsx:499`

```tsx
dangerouslySetInnerHTML={{ __html: svgContent ?? '' }}
```

The SVG is fetched from local file (`/maps/north-america.svg`), so injection risk is low. Still flags as a security pattern concern.

### 7. console.error / console.warn as Error Handling

Multiple catch blocks use `console.error` or `console.warn` as their only error handling (no user-facing error UI, no error tracking service):

- `useData.tsx:50` — network fetch failure silently logged
- `InteractiveMap.tsx:185` — SVG fetch failure
- `useAudio.tsx:212` — sound playback failure
- `ExpeditionReport.tsx:56` — report data fetch
- `WaveLeaderboardWidget.tsx:53` — leaderboard fetch
- `StateOutline.tsx:62` — SVG outline fetch
- `TrainingCompletePage.tsx:68` — data fetch

## Low Concerns

### 8. Large Component Files

- `InteractiveMap.tsx`: 609 lines — handles pan/zoom/pinch/drag/region interactions + SVG rendering + keyboard accessibility
- `MapExplorerPage.tsx`: ~800 lines — training page with tour system, state panel, sound, particle effects
- `CodeDrop.tsx`: 535 lines — entire game with animation loop, input handling, and complex state

### 9. Magic Numbers and Hardcoded Values

- `TOTAL_REGIONS = 64` in `session.ts:12` (magic number for US + CA regions)
- `TOTAL_QUESTIONS = 20`, `TIMEZONE_Q_COUNT = 3`, `FALL_DURATION_MS = 18000` in `crack-the-code.ts`
- Timezone questions spliced at positions `[5, 10, 15]` in `crack-the-code.ts:49`

### 10. No Error Boundary

No React Error Boundary component detected. Any render crash will white-screen the app.

### 11. Vite Server Log Files Not Gitignored

Multiple `vite.*.log` files in `app/` root. These are build artifacts and should be in `.gitignore`.

### 12. Graphify Knowledge Graph Present

`graphify-out/` directory contains 347 nodes / 413 edges / 57 communities. Useful for code intelligence but adds ~1.7M words of corpus data to repo.

## Summary

| Area | Risk | Action Needed |
|------|------|---------------|
| Apps Script URL | HIGH | Configure backend or remove fallback code |
| Component tests | HIGH | Add tests for interactive features |
| useEffect deps | MEDIUM | Audit and fix dependency arrays |
| Error handling | MEDIUM | Add user-facing error states |
| Error boundaries | MEDIUM | Add React error boundary |
| Build artifacts | LOW | Gitignore log files |
| Large components | LOW | Consider splitting |
