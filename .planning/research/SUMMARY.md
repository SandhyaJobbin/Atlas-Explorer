# Project Research Summary

**Project:** Atlas Explorer -- Polish and Completion Milestone
**Domain:** Brownfield geography-education SPA (React 19, static GitHub Pages)
**Researched:** 2026-05-20
**Confidence:** HIGH

## Executive Summary

Atlas Explorer is a brownfield polish-and-completion pass, not a greenfield build. The codebase is a React 19 SPA deployed to GitHub Pages with three shipped games, an interactive SVG map, and a session/leaderboard system already in place. The milestone covers approximately 20 UI/UX bug fixes and six remaining V3 features (C2, C3, C4, C5, D1, D2). The single most important finding from all four research streams is that the v3-remaining-changes.md backlog doc is partially stale: ReviewRound (C2 shell) and DataProvider (D2 shell) both exist in the codebase already, and the post-results action hub (C3) tiles are substantially shipped. Every phase must audit current code state before writing new code to avoid duplicating or overwriting work that is approximately 90% complete.

Two structural problems block the entire milestone from completing correctly and must be resolved first. The primary root-cause bug is a three-way mismatch: states.json has 63 entries, the SVG has 64 atlas-region paths (including DC), and TOTAL_REGIONS = 64 in session.ts -- this makes training completion unreachable and corrupts the ReviewRound mistake queue with unresolvable DC codes. The secondary structural risk is the SVG asset swap: the candidate svg(1)/northAmerica.svg uses a completely different coordinate space vs the current map, meaning all overlay position calculations (score popups, fly-to-panel animations, waypoints) will silently break if the swap is made without a coordinate-transform audit. Patching the existing SVG viewBox to include Canada is the lower-risk path.

The recommended build sequence, derived from hard dependency chains across all four research files, is: map/SVG fixes first, then map interaction/z-index, then D2 (DataProvider consolidation), then D1 (GameEvents emitter), then C2 (ReviewRound ordering), then C5 (dynamic difficulty), then C4 (offline resilience), and finally C3/unified results. D2 must precede C4 (game data must be context-sourced before offline resilience can work) and D2 must precede C5 (question pickers need the shared states[] from context). D1 has no hard upward dependency but should follow D2 so games are in their final state before instrumentation is added.

---

## Key Findings

### Recommended Stack

The stack is fixed: React 19.2, TypeScript 6.0, Vite 8, TailwindCSS v4, react-router-dom 7 (HashRouter). Only three npm packages are needed for the entire milestone. No frameworks should be added.

New packages (install once from the app/ directory):

```bash
npm install idb@^8.0.3 ts-fsrs@^5.4.0 mitt@^3.0.1
```

**Core technologies for new features:**

- idb ^8.0.3: IndexedDB wrapper (3 KB) for C4 sync queue -- chosen over Dexie (65 KB); the app only needs a simple queue, not live-query reactivity
- ts-fsrs ^5.4.0: FSRS v6 scheduling (12 KB ESM) -- installed but reserved for future cross-session use; C2 for this milestone uses the simpler 2-bucket Leitner approach
- mitt ^3.0.1: 200-byte typed event emitter for D1 GameEvents bus -- works outside React, required for lib/ pure-function modules
- useSyncExternalStore + navigator.onLine: zero-library online/offline detection, built into React 19
- React.use(promise) + module-level stable promise: zero-library single-fetch pattern for D2

Do not add: Service Worker Background Sync (Firefox/Safari unimplemented), localForage, Dexie, RxJS, TanStack Query, d3-zoom, react-svg-pan-zoom.

See .planning/research/STACK.md for full rationale and alternatives table.

---

### Expected Features

FEATURES research confirmed that several items listed as remaining in the V3 backlog doc are already substantially built. The actual gaps are narrower than the doc implies.

**Must have (table stakes -- currently broken or missing):**

- **DC/states.json reconciliation** -- root cause of training-completion block and ReviewRound crashes; blocks every other feature from working correctly
- **SVG viewBox fix** -- Canada is cropped; map is the core product value; must render fully on all game screens
- **C4-b: Offline indicator** -- silent wifi failure looks like a bug; useOnlineStatus hook + banner is approximately 30 lines
- **C4-c: Leaderboard retry queue** -- scores silently lost on wifi drop; pending-submit queue in localStorage with drain-on-reconnect
- **C2-a: Mistake-frequency ordering** -- ReviewRound shell exists; needs sorted queue (most-missed first); 1 helper function
- **D2: DataProvider consolidation** -- CodeDrop and PinRush still fetch states.json independently; prerequisite for C4 and C5
- **Unified results page wiring** -- ExpeditionReport and cross-game loop already exist; wire game4 score in getSubmissionPayload
- **Resume Expedition routing** -- Train/Play buttons not connected; must be fixed before shipping C3 action hub

**Should have (differentiators):**

- **C2-c: Leitner 2-bucket loop** -- loop ReviewRound until all mistakes resolved; adds reviewQueue field to Session type
- **C3-b: Timezone focus tip** -- computed from mistakeCounts grouped by StateEntry.timezone; pure client-side
- **C5-a: Accuracy-weighted question pool** -- weighted region sampling on retry attempts; triggers only when isRetry === true
- **D1: GameEvents emitter + GameStateContext** -- removes prop-drilling of streak; enables live score/streak display; additive instrumentation

**Explicitly defer:**

- Full SM-2 / FSRS cross-session scheduling -- wrong abstraction for single-sitting classroom games
- Service worker PWA shell cache (C4-d) -- Workbox + HashRouter + GitHub Pages base-path is non-trivial
- Class-wide per-region difficulty heatmap (C5-b) -- requires server-side aggregation
- IndexedDB migration for session data -- no benefit over localStorage for less than 50 KB session objects

See .planning/research/FEATURES.md for full feature dependency graph and algorithm descriptions.

---

### Architecture Approach

The existing provider stack (AudioProvider > DataProvider > SessionProvider > Routes) is sound and should not be restructured. All new features are additive: new lib/ pure-function modules, new context providers scoped to the /play route subtree, and thin integrations at existing call sites. The key architectural principle is keeping ephemeral in-game live state (D1 GameStateContext) strictly separate from the durable session persistence model (SessionContext) to avoid serializing high-frequency mutable state to localStorage on every keypress.

**Major components and their changes:**

1. hooks/useData.tsx (DataProvider) -- D2: CodeDrop + PinRush migrate from independent useEffect fetch to useData(); no interface change
2. hooks/useSession.ts (SessionContext) -- add mistakeWeights: Record<string, number> as a useMemo derived field; feeds C2 sort order and C5 question weighting; zero new files needed
3. lib/game-events.ts (new) -- D1: module-level mitt emitter singleton; games emit at answer events, not on every tick
4. hooks/useGameState.tsx (new) -- D1: subscribes to gameEvents, holds live in-game state; scoped to /play route subtree only
5. lib/sync-queue.ts (new) -- C4: localStorage-backed queue; enqueue() when offline, drainQueue() on online event; no React dependency
6. features/games/ReviewRound.tsx -- C2: add useMemo sort by mistakeWeights; add Leitner bucket loop; fix null-guard in handleRegionClick
7. lib/crack-the-code.ts, lib/pin-it.ts, lib/tz-sorter.ts -- C5: add optional weights param; backward-compatible

**Anti-patterns to avoid:**

- Do not convert game useRef counters to useState -- causes re-render thrash on every keypress, breaks fall animations
- Do not mount GameStateProvider at app root -- holds ephemeral state that must reset cleanly between sessions
- Do not merge GameStateContext into SessionContext -- session is serialized to localStorage; high-frequency fields add unnecessary churn
- Do not implement C4 before D2 -- game components fetching states.json independently will fail offline

See .planning/research/ARCHITECTURE.md for full component boundary specs and data flow diagrams.

---

### Critical Pitfalls

1. **SVG coordinate-space swap breaks all overlay positions silently** -- The svg(1)/northAmerica.svg uses a different coordinate space vs the existing map. All getBBox() and getBoundingClientRect() calls positioning score popups, fly-to-panel animations, and waypoints will render off-map. **Avoidance:** Patch the existing SVG viewBox rather than swapping the asset. If the swap is made, manually verify all four map use sites (MapExplorer, PinRush, ReviewRound, ResultsPage heatmap).

2. **DC mismatch makes TOTAL_REGIONS=64 unreachable and corrupts ReviewRound** -- SVG has 64 paths including DC; states.json has 63 entries (no DC); TOTAL_REGIONS = 64. Players get stuck at 63/64 permanently. ReviewRound silently drops DC codes causing false no-mistakes display. **Avoidance:** Either add DC to states.json (~30 min), or exclude DC from SVG listener registration and set TOTAL_REGIONS = 63 (~15 min). Replace all hardcoded 64 literals with a shared constant.

3. **C4 implemented before D2 leaves game data offline-unavailable** -- DataProvider caches in sessionStorage (tab-scoped). PinRush and CodeDrop fetch independently. Wifi drop after MapExplorer but before game 1 mounts: those games show a loading spinner forever. **Avoidance:** Merge D2 before starting C4 work. This is the single hardest ordering constraint in the milestone.

4. **Effect A stale listener registration after rapid mount/unmount** -- If InteractiveMap mounts with svgCache populated but DOM not yet attached, querySelectorAll finds 0 atlas-region elements; map renders but is completely unclickable with no console errors. **Avoidance:** Add null-guard at top of Effect A checking contentRef and region count before proceeding.

5. **Z-index: zoom buttons permanently hidden behind WaveLeaderboardWidget** -- Zoom panel is absolute z-20 inside map container; leaderboard widget is fixed z-50 in root stacking context. Raising z-index on the zoom panel has no effect against a fixed ancestor. **Avoidance:** Move zoom buttons to position: fixed or lower the leaderboard z-index during map interaction.

See .planning/research/PITFALLS.md for five additional pitfalls including GC pressure from structuredClone in the training loop, shared-device C5 difficulty pollution, and SVG width/height attribute conflicts with Tailwind child selectors.

---

## Implications for Roadmap

Based on hard dependency chains and risk profiles from combined research, the recommended phase structure is:

### Phase 1: SVG and Map Viewport Fixes

**Rationale:** The map is the core product value. Every game and training flow depend on it rendering correctly and being fully clickable. The DC/TOTAL_REGIONS bug and SVG viewBox issue block everything downstream. No feature work should proceed until the map renders on all game screens.

**Delivers:** Fully rendered Canada; correct TOTAL_REGIONS constant; DC path excluded from region listeners; width/height SVG attributes removed post-injection; preserveAspectRatio set; consistent rendering across Chrome/Firefox/Safari at 100% zoom.

**Addresses:** Full North America map renders without cropping; Completing all 63 regions advances to results page

**Avoids:** Pitfall 1 (viewBox swap breaks overlays), Pitfall 2 (DC blocks training completion), Pitfall 9 (SVG width/height attr overrides CSS)

**Research flag:** Standard patterns -- no additional research needed.

---

### Phase 2: Map Interaction and Z-Index Fixes

**Rationale:** With the SVG correct, fix interaction reliability. Border pop, hover flicker, and per-second flicker produce false test failures on any subsequent feature if not resolved first.

**Delivers:** Stable border selection; hover popup debounced (100ms) on small states; per-second flicker removed; zoom controls visible and clickable over WaveLeaderboardWidget; waypoints within map bounds.

**Addresses:** State/province selection stable; Hover popups no longer flicker; Per-second flicker removed; Overlapping controls fixed

**Avoids:** Pitfall 3 (Effect A stale listeners), Pitfall 4 (stale timer/suppressed deps in PinRush), GC pressure from 64 structuredClone calls during training exploration

**Research flag:** Standard patterns.

---

### Phase 3: D2 -- DataProvider Consolidation

**Rationale:** CodeDrop and PinRush must consume useData() instead of fetching states.json independently. Hard prerequisite for C4 (game data offline) and C5 (consistent states[] for weighted pickers). CityStack is the reference implementation; migration is mechanical.

**Delivers:** Single states.json fetch per session; all game components share the DataProvider context; independent fetch calls removed from CodeDrop and PinRush.

**Addresses:** D2 V3 feature; prerequisite for C4 and C5

**Avoids:** Pitfall 6 (C4 offline fails if D2 not done first); publicAsset() path bug on GitHub Pages

**Research flag:** No research needed.

---

### Phase 4: D1 -- GameEvents Emitter and GameState Context

**Rationale:** Add instrumentation after games are in their final D2 state. The emitter is purely additive -- removing emit calls fully restores original behavior. GameTopBar switches from prop to context for streak display.

**Delivers:** gameEvents singleton in lib/game-events.ts; GameStateProvider scoped to /play route; live score and streak in GameTopBar; onStreakChange prop removed from GameShellPage.

**Addresses:** D1 V3 feature

**Avoids:** Anti-pattern of GameStateProvider at app root; anti-pattern of converting useRef game counters to useState

**Research flag:** Standard patterns. Run scoring.test.ts and session.test.ts as regression guards.

---

### Phase 5: C2 -- Review Round Ordering and Leitner Loop

**Rationale:** ReviewRound shell is approximately 90% built. The sorting layer and 2-bucket Leitner loop are the remaining gaps. mistakeWeights derived field in SessionContext feeds the sort. Fix the handleRegionClick null-guard for defensive coding.

**Delivers:** ReviewRound sorts mistakes most-missed first; loops until all bucket-0 items resolve; reviewQueue persisted to localStorage for page-refresh resilience.

**Addresses:** C2 V3 feature

**Avoids:** Pitfall 7 (ReviewRound crash/false-completion on DC codes); anti-feature of full SM-2/FSRS for single-sitting sessions

**Research flag:** No research needed -- algorithm fully specified in FEATURES.md.

---

### Phase 6: C5 -- Dynamic Difficulty

**Rationale:** Add optional weights parameter to three question-picker pure functions. Games pass useSession().mistakeWeights only when isRetry === true. All existing picker unit tests must pass with weights absent.

**Delivers:** Accuracy-weighted question pool on retry attempts; difficulty scoped to session object, not a separate localStorage key.

**Addresses:** C5 V3 feature

**Avoids:** Pitfall 8 (shared-device difficulty pollution -- scope to session only)

**Research flag:** No research needed -- pure function changes with unit test coverage.

---

### Phase 7: C4 -- Offline Resilience

**Rationale:** Narrowly scoped to lib/sync-queue.ts + leaderboard integration + one useEffect for drain-on-reconnect. Must come after D2. Gate the entire feature on APPS_SCRIPT_URL being configured.

**Delivers:** useOnlineStatus hook + top-bar offline banner; pending leaderboard submissions queued in localStorage and drained on online event.

**Addresses:** C4 V3 feature

**Avoids:** Pitfall 6 (D2 must precede C4); navigator.onLine false-positive on captive portals; Background Sync API unsupported in Firefox/Safari

**Research flag:** Standard patterns. Verify manually with DevTools Network then Offline.

---

### Phase 8: C3, Navigation Fixes, and Unified Results

**Rationale:** Results and navigation are purely additive JSX and routing changes. Ship last so all upstream data is accurate before display. Resume Expedition routing must be fixed before C3 ships.

**Delivers:** Resume Expedition Train/Play buttons wired correctly; "What's Next" hub visible without scrolling; timezone-grouped focus tip; game4 score wired in getSubmissionPayload; unified expedition results page.

**Addresses:** C3 V3 feature; Resume Expedition screen; Unified expedition results page; Landing CTA visible at 100% zoom

**Avoids:** UX pitfall of shipping C3 action hub before Resume Expedition routing is fixed

**Research flag:** No research needed -- additive JSX changes to existing components.

---

### Phase Ordering Rationale

- **Map fixes first** -- SVG is the core product surface; DC/TOTAL_REGIONS bug corrupts data flowing into C2, C5, and results page if left unresolved
- **D2 before C4** -- hard dependency: game data must be served from context before it can be offline-resilient (Pitfall 6)
- **D2 before C5** -- question pickers need consistent states[] from context to receive weights parameter reliably
- **D1 after D2** -- instrument games in their final data-source state to minimize combined change surface
- **C4 last among V3 features** -- most isolated from UI concerns; verified manually; depends on D2 being stable
- **C3 and results last** -- display layers that benefit from all upstream data being correct

---

### Research Flags

Phases needing deeper research during planning:
- None identified. All six V3 features have fully specified algorithms and the codebase has been directly analyzed.

Phases with standard patterns (skip research phase):
- **All 8 phases** -- direct codebase analysis provides authoritative baselines; all algorithms fully specified; library choices confirmed against official docs.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All three new packages verified against npm registry and official docs; version compatibility with React 19 / TS 6 / Vite 8 confirmed |
| Features | HIGH | Existing code read directly on 2026-05-20; shipped vs. missing features confirmed from source, not from stale docs |
| Architecture | HIGH | Based on direct source analysis of all major files; provider tree, data flow, and component boundaries confirmed |
| Pitfalls | HIGH | All pitfalls grounded in actual codebase artifacts (line numbers, variable names, confirmed mismatches) |

**Overall confidence:** HIGH

### Gaps to Address

- **APPS_SCRIPT_URL configuration:** C4 sync queue is meaningless if the leaderboard URL is not configured. Gate drainQueue() on if (APPS_SCRIPT_URL) regardless; verify URL is set before implementing C4.
- **sessionStorage vs localStorage for DataProvider cache:** DataProvider uses sessionStorage (tab-scoped, cleared on tab close). For C4 offline resilience to survive tab-close-then-reopen scenarios, consider switching to localStorage with a TTL key. Decide explicitly during Phase 7 planning.
- **SVG fix strategy (patch vs swap):** PROJECT.md defers this to implementation. Research recommendation is to patch the existing SVG viewBox. If the swap is chosen, the coordinate-transform audit (Pitfall 1) is a full sub-task requiring manual verification across all four map use sites.
- **ts-fsrs installed but not used in C2:** Install the package (ships own types, 12 KB) but implement C2 as 2-bucket Leitner. ts-fsrs will be ready for future cross-session scheduling without a new install.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis (2026-05-20): CodeDrop.tsx, PinRush.tsx, CityStack.tsx, GameShellPage.tsx, ReviewRound.tsx, ResultsPage.tsx, useSession.ts, useData.tsx, session.ts, types/index.ts, InteractiveMap.tsx, App.tsx, north-america.svg, states.json
- React official docs: useSyncExternalStore, useReducer dispatch stability, React.use(promise) -- react.dev
- MDN Web Docs: SVG preserveAspectRatio, viewBox -- developer.mozilla.org
- npm registry: idb 8.0.3 (15M weekly downloads), ts-fsrs 5.4.0, mitt 3.0.1 -- npmjs.com
- Vite 8 announcement: Rolldown architecture, Node >=20 requirement -- vite.dev

### Secondary (MEDIUM confidence)
- SitePoint: React 19 use() hook patterns -- module-level stable promise as cache workaround
- LogRocket: Offline-first frontend 2025 -- Background Sync API browser support (Firefox disabled, Safari unimplemented)
- PkgPulse Guide May 2026: Dexie vs idb bundle size comparison (aligns with bundlephobia data)
- .planning/codebase/CONCERNS.md: 29 suppressed exhaustive-deps instances, dangerouslySetInnerHTML flags

### Tertiary (LOW confidence / planning docs)
- v3-remaining-changes.md (2026-05-17): V3 backlog -- treat as partially stale; confirmed stale for C2 (ReviewRound exists) and D2 (DataProvider exists); each phase must verify before implementing

---
*Research completed: 2026-05-20*
*Ready for roadmap: yes*