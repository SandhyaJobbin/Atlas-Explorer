# ARCHITECTURE.md — System Architecture

**Date:** 2026-05-20

## Overview

Single-page application (SPA) for geography education. Users train by exploring a map of US states/Canadian provinces, then play 3 games to test knowledge. Progression is session-based with scoring, badges, and leaderboard.

## Architecture Pattern

**Layered SPA with Context-driven state management:**

```
Public/ (static assets)
  └─ data/     (states.json, cities.json, batches.json)
  └─ maps/     (north-america.svg)
  └─ sfx/      (audio MP3)
  └─ assets/   (images, icons, stickers)

src/
  ├─ main.tsx               — Entry point
  ├─ App.tsx                — Router + provider composition
  ├─ hooks/                 — Context providers + custom hooks
  ├─ components/            — Reusable UI (layout, map, ui)
  ├─ features/              — Page-level feature components
  ├─ lib/                   — Pure business logic (no React)
  ├─ types/                 — TypeScript type definitions
  └─ __tests__/             — Unit tests
```

## Key Abstractions

### Entry Flow

```
/main.tsx → <App/>
  ├─ <HashRouter>                        — Client-side routing (#/ paths)
  │  ├─ <AudioProvider>                  — Sound playback context
  │  ├─ <DataProvider>                   — State data fetching/caching
  │  ├─ <SessionProvider>                — Game session state machine
  │  │  ├─ / → <LandingPage/>            — Name/wave input, session creation
  │  │  ├─ /train/map → <MapExplorerPage/>   — SVG map exploration (training)
  │  │  ├─ /train/complete → <TrainingCompletePage/>  — Training done
  │  │  ├─ /play → <GameShellPage/>      — Game state machine (intro→play→pass/fail→review)
  │  │  ├─ /play/results → <ResultsPage/>  — Final results + expedition report
  │  │  └─ /trainer → <TrainerDashboard/>  — Instructor view (wave management)
```

### Session State Machine

Managed by `useSession` hook (`hooks/useSession.ts`):

```
Session → Training (map explorer)
  ├─ Explore all 64 regions → training.completed = true
  │
  └─ Games (played sequentially)
       └─ per-game state machine:
            Game 0: Crack the Code / CodeDrop (state code + timezone)
            Game 1: Pin It! / PinRush (click state on map by timezone)
            Game 2: City Sorter / CityStack (sort cities by region)
              │
              ├─ Intro → Playing → Pass Interstitial → Next Game
              │                    → Fail Interstitial → Retry
              │
              └─ All passed → Review Round (optional) → Results
```

### Game Shell State Machine

`GameShellPage.tsx` uses `useReducer` with phases:
- `intro` — game description + start button
- `playing` — active game component (CodeDrop/PinRush/CityStack)
- `pass` — pass interstitial (score, new badges, continue)
- `fail` — fail interstitial (retry option)
- `review` — review round for mistake codes

### Data Flow

```
Static JSON → fetch() → DataProvider (Context) → Components
Session      → useSession (Context) → localStorage ← Pure lib functions
Leaderboard  → fetch() → Apps Script OR localStorage ← Pure lib functions
Audio        → AudioProvider (Context) → Web Audio API or MP3
```

## Core Business Logic (`app/src/lib/`)

All pure functions, no React dependencies:

| Module | Responsibility |
|--------|---------------|
| `session.ts` | CRUD for session, game attempts, training tracking, rank logic |
| `scoring.ts` | Pass threshold (70%), star calculation, points calculation |
| `badges.ts` | Evaluate 8 badge conditions after a passing attempt |
| `leaderboard.ts` | Score submission, leaderboard query (local or remote) |
| `crack-the-code.ts` | Question generation, answer checking for CodeDrop |
| `pin-it.ts` | Question generation for PinRush |
| `city-sorter.ts` | Question generation for CityStack |
| `timezones.ts` | Timezone color/fill maps |
| `assets.ts` | Asset path resolution via `import.meta.env.BASE_URL` |
| `game-route.ts` | Game index clamping/resolution from URL params |
| `exploration-trail.ts` | Trail animation for map exploration |
| `flow-ui.ts` | Flow UI helper logic |
| `region-of-day.ts` | Daily region selection |
| `trainer-report.ts` | Trainer dashboard report generation |
| `tz-sorter.ts` | Timezone sort helpers |

## Routing Strategy

Uses `HashRouter` (not BrowserRouter) due to GitHub Pages deployment. Paths are `#/`, `#/train/map`, `#/play`, etc.

Route guards:
- `TrainingGuard` — requires session in localStorage (or `demo=` hash override)
- `PlayGuard` — requires completed training (or `game=`/`debug=` hash override)
