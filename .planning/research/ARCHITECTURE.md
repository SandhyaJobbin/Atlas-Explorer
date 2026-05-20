# Architecture Research

**Domain:** Geography-education web game (React 19 SPA, brownfield milestone integration)
**Researched:** 2026-05-20
**Confidence:** HIGH — based on direct codebase analysis, no speculation

---

## Existing Architecture (Authoritative Baseline)

The codebase is a layered React 19 SPA. Provider composition in `App.tsx`:

```
HashRouter
  AudioProvider          (hooks/useAudio.tsx)
  DataProvider           (hooks/useData.tsx)        ← fetches states.json, sessionStorage cache
    SessionProvider      (hooks/useSession.ts)       ← structuredClone + localStorage
      Routes / Guards
        GameShellPage    (features/games/)           ← useReducer state machine
          CodeDrop / PinRush / CityStack             ← local useRef scorekeeping
```

Key structural facts from source analysis:

- `DataProvider` already exists and serves `states[]` via context with a 1-hour sessionStorage cache. `CityStack` already calls `useData()`. **CodeDrop and PinRush each still perform their own `fetch('/data/states.json')` independently** — this is the D2 gap to close.
- Game components (`CodeDrop`, `PinRush`, `CityStack`) maintain `scoreRef`, `correctCountRef`, `streakRef`, `streakPeakRef`, `mistakesRef`, `correctsRef` as `useRef` — mutable values never surfaced to any context until `onComplete(result)` fires at game end. The `GameShellPage` receives these final results and calls `recordAttemptFull` which persists them to `SessionContext`.
- `GameShellPage` owns the `playing → pass/fail → review` state machine via `useReducer`. This is already clean and does not need to be replaced — only extended.
- `ReviewRound` already reads `session.games[*].mistakes` from `SessionContext`. It works correctly as-is; C2 (spaced repetition ordering) is an enhancement to how those mistakes are ordered, not a rewrite.
- The `Session` type in `types/index.ts` stores `GameState.mistakes` and `GameState.corrects` as `string[]` arrays of region codes — the data model for per-region difficulty already has a natural home here.

---

## Milestone Integration Architecture

### System Overview After Milestone

```
┌─────────────────────────────────────────────────────────────────┐
│  App.tsx — Provider Stack                                        │
│                                                                  │
│  AudioProvider                                                   │
│  DataProvider (D2 — single fetch, exposes states + difficulty)  │
│  SessionProvider (existing, unchanged interface)                 │
│  GameStateProvider (D1 — new, wraps GameShellPage subtree only) │
│    SyncQueueProvider (C4 — new, wraps app root or session level)│
└─────────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  GameShellPage    ReviewRound      ResultsPage
  (useReducer      (reads session   (reads session
   unchanged)       .mistakes)       + cross-game
                                     aggregation)
        │
  ┌─────┴──────────────────┐
  │  GameEvents emitter    │  ← D1 new lib/game-events.ts
  │  (plain EventTarget)   │
  └─────┬──────────────────┘
        │ emit('score', 'streak', 'mistake', 'correct')
        ▼
  GameStateContext         ← D1 new hooks/useGameState.tsx
  { score, streak,
    mistakes[], corrects[],
    streakPeak }
        │ consumed by
  ┌─────┴────────────────────────────────┐
  │  GameTopBar  ScorePopup  StreakMeter │  ← already exist, just read context
  └──────────────────────────────────────┘
```

---

## Component Boundaries

### D2: DataProvider Enhancement

**Boundary:** `hooks/useData.tsx` only.

**Current state:** Already fetches `states.json` once per sessionStorage TTL window. Already exposes `{ states, loading }`.

**Change:** Add `difficulty: Record<string, number>` to the context value. This is a derived map computed from `session.games[*].mistakes` and surfaced by `DataProvider` so C5 (dynamic difficulty) and C2 (spaced repetition ordering) can both consume it without coupling to `SessionProvider`.

**Implementation note:** `DataProvider` wraps `SessionProvider` in the current tree (`App.tsx` line 60-61), so it **cannot** read `SessionContext`. Two safe options:
- Option A (preferred): Move `difficulty` computation into `SessionProvider`'s own context value — it already has `session.games[*].mistakes`. Add a `mistakeWeights: Record<string, number>` to `SessionContextValue`. Components call `useSession().mistakeWeights`.
- Option B: Keep difficulty in a separate `DifficultyProvider` that wraps inside `SessionProvider`.

Option A requires zero new files and zero new providers. It is the right choice for this project size.

**D2 contract after change:**
```ts
// hooks/useData.tsx — no change to interface
interface DataContextValue {
  states: StateEntry[];
  loading: boolean;
}

// hooks/useSession.ts — add one derived field
interface SessionContextValue {
  // ... existing fields unchanged ...
  mistakeWeights: Record<string, number>; // NEW — code → mistake count
}
```

**CodeDrop + PinRush migration:** Replace their internal `useEffect fetch('/data/states.json')` with `const { states } = useData()` — identical to how `CityStack` already works. No logic change, only the data source changes. This is the entire D2 work for those two files.

---

### D1: GameEvents Emitter + GameState Context

**Boundary:** New `lib/game-events.ts` + new `hooks/useGameState.tsx`.

**Problem being solved:** `GameTopBar` receives `streak` as a prop from `GameShellPage`, which receives it via `onStreakChange` callback from the active game. Score display in `GameTopBar` reads the session total score (persisted), not live in-game score. This creates a two-path system for the same display concern.

**Design: thin emitter, lightweight context**

The games already use `useRef` for performance — they cannot hold their mutable counters in state without causing re-render thrash on every keypress/click. The emitter pattern preserves this: refs stay local, events are fired at meaningful moments (answer submitted, streak broken, game end), and `GameStateContext` holds the *last emitted* values as React state.

```
lib/game-events.ts
  export const gameEvents = new EventTarget();
  export function emitScore(pts: number, total: number) { ... }
  export function emitStreak(streak: number) { ... }
  export function emitMistake(regionCode: string) { ... }
  export function emitCorrect(regionCode: string) { ... }
  export function emitGameReset() { ... }
```

```
hooks/useGameState.tsx
  const GameStateContext = createContext<GameStateValue | null>(null);

  interface GameStateValue {
    liveScore: number;
    liveStreak: number;
    liveMistakes: string[];
    liveCorrects: string[];
    liveStreakPeak: number;
  }

  export function GameStateProvider({ children }) {
    // subscribes to gameEvents EventTarget
    // updates React state on each event
    // provides value to context
  }

  export function useGameState() { ... }
```

**Provider placement:** `GameStateProvider` wraps only the `GameShellPage` subtree, not the entire app. Mount it inside `GameShellPage` itself or in `App.tsx` around the `/play` route. The games-only scope means it resets cleanly between sessions without global teardown complexity.

**Migration path for each game:** In `CodeDrop`, `PinRush`, `CityStack`:
1. Keep all existing `useRef` counters — no change to timing/animation logic.
2. At every `commitCorrect()` / miss handler: add `emitScore(pts, scoreRef.current)` and `emitStreak(streakRef.current)` after updating the ref.
3. Remove `onStreakChange?.(newStreak)` prop calls — `GameShellPage` no longer needs to lift streak.
4. `GameTopBar` switches from `streak` prop to `useGameState().liveStreak`.

**Key regression guard:** The `onComplete(result)` path that fires at game end is NOT changed. `GameResult` still carries `{ score, correctCount, totalCount, streakPeak, mistakes, corrects }` and `recordAttemptFull` still persists it. The emitter is additive instrumentation, not a replacement for the final result.

---

### C4: Offline Sync Queue

**Boundary:** New `lib/sync-queue.ts` (pure, no React) + thin integration in `lib/session.ts`.

**Constraint:** GitHub Pages — no server state. The leaderboard POST (`submitAttemptScore` in `lib/leaderboard.ts`) is the only network write in the app. All session data is already localStorage-first.

**Design: queue in localStorage, drain on network restore**

```
lib/sync-queue.ts
  interface QueuedSubmission {
    id: string;
    type: 'leaderboard';
    payload: AttemptScorePayload;
    enqueuedAt: string;
    retries: number;
  }

  export function enqueue(payload: AttemptScorePayload): void
  export function drainQueue(): Promise<void>  // attempts each queued item
  export function getQueueLength(): number
```

`submitAttemptScore` in `lib/leaderboard.ts` becomes:
```ts
// if offline, enqueue instead of fetch
if (!navigator.onLine) { enqueue(payload); return; }
// on success, drain any queued items
```

A `useEffect` in the root `App.tsx` (or `SessionProvider`) listens to `window.addEventListener('online', drainQueue)`. This is the entire C4 surface — no new provider needed.

**Offline indicator:** A simple `useOnlineStatus()` hook (3 lines, subscribes to `online`/`offline` window events) used by `AppLayout` or `GameTopBar` to show a small badge. No new context required.

---

### C2: Review Round Enhancement (Spaced Repetition Ordering)

**Boundary:** `features/games/ReviewRound.tsx` + session `mistakeWeights` from SessionContext.

**Current state:** `ReviewRound` already works — it reads `session.games.flatMap(g => g.mistakes)`, deduplicates, and presents as map-click questions. C2 is an ordering change: regions with more mistakes shown first, then regions only missed once.

**Integration:** `ReviewRound` calls `useSession().mistakeWeights` (added in D2/SessionContext) to sort `mistakeStates` by weight descending. No new component, no new provider. Single `useMemo` change inside `ReviewRound.tsx`.

---

### C5: Dynamic Difficulty

**Boundary:** `lib/crack-the-code.ts`, `lib/pin-it.ts`, `lib/tz-sorter.ts` question-pickers only.

**Current state:** `pickQuestions(data)` in `crack-the-code.ts` and `pickPinQuestions(data)` in `pin-it.ts` take raw `StateEntry[]` and select questions uniformly (or by category). `CityStack` uses `buildTzRounds(states)`.

**Integration:** Each picker accepts an optional `weights?: Record<string, number>` parameter. Games pass `useSession().mistakeWeights` at question generation time. Regions with higher mistake weight are more likely to appear. No structural change — just an additional parameter to pure functions.

**Regression guard:** All three pickers have existing unit tests (`crack-the-code.test.ts`, `pin-it.test.ts`, `city-sorter.test.ts`). The `weights` parameter must be optional with identical behavior when absent.

---

### Unified Cross-Game Results Page

**Boundary:** `features/results/ResultsPage.tsx` — enhancement, not replacement.

**Current state:** `ResultsPage` already reads `session.games[*]` for per-game scores, badges, and stars. `ExpeditionReport` and `CheatSheet` are already separate components.

**Change:** Add an "Expedition Summary" section aggregating:
- Total score across all 3 games (`getTotalScore(session)` — already exists in `lib/session.ts`)
- Per-region performance map (highlight regions where `mistakeWeights[code] > 0`)
- "What's Next?" action hub (C3) — links to retry, share, journal

This is additive JSX within the existing page structure.

---

## Data Flow Direction

```
Static JSON (states.json)
    → fetch (once, DataProvider)
    → sessionStorage (1-hr TTL)
    → DataProvider context [states, loading]
    → CityStack (useData — existing)
    → CodeDrop (useData — D2 migration from own fetch)
    → PinRush  (useData — D2 migration from own fetch)
    → ReviewRound (useData — existing)
    → lib pickers receive states[] + optional weights

In-game actions (keypress, click, timer-miss)
    → game useRef mutation (scoreRef, streakRef, mistakesRef)
    → gameEvents.emit() [D1 emitter — additive]
    → GameStateContext [D1 context — liveScore, liveStreak]
    → GameTopBar, ScorePopup [consume live values]

Game completion
    → onComplete(GameResult) [unchanged]
    → GameShellPage.handleGameComplete()
    → recordAttemptFull() in SessionContext
    → structuredClone(session) mutation
    → libRecordGameAttempt() pure function
    → setSession(next) → localStorage persist

Network write (leaderboard)
    → submitAttemptScore()
    → if offline: enqueue(payload) to localStorage [C4]
    → if online: fetch to Apps Script; on 'online' event: drainQueue() [C4]

Difficulty/weights
    → session.games[*].mistakes (written by recordAttemptFull)
    → SessionContextValue.mistakeWeights (derived in useMemo)
    → ReviewRound sort order [C2]
    → lib pickers weight parameter [C5]
```

---

## Recommended Build Order

### Phase 1: D2 — DataProvider Consolidation (lowest risk, zero regression path)

**Rationale:** CodeDrop and PinRush each `fetch('/data/states.json')` in a `useEffect`. Replace both with `const { states } = useData()` — exactly as CityStack already works. Zero logic change. Test: verify questions still generate correctly; the only risk is that `states` is initially `[]` and question generation must guard for that (check `if (states.length === 0) return`). CityStack already has this guard — copy the pattern.

**Dependency:** None. Can ship independently. Unlocks C5 (pickers can now receive weights at generation time).

---

### Phase 2: SessionContext mistakeWeights + C2 ReviewRound ordering

**Rationale:** `mistakeWeights` is a pure `useMemo` derived from `session.games[*].mistakes` — zero new data, zero new files. Once it exists in `SessionContextValue`, ReviewRound can sort by weight with one line change. C2 is then complete.

**Dependency:** None beyond Phase 1 for C2 itself. mistakeWeights also unlocks C5.

---

### Phase 3: C5 Dynamic Difficulty — weighted question pickers

**Rationale:** Each lib picker gets an optional `weights` param. Unit tests guard the no-weights path. Games pass `useSession().mistakeWeights` at component init. This is all inside `lib/` pure functions — no React component changes beyond the single argument at call sites.

**Dependency:** Phase 2 (mistakeWeights in SessionContext).

---

### Phase 4: D1 — GameEvents emitter + GameStateContext

**Rationale:** This is the highest structural novelty. Build it after D2/C2/C5 are stable so the games are in their final state before adding instrumentation calls. The emitter is additive — if it breaks, removing `emitScore()` calls restores the original behavior exactly. `GameTopBar` prop→context migration is the only consumer change.

**Dependency:** None technically, but doing it last minimizes the risk surface during the other phases. The existing `onStreakChange` prop path continues working until this phase is complete and verified.

**Regression guard for games:** Before emitting from game components, confirm the existing `onComplete(result)` path still fires correctly with the original data. Run the existing `scoring.test.ts` and `session.test.ts` suites.

---

### Phase 5: C4 — Offline Sync Queue

**Rationale:** Narrowly scoped to `lib/sync-queue.ts` + `lib/leaderboard.ts` + one `useEffect` in App. No game component changes. Ship last because it touches the network layer which has no unit tests; verify manually with DevTools offline mode.

**Dependency:** None technically. Last because it's the most isolated from UI concerns and can be verified without the rest of the milestone being complete.

---

### Phase 6: C3 + Unified Results Page

**Rationale:** ResultsPage changes are purely additive JSX. C3 ("What's Next?" action hub) is UI-only with no new state. Ship after all data is correct in session so the aggregation display is accurate.

**Dependency:** Phases 1-5 complete (so mistake data, difficulty weights, and all game results are accurate before display).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Replacing useRef with useState Inside Games

**What people do:** Move `scoreRef`, `streakRef`, etc. to `useState` to make them "reactive" for the GameState context.

**Why it's wrong:** These refs update on every animation frame and every keypress. Converting to state triggers re-renders at that frequency, breaking the fall animation in CodeDrop (which relies on `rAF` + imperative `setBlockTopPx` without batching) and causing visual stutter in all three games.

**Do this instead:** Keep refs as refs. Emit events at meaningful moments (answer submit, miss, game end) — not on every tick.

---

### Anti-Pattern 2: Putting GameStateProvider at App Root

**What people do:** Wrap the entire app in `GameStateProvider` to make it "available everywhere."

**Why it's wrong:** `GameStateProvider` subscribes to the `gameEvents` EventTarget and holds live in-game state. At app root it accumulates stale game events across navigation, and the "reset on game start" event becomes a footgun. The Results page, Trainer Dashboard, and Landing page have no use for live game state.

**Do this instead:** Mount `GameStateProvider` only around the `/play` route subtree — either inside `GameShellPage` or wrapping just that route in `App.tsx`. Let it unmount when the user navigates away, which automatically clears the live state.

---

### Anti-Pattern 3: Merging GameState Context into SessionContext

**What people do:** Add `liveScore`, `liveStreak` to the `Session` type or `SessionContextValue` to avoid a new provider.

**Why it's wrong:** `Session` is a persistence model — it is serialized to localStorage on every `setSession` call via `structuredClone`. Adding high-frequency mutable fields to it would serialize them needlessly on every keypress and dirty the schema.

**Do this instead:** Keep the two contexts separate by purpose: `SessionContext` = durable game history; `GameStateContext` = ephemeral in-game live state.

---

### Anti-Pattern 4: Per-Component Difficulty Fetch

**What people do:** Each game fetches its own difficulty data from a separate endpoint or re-reads localStorage independently.

**Why it's wrong:** Difficulty weights are derived from the session that is already in `SessionContext`. Fetching or re-reading creates stale divergence — a mistake recorded in game 1 wouldn't influence game 2's question ordering if each game has its own snapshot.

**Do this instead:** `mistakeWeights` lives in `SessionContextValue` as a `useMemo` derived from `session.games`. All consumers get the same live snapshot automatically.

---

### Anti-Pattern 5: Disruptive DataProvider Rewrite for Offline

**What people do:** Extend `DataProvider` to cache and serve all app data (session, leaderboard) for offline use, turning it into a general-purpose offline store.

**Why it's wrong:** The app is already localStorage-first for sessions. The only network writes are leaderboard POSTs. Expanding `DataProvider`'s scope to own offline for everything creates a single point of failure for both data fetching and network resilience.

**Do this instead:** Keep `DataProvider` scoped to `states.json` fetch (its current purpose). Offline resilience for writes lives in `lib/sync-queue.ts`. These are independent concerns.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Game components → GameStateContext | `gameEvents.emit()` calls at answer events | Games never import context directly; emitter keeps them decoupled |
| GameStateContext → GameTopBar | `useGameState()` hook replaces `streak` prop | Single consumer change |
| SessionContext → ReviewRound | `mistakeWeights` field, `completeReviewRound()` | ReviewRound already calls useSession — no new import |
| SessionContext → lib pickers | `mistakeWeights` passed as argument at call site | Pickers remain pure functions — testable without React |
| lib/sync-queue.ts → lib/leaderboard.ts | Direct import; queue checked inside `submitAttemptScore` | No React dependency; testable with fetch mock |
| DataProvider → CodeDrop + PinRush | Replace `useEffect fetch` with `useData()` | CityStack is the existing reference implementation |

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Apps Script (leaderboard) | `fetch` POST in `lib/leaderboard.ts` | Wrapped by sync-queue for offline; no auth, fire-and-forget |
| GitHub Pages (static hosting) | Vite build output to `/docs` or dist | No server routing; HashRouter required — no change |

---

## Regression Risk Map

| Change | Affected Files | Risk | Guard |
|--------|---------------|------|-------|
| D2: CodeDrop useData migration | `CodeDrop.tsx` | LOW — identical data shape | Verify `questions.length > 0` before game start; same guard CityStack uses |
| D2: PinRush useData migration | `PinRush.tsx` | LOW — identical data shape | Same guard as above |
| D1: emit calls in game handlers | `CodeDrop.tsx`, `PinRush.tsx`, `CityStack.tsx` | LOW — additive only | Existing `onComplete(result)` path untouched; run session.test.ts |
| D1: GameTopBar prop→context | `GameTopBar.tsx`, `GameShellPage.tsx` | MEDIUM — removes prop wire | Keep `streak` prop with default=0 during transition; remove after context verified |
| C5: weights param in pickers | `crack-the-code.ts`, `pin-it.ts`, `tz-sorter.ts` | LOW — optional param | All three picker test files guard the no-weights path |
| C4: sync-queue in leaderboard | `lib/leaderboard.ts` | LOW — additive branch | `navigator.onLine` check; existing submit path unchanged when online |
| C2: ReviewRound sort order | `ReviewRound.tsx` | LOW — display only | No change to state mutation; review still calls `completeReviewRound()` same as before |

---

## Sources

- Direct source analysis: `app/src/features/games/CodeDrop.tsx`, `PinRush.tsx`, `CityStack.tsx`
- Direct source analysis: `app/src/hooks/useSession.ts`, `app/src/hooks/useData.tsx`
- Direct source analysis: `app/src/features/games/GameShellPage.tsx`, `ReviewRound.tsx`
- Direct source analysis: `app/src/App.tsx`, `app/src/types/index.ts`, `app/src/lib/session.ts`
- Existing codebase architecture: `.planning/codebase/ARCHITECTURE.md` (authoritative baseline)

---
*Architecture research for: Atlas Explorer — brownfield milestone integration*
*Researched: 2026-05-20*
