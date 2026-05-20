# Stack Research

**Domain:** Brownfield geography-education SPA — additive libraries only
**Researched:** 2026-05-20
**Confidence:** HIGH (all critical choices verified via official docs or current npm registry data)

---

## Fixed Existing Stack (Do Not Change)

| Technology | Version | Status |
|------------|---------|--------|
| React | ^19.2.5 | Fixed |
| TypeScript | ~6.0.2 | Fixed |
| Vite | ^8.0.10 | Fixed (Rolldown-powered) |
| TailwindCSS | ^4.2.4 | Fixed |
| react-router-dom | ^7.14.2 | Fixed (HashRouter) |
| Vitest | ^4.1.5 | Fixed |
| lucide-react | ^1.16.0 | Fixed |

All six new features must be added **within** this stack. No replacements, no new frameworks.

---

## Recommended Additions

### Offline Persistence + Sync Queue (C4)

| Library | Version | Bundle | Purpose | Why |
|---------|---------|--------|---------|-----|
| `idb` | `^8.0.3` | ~3 KB | IndexedDB wrapper for sync queue + local progress | Minimal wrapper over native IndexedDB. Provides promise-based API + TypeScript `DBSchema` types. 15M+ weekly downloads, maintained by Jake Archibald. At 3 KB it adds near-zero overhead vs Dexie's 65 KB. This app only needs a sync queue (array of pending leaderboard writes) and progress persistence — no live-query reactivity, no complex indexes. idb is exactly the right scope. |

**Online/Offline indicator:** Use zero-dependency `useSyncExternalStore` + `navigator.onLine` (native browser API). No library needed.

```typescript
// useOnlineStatus.ts — no imports beyond React
function subscribe(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}
export const useOnlineStatus = () =>
  useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
```

`useSyncExternalStore` is stable in React 19 and is explicitly the React team's recommended hook for subscribing to external browser APIs. It is tear-safe under concurrent rendering — `useEffect + useState` is not.

**Do NOT use:**
- Service Worker Background Sync API — Firefox disabled it, Safari does not implement it. GitHub Pages is HTTPS-only but no server to receive synced data anyway; the leaderboard target is Google Apps Script, a direct fetch suffices when connectivity returns.
- `localForage` — adds 30 KB for a localStorage fallback shim that is unnecessary; all modern browsers supporting React 19 have IndexedDB.
- `Dexie.js` (65 KB) — overkill for a simple queue and progress blob. Reserve Dexie for apps where IndexedDB is the primary data model and you need live queries.

### Spaced Repetition Scheduling (C2)

| Library | Version | Bundle | Purpose | Why |
|---------|---------|--------|---------|-----|
| `ts-fsrs` | `^5.4.0` | ~12 KB (ESM, tree-shakeable) | FSRS v6 scheduling for review round | Only maintained TypeScript-native FSRS implementation. Supports ES modules, CJS, and UMD — fully compatible with Vite 8 / ESM. Core API is three functions: `createEmptyCard()`, `fsrs()`, `scheduler.next(card, date, rating)`. Zero mandatory dependencies (only `seedrandom` for deterministic tests). Ships typed exports directly — no `@types/` package needed. FSRS outperforms SM-2 on recall accuracy which matters for a geography learning app. |

**Node.js ≥20 requirement** is a dev/build constraint only, not a browser constraint. Vite 8 already requires Node ≥20, so this is satisfied.

**Do NOT use:**
- `sm2` or hand-rolled SM-2 — superseded algorithm, worse recall scheduling.
- `react-flashcards` or similar review UI packages — the existing game shell (`GameShellPage` `review` phase) already manages the review UI. Only the scheduling math is needed from this library.
- `@open-spaced-repetition/binding` (optimizer) — only needed if training FSRS parameters from user review logs. Not needed for MVP; the default FSRS parameters are well-calibrated for general use.

### Event Emitter / Game State Bus (D1)

| Library | Version | Bundle | Purpose | Why |
|---------|---------|--------|---------|-----|
| `mitt` | `^3.0.1` | ~200 bytes gzipped | Typed GameEvents emitter bus | At 200 bytes, mitt is essentially free. Fully typed via generic `mitt<Events>()` — TypeScript 6 strict mode compatible. The GameEvents emitter is a module-level singleton (`const gameEvents = mitt<GameEventMap>()`), not a React dependency injection concern, so no context plumbing is needed. `mitt` works outside React which is exactly what `lib/` pure-function modules need. Actively maintained (3.0.1 published, listed as stable). |

**Architecture note for D1:** The GameEvents emitter lives in `src/lib/game-events.ts` as a singleton export. React components subscribe via `useEffect` + `gameEvents.on(...)`. The single `GameState` context uses `useReducer` (dispatch is stable across renders) and exposes `[state, dispatch]` from a split-context pattern (separate `StateCtx` and `DispatchCtx`) to avoid re-renders in consumers that only call dispatch.

**Do NOT use:**
- `eventemitter3` (~1 KB) — larger than mitt, Node.js-flavored API, brings no benefit for a typed browser emitter.
- RxJS `Subject` — 40+ KB, Observable chaining overhead. The game event bus has at most ~10 event types; this is a 3-line mitt call, not a reactive stream problem.
- React Context alone as an event bus — context value changes re-render all consumers on every event, causing performance issues in the active game loop.

### Single Shared Data Fetch / DataProvider (D2)

**No new library.** React 19's native `use(promise)` hook + a module-level stable promise ref is the correct pattern for D2.

Pattern:
```typescript
// lib/data-loader.ts — created once at module load, never recreated
export const statesPromise = fetch('/Atlas-Explorer/data/states.json')
  .then(r => r.json());
```

In `DataProvider`:
```typescript
const data = use(statesPromise); // suspends until resolved; React caches the promise result
```

This eliminates duplicate fetches because the promise is a stable module-level reference. `React.use()` does not deduplicate promises — but module-level singleton promises do. Wrap `DataProvider` in a `<Suspense>` boundary at the router level.

**Do NOT use:**
- TanStack Query or SWR — 13–40 KB overhead for a static JSON file that never changes during a session. One fetch, one cache, done.
- `React.cache()` — server-only API (React Server Components + Next.js). This app is a static SPA.
- Per-component `useEffect` fetch — already causes the duplicate-fetch problem D2 is solving.

### Dynamic Difficulty (C5)

**No new library.** Difficulty ratings are a derived computation on session attempt history already stored in `localStorage` via `session.ts`. The algorithm (e.g., weighted error rate per region) is a pure function added to `src/lib/scoring.ts` or a new `src/lib/difficulty.ts`. No dependency needed.

### Post-Results Action Hub (C3)

**No new library.** C3 is a new route and UI component using existing react-router-dom `Link`/`useNavigate` and existing TailwindCSS. No additions required.

---

## Supporting: SVG Map Viewport Fixes

**No new library.** Pure CSS/SVG attribute fixes:

1. Set `viewBox` on the SVG root to match the actual coordinate bounds of the North America geometry.
2. Set `preserveAspectRatio="xMidYMid meet"` (or `xMinYMin meet` to align top-left).
3. Set CSS `width: 100%; height: 100%; display: block;` on the `<svg>` element.
4. Use a container with `position: relative; overflow: hidden;` and explicit aspect-ratio constraint if needed.

**Do NOT use:**
- `react-svg-pan-zoom` — adds pan/zoom library overhead; the existing map only needs correct viewBox alignment, not user-controlled zoom.
- `d3-zoom` — same issue, heavyweight for a static fit-to-container problem.
- `ResizeObserver`-based dynamic viewBox recalculation — not needed if `preserveAspectRatio` + CSS are set correctly. Only add `ResizeObserver` if game overlays (waypoints, pins) need pixel-accurate absolute positioning inside the SVG container.

---

## Installation

```bash
# From app/ directory
npm install idb@^8.0.3 ts-fsrs@^5.4.0 mitt@^3.0.1
```

Three packages. No dev-only additions required (all ship their own types).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| IndexedDB | `idb` 8.0.3 | `Dexie.js` 4.x | Dexie is 65 KB vs idb's 3 KB; useLiveQuery reactivity is unused in this app; schema versioning overhead not warranted for a simple queue |
| IndexedDB | `idb` 8.0.3 | `idb-keyval` 6.x | idb-keyval (295 bytes) is key→value only; a sync queue needs array semantics + multiple named stores; idb provides this with only 3 KB |
| IndexedDB | `idb` 8.0.3 | `localForage` | 30 KB shim for localStorage fallback; unnecessary since React 19 targets modern browsers |
| Spaced repetition | `ts-fsrs` 5.4.0 | SM-2 hand-rolled | FSRS is measurably superior for recall scheduling; ts-fsrs is the canonical TS implementation |
| Event emitter | `mitt` 3.0.1 | `eventemitter3` | eventemitter3 is 5x larger for no tangible benefit in this use case |
| Event emitter | `mitt` 3.0.1 | RxJS Subject | 200+ x larger; Observable chaining adds complexity for a simple event bus |
| Offline indicator | `useSyncExternalStore` (native) | `@vueuse/core useOnline` / `react-use` | React 19 has the right primitive built in; adding a library for a 10-line hook is wasteful |
| Data fetching | Module-level promise + `use()` | TanStack Query | TQ is 13 KB+ and designed for server data with refetch/pagination; static JSON with no refresh needs is a 3-line pattern |
| SVG responsive | CSS + viewBox attributes | `react-svg-pan-zoom`, `d3-zoom` | No user-controlled zoom is required; the bug is a missing/wrong viewBox, not a missing library |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Service Worker Background Sync API | Firefox disabled, Safari unimplemented; no server endpoint to replay to anyway | `idb` sync queue + `navigator.onLine` listener that drains queue on reconnect |
| `localForage` | 30 KB shim for a localStorage fallback no modern browser needs | `idb` directly |
| `Dexie.js` for this milestone | 65 KB when 3 KB (`idb`) suffices; `useLiveQuery` reactivity adds complexity with no benefit | `idb` |
| RxJS for the event bus | 40+ KB, Observable mental model for a simple pub/sub | `mitt` |
| `react-spring` / `framer-motion` (new additions) | Not in scope; existing animation is CSS/Lottie | — |
| TanStack Query / SWR | 13–40 KB for a static JSON file fetched once | Module-level singleton promise + React `use()` |
| `React.cache()` | Server Components API only; does not work in a static SPA | Module-level singleton promise reference |
| `react-svg-pan-zoom` / `d3-zoom` | No user zoom required; the bug is a missing viewBox, not missing functionality | CSS `width/height` + correct `viewBox` + `preserveAspectRatio` |
| SM-2 spaced repetition | Algorithmically inferior to FSRS for recall | `ts-fsrs` |
| `@open-spaced-repetition/binding` | Parameter optimizer — only needed after collecting real review logs | ts-fsrs default params |

---

## Version Compatibility

| Package | Requires | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `idb` ^8.0.3 | Modern browsers | TypeScript 6 ✓, Vite 8 ESM ✓ | Ships own types via `package.json` `exports`; no `@types/` needed |
| `ts-fsrs` ^5.4.0 | Node ≥20 (build), modern browsers | TypeScript 6 ✓, Vite 8 ESM ✓ | Ships own types; `seedrandom` is only dependency; ESM-first |
| `mitt` ^3.0.1 | Modern browsers | TypeScript 6 ✓, Vite 8 ESM ✓ | 200-byte ESM package; ships own `.d.ts`; no build issues |
| `useSyncExternalStore` | React ≥18 | React 19.2 ✓ | Built into React; no install |
| `React.use(promise)` | React ≥19 | React 19.2 ✓ | Built into React; stable in 19.2 |

---

## Stack Patterns by Feature

**C4 — Offline Resilience:**
- `idb` for the sync queue store and local progress store
- Native `useSyncExternalStore` + `window` online/offline events for the indicator
- Queue drains automatically when `online` fires; no service worker needed
- localStorage continues to hold session state (existing schema preserved)

**C2 — Spaced Repetition:**
- `ts-fsrs` computes next review dates and difficulty ratings per region
- Card state (due date, stability, difficulty) serializes to a flat JSON object stored in `idb` (same db as C4) or localStorage
- The existing `review` phase in `GameShellPage` surfaces whatever regions ts-fsrs marks as due

**D1 — Unified Game State Manager:**
- Module-level `mitt` emitter singleton in `src/lib/game-events.ts`
- `useReducer` in a new `GameStateProvider` with split contexts (state + dispatch separately)
- `dispatch` stable reference means child components can subscribe to dispatch without re-render churn
- `mitt` emitter used for cross-cutting events (score updates, badge unlocks) that don't belong in the reducer

**D2 — Single DataProvider:**
- Module-level stable promise for `states.json` / `cities.json` / `batches.json` in `src/lib/data-loader.ts`
- `DataProvider` calls `React.use(statesPromise)` — suspends once on first load, React caches result
- `<Suspense fallback={<MapSkeleton />}>` wraps `DataProvider` at the `App.tsx` router level

**C5 — Dynamic Difficulty:**
- Pure function in `src/lib/difficulty.ts` — no library
- Reads attempt history from session (already in localStorage via `session.ts`)
- Returns ordered region array sorted by weighted error rate
- No new React context needed; `GameShellPage` calls the function when building the question queue

**C3 — Post-Results Action Hub:**
- New route `/play/results` or enhancement of existing `ResultsPage`
- `react-router-dom` `Link` components only — no library

---

## Sources

- `idb` v8 — [GitHub README](https://github.com/jakearchibald/idb/blob/main/README.md) (HIGH confidence), npm registry (v8.0.3, 15M weekly downloads)
- `ts-fsrs` v5.4.0 — [GitHub README](https://github.com/open-spaced-repetition/ts-fsrs) (HIGH confidence), npm registry (v5.4.0, latest May 2026)
- `mitt` v3.0.1 — [GitHub README](https://github.com/developit/mitt/blob/main/README.md) (HIGH confidence), npm registry (v3.0.1, stable)
- Dexie.js v4.4.2 bundle size 65 KB — [PkgPulse Guide May 2026](https://www.pkgpulse.com/guides/dexie-vs-localforage-vs-idb-indexeddb-browser-storage-2026) (MEDIUM confidence — third-party guide, aligns with bundlephobia data)
- Offline-first IndexedDB patterns — [LogRocket offline-first 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) (MEDIUM confidence)
- `useSyncExternalStore` for `navigator.onLine` — [React official docs](https://react.dev/reference/react/useSyncExternalStore) (HIGH confidence)
- `React.use(promise)` caching behavior — [SitePoint React 19 use() patterns](https://www.sitepoint.com/react-19-use-hook-data-fetching-patterns-that-actually-work/) (MEDIUM confidence — module-level stable promise workaround is community-verified)
- Background Sync API browser support — LogRocket offline article 2025: "Firefox keeps it disabled, Safari still doesn't implement it" (MEDIUM confidence)
- SVG `preserveAspectRatio` + `viewBox` — [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio) (HIGH confidence)
- Vite 8 Rolldown architecture — [Vite 8 announcement](https://vite.dev/blog/announcing-vite8) (HIGH confidence)
- `useReducer` dispatch stable reference — [React official docs](https://react.dev/reference/react/useReducer) (HIGH confidence)

---

*Stack research for: Atlas Explorer — brownfield milestone (C2/C3/C4/C5/D1/D2 + UI fixes)*
*Researched: 2026-05-20*
