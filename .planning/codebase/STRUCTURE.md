# STRUCTURE.md — Directory Layout

**Date:** 2026-05-20

## Top-level

```
AMZ/
├── app/                          — Main application (React SPA)
│   ├── src/                      — All source code
│   ├── public/                   — Static assets (served as-is)
│   ├── scripts/                  — Node scripts (Playwright screenshots)
│   ├── vite.config.ts            — Vite config
│   ├── tsconfig*.json            — TypeScript configs
│   ├── eslint.config.js          — ESLint config
│   └── index.html                — HTML entry point
├── apps-script/                  — Google Apps Script backend skeleton
│   └── Code.gs
├── .github/workflows/deploy.yml  — CI/CD deploy pipeline
├── docs/                         — Documentation
├── graphify-out/                 — Code graph output
├── .planning/                    — GSD planning artifacts
└── package.json                  — Root scripts (dev, test orchestrator)
```

## Source Code (`app/src/`)

```
src/
├── main.tsx                            — App entry (createRoot + StrictMode)
├── App.tsx                             — Router + context providers + route guards
├── App.css                             — Global styles
├── index.css                           — TailwindCSS imports + base styles
├── test-setup.ts                       — Vitest setup file
│
├── types/
│   └── index.ts                        — All TypeScript interfaces/types
│       (StateEntry, Session, GameState, GameAttempt,
│        TrainingProgress, BadgeDef, LeaderboardRow, etc.)
│
├── hooks/
│   ├── useSession.ts                   — Session context + state management
│   ├── useData.tsx                     — States data fetching + caching
│   ├── useAudio.tsx                    — Audio playback context
│   └── useSessionTimer.ts              — Session countdown timer
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx               — App shell (header, content area)
│   │   ├── GameTopBar.tsx              — Game HUD (score, level, streak)
│   │   ├── TrainingTopBar.tsx          — Training mode header
│   │   ├── PlayerAvatar.tsx            — Player avatar display
│   │   └── WaveLeaderboardWidget.tsx   — Sidebar leaderboard widget
│   │
│   ├── map/
│   │   ├── InteractiveMap.tsx          — SVG map with pan/zoom/click (core component)
│   │   ├── StateOutline.tsx            — Single state outline SVG
│   │   ├── StateTile.tsx               — Grid tile for state
│   │   └── StateInfoPanel.tsx          — State detail info panel
│   │
│   └── ui/
│       ├── AnimatedCard.tsx            — Animated card wrapper
│       ├── InfoCard.tsx                — State information card
│       ├── LottiePlayer.tsx            — Lottie animation player
│       ├── ParticleSystem.tsx          — Particle effect system
│       ├── RollingNumber.tsx           — Animated number counter
│       ├── ScorePopup.tsx              — Score popup animation
│       ├── StampBadge.tsx              — Badge stamp display
│       ├── StreakMeter.tsx             — Streak indicator
│       ├── Typewriter.tsx              — Typewriter text effect
│       └── VolumeControl.tsx           — Audio volume slider
│
├── features/
│   ├── landing/
│   │   └── LandingPage.tsx             — Session creation form
│   │
│   ├── training/
│   │   ├── MapExplorerPage.tsx         — SVG map exploration (training mode)
│   │   ├── QuickCheck.tsx              — Quick quiz after region click
│   │   └── TrainingCompletePage.tsx    — Training completion screen
│   │
│   ├── games/
│   │   ├── GameShellPage.tsx           — Game state machine (useReducer)
│   │   ├── GameIntro.tsx               — Pre-game intro screen
│   │   ├── CodeDrop.tsx                — Game 1: type state codes + timezone select
│   │   ├── PinRush.tsx                 — Game 2: click regions by timezone
│   │   ├── CityStack.tsx               — Game 3: sort cities into regions
│   │   ├── ReviewRound.tsx             — Post-game mistake review
│   │   ├── PassInterstitial.tsx        — Pass results screen
│   │   └── FailInterstitial.tsx        — Fail/retry screen
│   │
│   ├── results/
│   │   ├── ResultsPage.tsx             — Final results page
│   │   ├── ExpeditionReport.tsx        — Detailed expedition report
│   │   └── CheatSheet.tsx              — Reference cheatsheet
│   │
│   └── trainer/
│       └── TrainerDashboard.tsx        — Instructor dashboard
│
├── lib/                                — Pure business logic (no React)
│   ├── session.ts                      — Session CRUD, game attempts, rank
│   ├── scoring.ts                      — Pass threshold, stars, points
│   ├── badges.ts                       — Badge evaluation (8 badge types)
│   ├── leaderboard.ts                  — Score submission + leaderboard query
│   ├── crack-the-code.ts               — CodeDrop question generation
│   ├── pin-it.ts                       — PinRush question generation
│   ├── city-sorter.ts                  — CityStack question generation
│   ├── timezones.ts                    — Timezone color maps
│   ├── assets.ts                       — Asset path helper
│   ├── game-route.ts                   — Game index param resolution
│   ├── exploration-trail.ts            — Map trail animation logic
│   ├── flow-ui.ts                      — Flow UI logic
│   ├── region-of-day.ts                — Daily region picker
│   ├── trainer-report.ts               — Trainer report generation
│   └── tz-sorter.ts                    — Timezone sort helpers
│
└── __tests__/                          — Vitest unit tests
    ├── scoring.test.ts                 — Scoring logic (80 lines, 7 tests)
    ├── session.test.ts                 — Session CRUD (249 lines, 18 tests)
    ├── badges.test.ts                  — Badge evaluation (108 lines, 11 tests)
    ├── crack-the-code.test.ts          — CodeDrop logic
    ├── pin-it.test.ts                  — PinRush logic
    ├── city-sorter.test.ts             — CityStack logic
    ├── flow-ui.test.ts                 — Flow UI logic
    ├── game-route.test.ts              — Game route resolution
    └── leaderboard.test.ts             — Leaderboard logic
```

## Key Naming Conventions

- **Files:** PascalCase for React components, kebab-case for utilities
- **Exports:** `default export` for page/component files, named exports for lib modules
- **Types:** PascalCase interfaces in `types/index.ts`
- **CSS:** TailwindCSS utility classes + inline `<style>` tags for animations (no CSS module files)
- **Tests:** `*.test.ts` co-located in `src/__tests__/` (not alongside source)
