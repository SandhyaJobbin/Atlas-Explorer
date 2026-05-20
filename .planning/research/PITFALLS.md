# Pitfalls Research

**Domain:** Geography-education SPA — SVG interactive map, React Context state, offline resilience, spaced repetition, brownfield polish pass
**Researched:** 2026-05-20
**Confidence:** HIGH (all findings grounded in the actual codebase mapped 2026-05-20)

---

## Critical Pitfalls

### Pitfall 1: SVG viewBox Swap Silently Relocates All Coordinate-Dependent Overlays

**What goes wrong:**
The current map file (`north-america.svg`) uses `viewBox="-189.42 -50 1157.42 830"`. The candidate replacement in `svg (1)/northAmerica.svg` uses `viewBox="-755.67 -1150.98 1706.74 1784.42"` — origin and scale are completely different. If the new SVG is wired in without updating every piece of code that calculates overlay positions from SVG coordinates, all waypoints, score-popup anchor calculations (`getBBox()` / `getBoundingClientRect()`), the `RegionFlightSource` rect data used for fly-to-panel animations, and `StateOutline` paths will render at wrong positions. This is a silent failure: the map looks correct but overlays are off-map or invisible.

**Why it happens:**
`InteractiveMap` calls `el.getBBox()` and `el.getBoundingClientRect()` to produce `RegionFlightSource`, then `MapExplorerPage` uses those screen-space coordinates to animate the flight transition. The same `getBoundingClientRect()` values feed `ScorePopup` positions in `PinRush` and `CodeDrop`. Swapping the SVG changes all underlying coordinates without a compile-time error.

**How to avoid:**
Before committing to the `svg (1)/northAmerica.svg` swap, verify that the new SVG paths share the same `data-code` attribute values and that the region shapes are visually equivalent. If swapping, immediately run a manual end-to-end check of: (a) fly-to-panel animation on MapExplorer region click, (b) PinRush map click feedback (score popup positioning), (c) CodeDrop correct/wrong code flash. If any overlay is off, the new SVG coordinate space requires a coordinate-transform layer, which is significant scope. Fixing the viewBox of the existing SVG (`-189.42 -50 1157.42 830` → one that fully includes Canada's north) is lower risk because only the clipping changes, not the coordinate origin.

**Warning signs:**
Score popups appear at `(0,0)` or off-screen. Fly-to-panel animation lands outside the panel area. `StateOutline` SVG paths render as invisible or far outside the map container.

**Phase to address:**
SVG / map viewport phase (Phase 1). Decide fix strategy (patch viewBox vs swap asset) before touching any overlay logic.

---

### Pitfall 2: DC in SVG Makes `TOTAL_REGIONS = 64` Unreachable, Silently Blocking Training Completion

**What goes wrong:**
The current `north-america.svg` has exactly 64 `atlas-region` paths. One of them is `DC` (District of Columbia). `states.json` has 63 entries — DC is absent. `session.ts` sets `TOTAL_REGIONS = 64` and `isTrainingComplete` fires when `mapExplorerClicked.length >= 64`. Because clicking DC fires `onRegionClick("DC")` → `updateTraining("map", "DC")` → pushes "DC" into `mapExplorerClicked`, but `states.json` has no DC entry, the info panel for DC either crashes or shows nothing. A player who avoids DC gets stuck at 63/64 forever. A player who clicks DC gets a broken panel. Either way, the "Completing all 63 regions advances to results" bug is structurally caused by this DC mismatch, not a UI timing issue.

**Why it happens:**
The SVG was generated from a geographic dataset that includes DC as a federal district. The `states.json` covers US states + Canadian provinces — DC was intentionally omitted from the educational scope but was not removed from the SVG or excluded from region listener registration.

**How to avoid:**
Fix is a two-way reconciliation: either (a) add DC to `states.json` with its data (timezone EST, postal code DC, name "District of Columbia") and update copy to say 64 regions, or (b) add `data-exclude="true"` to the DC path in the SVG, filter it out in Effect A's `querySelectorAll`, and leave `TOTAL_REGIONS = 63`. Option (b) is simpler. Do not change `TOTAL_REGIONS` without updating every hardcoded `64` string in `TrainingCompletePage.tsx`, `ExpeditionReport.tsx`, and `MapExplorerPage.tsx` MILESTONES array (count: 64).

**Warning signs:**
Test: click exactly 63 non-DC regions in MapExplorer — training never completes. `session.training.mapExplorerClicked.length` stays at 63 indefinitely.

**Phase to address:**
Map/game-logic fix phase. This is the root cause of the "63 regions / results page" bug listed in PROJECT.md requirements.

---

### Pitfall 3: Effect A (SVG Listener Registration) Re-Runs on `svgContent` Change, Not on Prop Changes — Stale Closure Risk Is Real

**What goes wrong:**
`InteractiveMap` separates SVG listener registration (Effect A, deps: `[svgContent]`) from visual state update (Effect B, deps: `[svgContent, highlightedCodes, ...]`). This is intentional to avoid re-attaching listeners on every render. However, Effect A captures `onRegionClickRef` and `onRegionHoverRef` via refs, so callbacks are correctly kept fresh. The risk is different: if the component ever unmounts and remounts while `svgCache` (module-level singleton) still holds the old SVG string, `setSvgContent(svgCache)` runs synchronously on mount, `loading` stays false, but `contentRef.current` is not yet populated — the `querySelectorAll` in Effect A finds 0 elements and registers no listeners. Result: map renders but is completely unclickable.

**Why it happens:**
`svgCache` is a module-level variable. On first mount, `loading=false` because `svgCache` is truthy. Effect A runs after paint, but `dangerouslySetInnerHTML` has already been applied — this should work. The actual race occurs during hot-module-replacement in dev (Vite HMR) where the module reloads but the DOM has already been updated: `svgCache` is non-null but `contentRef.current` is the new (empty) DOM node. In production this surfaces if the component is conditionally rendered (e.g., shown only during `phase === 'playing'`) and toggled rapidly.

**How to avoid:**
Add a null-guard at the top of Effect A: `if (!contentRef.current || contentRef.current.querySelectorAll('.atlas-region').length === 0) return;`. Also consider clearing `svgCache = null` in Effect A's cleanup when the component unmounts, so the next mount re-fetches and re-registers. For the border-pop-and-revert bug specifically, check whether Effect B's `requestAnimationFrame` callback fires after the component unmounts — the `cancelAnimationFrame` cleanup return exists, but confirm the frame ID is always the most recent one (the closure captures `frameId` correctly — this is fine).

**Warning signs:**
After navigating away from a game and back, the map renders but clicks do nothing. No console errors. DevTools shows 0 event listeners on `.atlas-region` paths.

**Phase to address:**
Map interaction fix phase (border-pop, click-stability fixes).

---

### Pitfall 4: `useEffect` Dependency Suppression Hiding Stale Timers in PinRush

**What goes wrong:**
`PinRush` timer effect (line 89–116) has `// eslint-disable-line react-hooks/exhaustive-deps` with deps `[qi, loading, questions.length]`. `playSound` is called inside the effect but is not in the deps array. If `useAudio` returns a new `playSound` reference on re-render (which it does on any AudioContext state change — e.g., user interacts to unlock audio), the timer interval holds the stale `playSound` reference from the mount render. The timer fires correctly but sound calls silently fail. More critically, if `locked` is updated inside `setTimeLeft`'s functional updater but `pendingClickRef` is read in a separate effect with deps `[locked]`, there is a one-render gap where `locked` is true but the pending click effect has not yet executed — a second click during that gap sets `pendingClickRef` again, and the first click's code is overwritten.

**Why it happens:**
29 instances of suppressed exhaustive-deps across the codebase (per CONCERNS.md). The pattern of using refs to break circular dependencies is correct in `InteractiveMap` (the `onRegionClickRef` pattern is idiomatic). In `PinRush` it is used to work around a complex timer + click flow, but the suppression also silences legitimate missing-dep warnings.

**How to avoid:**
For the timer effect specifically: wrap `playSound` in `useCallback` with a stable identity in `useAudio`, or capture it in a ref the same way `onRegionClickRef` is handled in `InteractiveMap`. Do not add `playSound` directly to the deps array — that would restart the timer on audio context changes. For the click-gap race: the `pendingClickRef` pattern is actually sound; just ensure the "resolve click" effect checks `pendingClickRef.current !== undefined` (not just `!locked`) to distinguish timeout-expire from user-click.

**Warning signs:**
Sound plays on first question, then goes silent mid-game after the user first taps the screen (which unlocks the AudioContext). Timer still counts down visually but no audio feedback.

**Phase to address:**
Game interaction fix phase (per-second flicker, timer fixes). This is also the root of some "flicker" symptoms.

---

### Pitfall 5: `structuredClone(session)` on Every `updateTraining` Call During Map Exploration Creates GC Pressure

**What goes wrong:**
Every time a learner clicks a region in `MapExplorerPage`, `updateTraining("map", code)` is called, which triggers `setSession(prev => { const next = structuredClone(prev); ... return next; })`. `structuredClone` performs a deep copy of the entire session object — including all game state, all attempt arrays, all badge arrays, and all `mapExplorerClicked` array items. At 64 clicks (plus any mis-clicks), this is 64+ deep clones. Each clone includes an ever-growing `mapExplorerClicked` array. On low-RAM classroom Chromebooks, this accumulates GC pressure, causing perceptible jank on the 40th–60th click when the array is largest. The jank visually manifests as the fly-to-panel animation stuttering.

**Why it happens:**
`structuredClone` is the correct way to ensure immutable state updates in React. The problem is structural — the session object is a single monolith. This was fine for the game flow (a few attempts at most), but training exploration is a tighter loop with up to 64 rapid updates.

**How to avoid:**
For the training update specifically, keep a separate piece of local state for `exploredCodes` in `MapExplorerPage` and only flush it to session on navigation away (e.g., when the "Start Games" button is pressed). This avoids 64 session clones during exploration. Alternatively, make `mapExplorerClicked` a `Set` in local state and convert to array only on save — but that requires a session type change. The local-state approach is lower risk and zero schema migration.

**Warning signs:**
DevTools Performance tab shows GC spikes (purple bars) every few region clicks in MapExplorer. Animation frame duration exceeds 16ms on the 50th+ region click.

**Phase to address:**
Map interaction fix phase (hover/click stability). Also relevant to the D1 unified game state refactor.

---

### Pitfall 6: `sessionStorage` Cache in `DataProvider` Means Offline Resilience (C4) Cannot Rely on It

**What goes wrong:**
`DataProvider` caches `states.json` in `sessionStorage` with a 1-hour TTL. `PinRush`, `CodeDrop`, and `CityStack` each fetch `states.json` independently via their own `useEffect` (per CONCERNS.md D2, confirmed in `PinRush.tsx:78–86`). The C4 offline resilience feature plans to use `navigator.onLine` to detect offline state. If a student loses WiFi after the session starts but before any game component mounts (e.g., between MapExplorer and game 1), the game component's independent fetch will fail because: (a) `sessionStorage` is only populated if `DataProvider` successfully fetched first, (b) the game component does not fall back to the `DataProvider` context — it fetches independently. The C4 sync queue for leaderboard submissions is separate from this data availability issue.

**Why it happens:**
D2 (single shared fetch) and C4 (offline resilience) were designed as independent features in the V3 plan. However, they have a hard dependency: C4 only works correctly if D2 is implemented first. If `states.json` is not available from context when offline, games that fetch it independently will show a loading spinner forever.

**How to avoid:**
Implement D2 before C4. Once all components consume `useData()` instead of fetching independently, offline resilience for game data reduces to: (a) `DataProvider` checks `sessionStorage` cache first (already done), (b) add a Service Worker or `Cache Storage` entry for `states.json` as a fallback. For the C4 sync queue, do not use `sessionStorage` — use `localStorage` so the queue survives tab closes. The `session.ts` storage layer already uses `localStorage` (confirmed: `saveSession` defaults to `globalThis.localStorage`), so appending a `syncQueue` array to the session object would work without a separate storage key.

**Warning signs:**
During offline testing (DevTools → Network → Offline), games 1–3 show "loading" spinner indefinitely even though MapExplorer worked. `navigator.onLine` indicator shows correctly but game data is unavailable.

**Phase to address:**
D2 must precede C4. Address in that order during the V3 completion phase.

---

### Pitfall 7: ReviewRound (C2) Already Exists But Has a Crash Path When `mistakeStates` Is Empty on Non-Empty `mistakeCodes`

**What goes wrong:**
`ReviewRound.tsx` derives `mistakeStates` by looking up each mistake code in `states`. If a mistake code is `"DC"` (the missing states.json entry from Pitfall 2) or any stale code that no longer exists in `states.json`, the `.find()` returns `undefined`, and the `.filter(Boolean)` removes it — so `mistakeStates.length < mistakeCodes.length`. If all mistakes are DC codes, `mistakeStates` is empty while `mistakeCodes` is not, and the "No mistakes to review!" branch fires — incorrectly telling a student they got everything right. Additionally, `handleRegionClick` calls `targetState.code` without a null-guard on `targetState` (line 42). If `currentIndex` somehow advances past `mistakeStates.length - 1` before the component re-renders, this throws.

**Why it happens:**
The ReviewRound component was written assuming `mistakeCodes` and `states` are always reconciled. The DC data mismatch (Pitfall 2) creates a case where they are not. This is a compound pitfall — Pitfall 2 must be fixed first, but the null-guard is worth adding regardless as defensive code.

**How to avoid:**
Fix Pitfall 2 first (reconcile DC). Then add: `if (!targetState) return null;` at the top of `handleRegionClick`. The existing early-return `if (!targetState)` (line 63) already handles the render path, but not the click handler.

**Warning signs:**
Automated: unit test that creates a session with `mistakes: ["DC"]` and renders `ReviewRound` — it will show "No mistakes" incorrectly. Manual: intentionally answer DC questions wrong during CodeDrop, complete games, observe ReviewRound behavior.

**Phase to address:**
C2 verification phase. Check ReviewRound before marking C2 complete — the shell and UI exist, but the DC edge case makes it falsely report completion.

---

### Pitfall 8: Dynamic Difficulty (C5) That Writes Per-Region Error Rates to `localStorage` Will Collide Across Wave Members on Shared Devices

**What goes wrong:**
The C5 plan (dynamic difficulty based on "wave-wide error rates") implies storing aggregate per-region difficulty data somewhere. If it is stored in `localStorage` (the natural choice for a static SPA), two students using the same Chromebook in different sessions will see each other's difficulty calibration. Student B gets an easy session because Student A struggled with Iowa — or vice versa. This also means difficulty data persists across expeditions when it should reset per-session or per-wave.

**Why it happens:**
The codebase uses `localStorage` for all persistence (session, leaderboard fallback, UI state like `passportOpen`). C5 is described as per-region difficulty rating based on wave-wide error rates, but without a backend, "wave-wide" can only be approximated from local data. Mixing per-user and per-wave aggregates in the same storage scope causes cross-contamination.

**How to avoid:**
Scope C5 difficulty data to the session object, not to a separate `localStorage` key. Base difficulty on the current player's own error rate from `session.games[].mistakes[]` rather than a shared aggregate. This is weaker pedagogically but avoids the shared-device contamination problem. The v3-remaining-changes.md description supports this: "Track a hidden difficulty rating per region based on wave-wide error rates" — flag this as aspirational; implement as per-player for now, noting the backend dependency for true wave-wide aggregation.

**Warning signs:**
Two students share a Chromebook. Student B's first question is unusually hard (easier regions skipped). Inspecting `localStorage` shows difficulty keys from Student A's session.

**Phase to address:**
C5 implementation phase. Scope the implementation note explicitly before writing any code.

---

### Pitfall 9: `dangerouslySetInnerHTML` SVG + Tailwind `[&_svg]:w-full [&_svg]:h-full` Conflicts With SVG `width`/`height` Attributes, Causing Map Cropping

**What goes wrong:**
The `contentRef` div uses Tailwind child selectors `[&_svg]:w-full [&_svg]:h-full [&_svg]:block` to force the injected SVG to fill its container. If the SVG element has explicit `width` and `height` attributes (e.g., `width="968" height="780"`) in addition to `viewBox`, browsers use the explicit attributes for intrinsic sizing before CSS overrides apply. On some browsers (particularly Safari on iOS), the CSS override loses to the SVG's intrinsic size, rendering the map at its native pixel size instead of filling the container — which crops Canada. The current `north-america.svg` may or may not have these attributes (the `head` output was truncated to path data). The new `svg (1)/northAmerica.svg` is more likely to have them since it was a designer export.

**How to avoid:**
After injecting SVG content via `dangerouslySetInnerHTML`, run a one-time post-injection cleanup that removes `width` and `height` attributes from the root `<svg>` element: `contentRef.current.querySelector('svg')?.removeAttribute('width')`. Do this in Effect A, right after the `querySelectorAll('.atlas-region')` loop. The `viewBox` attribute alone is sufficient for scaling when width/height are absent and CSS dictates size.

**Warning signs:**
Map renders correctly on Chrome desktop but is cropped on Safari/Firefox or on mobile. The map container reports `height: Xpx` in DevTools but the SVG element inside it reports a different intrinsic size.

**Phase to address:**
SVG/viewport fix phase. Check this before and after any SVG asset swap.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `// eslint-disable-line react-hooks/exhaustive-deps` on timer effects | Avoids spurious re-runs of intervals | Masks stale closures; when audio context or `playSound` identity changes, sounds silently fail mid-game | Only for stable primitive deps where the suppression reason is documented in a comment |
| Module-level `svgCache` singleton | Avoids re-fetch across remounts | Forces all InteractiveMap instances to share one SVG string; incompatible with a future map-swap feature; causes HMR issues in dev | Acceptable for production; document that HMR will invalidate it |
| `structuredClone(session)` for every training click | Guarantees immutability | GC pressure on 64-click exploration loop on low-RAM devices | Acceptable for game attempts (infrequent); problematic for training loop |
| Hardcoded `64` in multiple files instead of importing `TOTAL_REGIONS` | Faster to write | Causes silent drift when DC is resolved and the count changes to 63 or 65 | Never — replace all `64` literals with `import { TOTAL_REGIONS }` |
| `console.error` as the only error handler on 7 fetch points | Simple | Offline failures are silent to users; classroom instructor has no way to diagnose connectivity issues | Only in components that have a graceful fallback UI that already handles the null data case |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Apps Script leaderboard | Treating the empty `APPS_SCRIPT_URL` as a non-issue and adding C4 offline sync queue on top of it | The sync queue will accumulate forever and never flush since the URL is empty. Either configure the URL first or gate the sync-queue feature with `if (APPS_SCRIPT_URL)` |
| `navigator.onLine` for C4 | Treating `navigator.onLine = true` as "network requests will succeed" | `navigator.onLine` is false only when the device has no network interface at all. In a school with a captive portal or a router that's up but has no internet, `onLine` is true but fetches fail. Use a fetch-with-timeout probe to a known endpoint instead |
| `sessionStorage` for DataProvider cache | Assuming it survives navigation | `sessionStorage` is cleared when the tab is closed or the page is hard-refreshed. For C4 offline resilience, game data must be in `localStorage` or a Service Worker cache, not `sessionStorage` |
| HashRouter with `BASE_URL` asset paths | Assuming `import.meta.env.BASE_URL` is always `/Atlas-Explorer/` | In local dev, `BASE_URL` is `/`. The `publicAsset()` helper handles this correctly. Any new fetch that bypasses `publicAsset()` (e.g., `fetch('/data/states.json')`) will 404 on GitHub Pages |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 64-path SVG re-queried in Effect B on every prop change | Perceptible flash on region highlight (the "per-second flicker" bug) | Effect B's `requestAnimationFrame` already batches DOM writes correctly; the flicker is caused by the interval timer in a parent component calling `setTimeLeft` every second, triggering a parent re-render that passes new props to `InteractiveMap`, which schedules a new `rAF` for Effect B | Any component that passes a prop to InteractiveMap and updates it on an interval (PinRush `timeLeft`, MapExplorer pace monitor) |
| WaveLeaderboardWidget 30s polling during games | Network requests during active gameplay interfere with time-sensitive operations on slow connections | Already guarded: `isAnimating` pauses polling. Ensure the pause guard covers the `playing` phase, not just interstitials | Classrooms with 30+ students simultaneously polling the same Apps Script URL will hit rate limits |
| `pickPinQuestions` called on every PinRush mount | Questions are re-randomized on retry, which is correct, but the function signature and shuffle are O(n log n) over all 63 states | Already fast enough for 63 states; becomes a problem only if states dataset grows significantly | Not a current concern |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Hover tooltip flicker on small states (RI, DE, DC) | Repeated mouseenter/mouseleave events as pointer crosses thin stroke boundaries trigger rapid show/hide cycles of the tooltip | Add a 100ms debounce to `onRegionHover` calls in MapExplorerPage before setting `hoveredRegion` state. The current `pointermove` handler fires on every pixel of movement |
| Off-map waypoints (PIN_POSITIONS hardcoded percentages) | Three `PIN_POSITIONS` in MapExplorerPage are `25%/30%`, `45%/60%`, `70%/42%` — these are percentage positions within the map container div, not within the SVG coordinate space. At 100% browser zoom they may sit over Canada or the ocean | Anchor waypoints to specific `data-code` regions using the same `getBBox()` approach used for fly-to-panel, or define positions relative to known region centroids in states.json |
| Layout only fits at 90% browser zoom | Indicates the top bar height + map + bottom controls exceed `100vh`. `AppLayout` uses `h-screen flex flex-col overflow-hidden` — if the `GameTopBar` (header: `px-6 py-3`) + `WaveLeaderboardWidget` (fixed bottom-6 right-6) + map container are not correctly constrained with `flex-1 min-h-0`, the map overflows below the screen | Audit that every flex child in the game shell has `min-h-0` — without it, flex children do not shrink below their content size in column layouts |
| Resume Expedition buttons not connected | Users who return to the landing page expect "Train" and "Play" to resume correctly; if they navigate to `/` and see an inactive button, they may think their progress is lost | Fix routing logic before shipping C3 action hub, or users will hit the same broken navigation from the action hub's "retry lowest game" link |

---

## "Looks Done But Isn't" Checklist

- [ ] **C2 (Review Round):** `ReviewRound.tsx` exists and renders — but verify it is unreachable without Pitfall 2 (DC) being fixed first. The path `session.games.flatMap(g => g.mistakes)` will include DC codes if CodeDrop or PinRush served DC questions, which blocks correct ReviewRound behavior.
- [ ] **D2 (Single DataProvider fetch):** `DataProvider` exists and `useData()` is consumed by `MapExplorerPage`. But `PinRush.tsx:78–86` still fetches `states.json` independently. Confirm `CodeDrop` and `CityStack` do the same — D2 is not done until all three game components consume `useData()` instead of fetching.
- [ ] **C4 (Offline resilience):** Adding `navigator.onLine` handling and a sync queue to `session.ts` is not enough. The sync queue must survive tab close (use `localStorage`, not just in-memory state), the leaderboard URL must be configured, and game data must be available offline (requires D2 + cache layer). Test by opening DevTools → Network → Offline after MapExplorer loads but before starting a game.
- [ ] **ViewBox fix:** Fixing Canada cropping by adjusting `viewBox` must be verified on the game screens too (not just MapExplorer) — `InteractiveMap` is used in `MapExplorerPage`, `PinRush`, `ReviewRound`, and `ResultsPage` (heatmap). Each use may render at a different container size.
- [ ] **Z-index stacking fix:** Fixing the "zoom controls hidden behind Wave Standings" issue by raising `z-20` on the zoom buttons will only work if the parent stacking context allows it. `WaveLeaderboardWidget` is `fixed bottom-6 right-6 z-50` — the zoom button panel is `absolute bottom-3 right-3 z-20` inside the map container. Since the leaderboard is `position: fixed`, it is in the root stacking context and wins over any `z-index` inside a non-fixed ancestor. Fix: either raise the zoom buttons to `fixed` positioning or lower the leaderboard widget when the map needs interaction.
- [ ] **D1 (Unified game state):** `GameShellPage` uses `useReducer` correctly for shell phase management. But `recordAttemptFull` in `useSession` still calls `submitAttemptScore` synchronously and mutates `next` before calling `setSession(next)`. A `GameEvents` emitter refactor must preserve this ordering guarantee or scores will be submitted before session state is persisted to localStorage.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SVG viewBox swap breaks overlay positions | HIGH | Revert to original SVG, patch viewBox only, re-test each overlay independently |
| DC mismatch blocks training completion | LOW | Either add DC to states.json (30 min) or exclude DC path from listener registration (15 min); both are safe edits |
| stale timer ref kills sound mid-game | MEDIUM | Wrap `playSound` in a stable ref (same pattern as `onRegionClickRef`); test by triggering audio context unlock then playing through a full game |
| D2 + C4 implemented in wrong order (C4 first) | MEDIUM | C4 sync queue still works; game data offline is the only gap. Add Service Worker cache for `/data/states.json` as a patch |
| C5 difficulty data pollutes shared device | LOW | Scope difficulty to session object, add `clearDifficultyData()` to `clearCurrentSession()` call |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SVG viewBox swap breaks overlays | Phase 1 — SVG/map fix | Manual: click 5 regions, verify fly-to-panel animation lands correctly; PinRush click shows score popup at correct position |
| DC mismatch blocks training completion | Phase 1 — SVG/map fix | Automated: explore exactly 63 non-DC regions → training should complete; explore 63 + DC → same result |
| Effect A stale listener registration | Phase 2 — map interaction fix | Manual: navigate away from PinRush mid-game, return to it, click a region — must register |
| Suppressed deps / stale timer in PinRush | Phase 2 — map/game interaction fix | Manual: complete 3+ questions after unlocking audio — sound must play throughout |
| `structuredClone` GC on training loop | Phase 2 — map interaction fix | DevTools Performance: record 30 region clicks, no GC spikes above 50ms |
| C4 data availability requires D2 first | Phase 3 — D2 before C4 | Order enforcement: D2 PR merged before C4 work begins |
| ReviewRound crash path on DC codes | Phase 3 — C2 verification | Unit test: session with `mistakes: ["DC"]` renders ReviewRound without crash and without false "no mistakes" |
| Shared-device C5 difficulty pollution | Phase 4 — C5 implementation | Session scoped: verify `clearCurrentSession()` wipes all difficulty state |
| SVG `width`/`height` attr overrides CSS | Phase 1 — SVG/map fix | Test on Safari + Firefox + Chrome at 100% zoom |
| Z-index: zoom buttons behind leaderboard | Phase 2 — layout/z-index fix | Manual: confirm zoom +/- buttons are clickable when WaveLeaderboardWidget is expanded |

---

## Sources

- `app/public/maps/north-america.svg` — viewBox value, `data-code` attributes, region count (64, including DC)
- `app/public/data/states.json` — region count (63, no DC entry) — confirmed mismatch with SVG
- `app/src/components/map/InteractiveMap.tsx` — Effect A/B split, `svgCache` module singleton, `getBBox`/`getBoundingClientRect` usage, z-index of zoom controls (`z-20`)
- `app/src/features/training/MapExplorerPage.tsx` — `PIN_POSITIONS` hardcoded percentages, `structuredClone` per training click, z-index audit
- `app/src/features/games/PinRush.tsx` — independent `states.json` fetch (line 78), timer effect with suppressed deps (line 116)
- `app/src/features/games/ReviewRound.tsx` — `mistakeStates` derivation, null-guard gap in `handleRegionClick`
- `app/src/features/games/GameShellPage.tsx` — `useReducer` shell state machine, `review` phase entry conditions
- `app/src/hooks/useSession.ts` — `structuredClone` pattern, `recordAttemptFull` ordering
- `app/src/hooks/useData.tsx` — `sessionStorage` cache (not `localStorage`), TTL, DataProvider scope
- `app/src/lib/session.ts` — `TOTAL_REGIONS = 64`, `isTrainingComplete` condition, `localStorage` storage layer
- `app/src/components/layout/AppLayout.tsx` — `z-20` content wrapper, `overflow-hidden` on root
- `app/src/components/layout/WaveLeaderboardWidget.tsx` — `fixed z-50`, confirmed beats `absolute z-20` zoom buttons
- `.planning/codebase/CONCERNS.md` — 29 suppressed deps, no error boundaries, `dangerouslySetInnerHTML` flag
- `v3-remaining-changes.md` (2026-05-17) — C2/D2 status claims (partially stale: ReviewRound and DataProvider both exist in 2026-05-20 codebase)
- `svg (1)/northAmerica.svg` — candidate replacement viewBox (`-755.67 -1150.98 1706.74 1784.42`), incompatible coordinate space confirmed

---
*Pitfalls research for: Atlas Explorer — brownfield polish + V3 completion*
*Researched: 2026-05-20*
