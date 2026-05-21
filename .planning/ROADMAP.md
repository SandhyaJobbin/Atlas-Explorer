# Roadmap: Atlas Explorer — Polish and Completion Milestone

## Overview

This milestone is a brownfield polish-and-completion pass on an existing geography-education SPA. It fixes approximately 20 UI/UX bugs across 7 screens and finishes the 6 remaining V3 plan features (C2, C3, C4, C5, D1, D2). The map must render correctly before any game logic is fixed; DataProvider consolidation (D2) must precede offline resilience (C4) — these are the two hard ordering constraints that drive the entire phase sequence.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: SVG and Map Viewport Fixes** - Patch SVG viewBox, reconcile DC mismatch, TOTAL_REGIONS constant, full Canada visibility
- [ ] **Phase 2: Map Interaction and Z-Index Fixes** - Stable selection, hover debounce, flicker removal, z-index stacking, waypoints
- [ ] **Phase 3: DataProvider Consolidation (D2)** - Migrate CodeDrop and PinRush off independent fetches to useData()
- [ ] **Phase 4: GameEvents Emitter and GameState Context (D1)** - Unified live game state via mitt emitter, GameStateProvider
- [ ] **Phase 5: Review Round Ordering and Leitner Loop (C2)** - Most-missed-first sort, 2-bucket Leitner loop, mistakeWeights
- [ ] **Phase 6: Dynamic Difficulty (C5)** - Accuracy-weighted question pools on retry, session-scoped weights
- [ ] **Phase 7: Offline Resilience (C4)** - Offline indicator, leaderboard sync queue, drain on reconnect
- [ ] **Phase 8: Navigation, Results, and Action Hub (C3)** - Resume Expedition routing, unified results page, What's Next hub, landing fixes, CodeDrop legend/single-select fixes

## Phase Details

### Phase 1: SVG and Map Viewport Fixes
**Goal**: The complete North America map — including Canada — renders correctly on every screen, and training can be completed by visiting all 63 explorable regions
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04, GAMEPLAY-01
**Success Criteria** (what must be TRUE):
  1. On the Discover North America start screen, MapExplorer, and Pin It screens, Canada is fully visible — no cropping at any browser zoom
  2. A player who visits exactly 63 non-DC regions sees the training-complete screen, not a stuck 63/64 counter
  3. Map waypoint/pointer markers appear within the visible map bounds on all screens
  4. The SVG renders at the correct aspect ratio on Chrome, Firefox, and Safari at 100% zoom (no width/height attribute override)
**Plans**: 01-01 (SVG ViewBox Fix), 01-02 (DC Reconciliation), 01-03 (Waypoint Verification)
**UI hint**: yes

### Phase 2: Map Interaction and Z-Index Fixes
**Goal**: Map interactions are stable and the full control surface is accessible — no flicker, no obscured buttons, no border pop
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: INTERACT-01, INTERACT-02, INTERACT-03, INTERACT-04, INTERACT-05, INTERACT-06, INTERACT-07, INTERACT-08
**Success Criteria** (what must be TRUE):
  1. Clicking a state or province produces a stable highlight — the border does not pop in and revert on the first click
  2. Hovering over small states (RI, DE, DC) shows a popup that appears once and stays — no rapid repeated flicker
  3. The map explorer and Pin It game screens show no per-second visual flicker during gameplay
  4. The Atlas Passport button, zoom in/out controls, and the button obscured by Wave Standings are all visible and clickable without overlap
**Plans**: 3 plans
**UI hint**: yes
**Plans:**
- [ ] 02-01-PLAN.md — Selection pop-in + hover flicker fix (Effect B classList diff + Effect A hover simplification)
- [ ] 02-02-PLAN.md — Per-second flicker fix (Effect B dep audit + split into per-concern effects)
- [ ] 02-03-PLAN.md — Z-index layout overlap fix (zoom controls, Atlas Passport, Expedition Status z-values)

### Phase 3: DataProvider Consolidation (D2)
**Goal**: All game components consume states data from a single shared DataProvider context — no independent per-component fetches of states.json remain
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: ARCH-01
**Success Criteria** (what must be TRUE):
  1. CodeDrop and PinRush use useData() instead of their own fetch() calls — confirmed by removing the independent useEffect fetches
  2. states.json is fetched exactly once per session regardless of which games are played or in what order
  3. All three games still generate their question sets correctly after the migration
**Plans**: TBD

### Phase 4: GameEvents Emitter and GameState Context (D1)
**Goal**: Live in-game score and streak are available to the top bar via a shared context, replacing prop-drilling, with no change to the final score submission path
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: ARCH-02
**Success Criteria** (what must be TRUE):
  1. GameTopBar displays live score and streak during all three games without receiving them as props from GameShellPage
  2. The game-completion path (onComplete with final GameResult) still fires and persists scores to session/localStorage exactly as before
  3. Navigating away from games and returning resets the live state cleanly — no stale streak or score from a previous game
**Plans**: TBD

### Phase 5: Review Round Ordering and Leitner Loop (C2)
**Goal**: The review round surfaces the player's worst-performing regions first and loops until every mistake is resolved
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: LEARN-01
**Success Criteria** (what must be TRUE):
  1. The review round presents regions ordered by most-missed first — a region answered wrong twice appears before one answered wrong once
  2. After correctly answering all reviewed regions once, any region that was in bucket-0 (not yet resolved) is presented again rather than ending the review prematurely
  3. The review round never falsely reports "no mistakes" when mistakes exist — DC codes and any other unresolvable entries are handled defensively
**Plans**: TBD

### Phase 6: Dynamic Difficulty (C5)
**Goal**: On retry attempts, game question pools are weighted toward regions the player has historically missed, using per-session accuracy data
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: LEARN-02
**Success Criteria** (what must be TRUE):
  1. On a retry attempt, regions with higher mistake counts appear more frequently in question pools for CodeDrop, PinRush, and CityStack
  2. On a first attempt (non-retry), question selection is identical to current behavior — no regression
  3. All existing picker unit tests (crack-the-code.test.ts, pin-it.test.ts, city-sorter.test.ts) pass with the weights parameter absent
**Plans**: TBD

### Phase 7: Offline Resilience (C4)
**Goal**: Players see an offline indicator when connectivity drops, and leaderboard scores are not silently lost — they queue locally and sync automatically on reconnect
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: OFFLINE-01, OFFLINE-02
**Success Criteria** (what must be TRUE):
  1. When the network connection drops, a visible offline indicator appears in the UI within one second
  2. Completing a game while offline stores the score locally — the player is not shown an error, and the score appears on the leaderboard once connectivity is restored
  3. Queued scores are drained automatically when the connection returns — no manual action required from the player
**Plans**: 2 plans

**Plans:**
- [x] 07-01-PLAN.md — Offline detection + indicator vertical slice (hook, component, App.tsx wire)
- [x] 07-02-PLAN.md — Score queue + drain + game message vertical slice (sync-queue, enqueue, drain, GameIntro)

### Phase 8: Navigation, Results, and Action Hub (C3)
**Goal**: Players can navigate the app correctly from every screen, see a unified expedition summary, take action after results, and the landing page renders at 100% zoom
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: LAND-01, LAND-02, NAV-01, NAV-02, RESULTS-01, RESULTS-02, GAMEPLAY-02, GAMEPLAY-03
**Success Criteria** (what must be TRUE):
  1. On the Resume Expedition screen, the Train button opens map training and the Play button opens the games — both route correctly
  2. After completing all games, a unified expedition results page shows aggregated outcomes across Discover North America, Crack the Code, Pin It, and Tz Sorter
  3. The "What's Next?" action hub is visible above the fold on the results page and offers retry, compare, review, and journal actions
  4. The "Begin your Expedition" CTA on the landing page is fully visible at 100% browser zoom with no overflow or blank background
  5. In Crack the Code, the map reference legend stays inside map bounds and only one timezone answer can be selected and accepted
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. SVG and Map Viewport Fixes | 3/3 | Complete | 2026-05-21 |
| 2. Map Interaction and Z-Index Fixes | 0/3 | Planned | - |
| 3. DataProvider Consolidation (D2) | 1/1 | Complete | 2026-05-21 |
| 4. GameEvents Emitter and GameState Context (D1) | 0/TBD | Not started | - |
| 5. Review Round Ordering and Leitner Loop (C2) | 0/TBD | Not started | - |
| 6. Dynamic Difficulty (C5) | 0/TBD | Not started | - |
| 7. Offline Resilience (C4) | 2/2 | Complete | 2026-05-21 |
| 8. Navigation, Results, and Action Hub (C3) | 4/4 | Complete | 2026-05-21 |

---
*Roadmap created: 2026-05-20*
*Last updated: 2026-05-20 after initial creation*
