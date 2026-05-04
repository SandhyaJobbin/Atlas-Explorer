# AMZ Atlas Explorer: React Migration + Training Zones + Timezones

## Context

The Atlas Explorer is a geography learning game (vanilla JS, 11 modules, 2 HTML files, 3 CSS files) with 3 mini-games: Code Drop, Pin Rush, City Stack. The user wants to:

1. Add **Training Zones** (Interactive Map + Geo Tiles) as mandatory learning steps before games
2. Use **real geographic SVG maps** everywhere (not rectangle grids)
3. Add **timezone data** (PST/CST/EST, coast designations) to states and quiz questions
4. **Migrate to React + TypeScript + Tailwind CSS** incrementally

Key decisions from user:
- Train-then-Play flow (must click all 64 states/provinces to unlock games)
- Two sequential training levels (Map Explorer -> Geo Tiles)
- Skip Zone 3 quiz from reference HTML -- quizzes stay in games only
- Timezone info in training panels + as quiz questions in games
- Incremental migration: full app shell first, then fill in screens

---

## Phase 0: Scaffold Vite + React + TS + Tailwind

Create `app/` subdirectory alongside existing code.

```bash
npm create vite@latest app -- --template react-ts
cd app && npm install react-router-dom tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Configure:**
- `app/vite.config.ts` — Tailwind plugin, `@/` alias to `src/`
- `app/tailwind.config.ts` — map existing design tokens from `css/styles.css`:
  - Colors: `geo-paper: #F5F0E8`, `geo-ink: #2D3B2F`, `amz-dark: #232F3E`, `amz-orange: #FF9900`, `amz-amber: #FEBD69`
  - Font: Inter
- Copy/symlink `data/`, `maps/`, `assets/` into `app/public/`
- Add scripts to root `package.json`: `"dev": "cd app && npx vite"`

**File structure:**
```
app/src/
  main.tsx, App.tsx, index.css
  types/index.ts
  hooks/useSession.ts
  lib/          -- pure logic (scoring, badges, session, game logic)
  components/   -- reusable UI (InteractiveMap, StateTile, etc.)
  features/     -- page-level components (training/, games/, results/, landing/)
```

---

## Phase 1: Types + Data Layer

### 1a. Type definitions — `app/src/types/index.ts`

Key new types:
- `StateEntry` — add `capital`, `timezone` (PST/EST/etc), `timezoneLabel` (Pacific/Eastern), `coast` (West Coast/East Coast/Inland), `specialties: string[]`
- `TrainingProgress` — `{ mapExplorerClicked: string[], geoTilesClicked: string[], completed: boolean }`
- `Session` — add `training: TrainingProgress` field

### 1b. Enrich `data/states.json`

Add to all 64 entries: `capital`, `timezone`, `timezoneLabel`, `coast`, `specialties[]`

Example:
```json
{
  "code": "CA",
  "name": "California",
  "country": "US",
  "region": "West",
  "common": true,
  "capital": "Sacramento",
  "timezone": "PST",
  "timezoneLabel": "Pacific",
  "coast": "West Coast",
  "specialties": ["Hollywood", "Silicon Valley", "Golden Gate Bridge"]
}
```

Split-timezone states (IN, AZ, etc.) use the dominant/official timezone.

### 1c. Port pure-logic modules to TypeScript

| Source | Target | Changes |
|--------|--------|---------|
| `js/scoring.js` | `app/src/lib/scoring.ts` | Add types only |
| `js/badges.js` | `app/src/lib/badges.ts` | Add types only |
| `js/session.js` | `app/src/lib/session.ts` | Add types + `training` field + `updateTraining()` |
| `js/flow-ui.js` | `app/src/lib/flow-ui.ts` | Extract pure logic, remove DOM parts |
| `js/leaderboard.js` | `app/src/lib/leaderboard.ts` | Extract API functions only |

**Critical files:**
- `js/session.js` — core state management, all data contracts
- `js/scoring.js` — pass/fail thresholds (70%), star calculation
- `js/badges.js` — 8 badge definitions and evaluation logic

---

## Phase 2: App Shell + Routing + Session Context

### Routes (`app/src/App.tsx`)

```
/                  -> LandingPage
/train/map         -> MapExplorerPage    (Training Zone 1)
/train/tiles       -> GeoTilesPage       (Training Zone 2)
/train/complete    -> TrainingCompletePage
/play              -> GameShellPage      (intro + gameplay)
/play/results      -> ResultsPage
```

**Route guards:**
- `/play/*` redirects to `/train/map` if training not completed
- `/train/*` redirects to `/` if no session

### Session Context (`app/src/hooks/useSession.ts`)

React context wrapping localStorage session logic:
- `session`, `createSession()`, `saveSession()`
- `updateTraining(type: 'map' | 'tiles', code: string)` — adds clicked code
- `isTrainingComplete()` — checks both arrays have all 64 codes
- `recordGameAttempt()` — wraps existing logic

### Layout Components

- `AppLayout.tsx` — page wrapper with background theming
- `GameTopBar.tsx` — mirrors existing game header (brand, score, level)
- `TrainingTopBar.tsx` — shows training progress (X/64 explored)

---

## Phase 3: Training Zone 1 — Interactive Map Explorer

**Goal:** Click states/provinces on real SVG map, see info panel with timezone data.

### Key Component: `InteractiveMap` (reused by Pin Rush later)

```typescript
// app/src/components/map/InteractiveMap.tsx
interface InteractiveMapProps {
  onRegionClick: (code: string) => void;
  highlightedCodes?: string[];    // already-clicked regions
  activeCode?: string | null;      // currently selected
  mode?: 'explore' | 'gameplay';
}
```

- Fetches `maps/north-america.svg` via `fetch()`, injects with `dangerouslySetInnerHTML`
- `useEffect` attaches click handlers to `.atlas-region` elements via ref
- Highlighted regions get teal fill, active gets bright orange
- Caches SVG in module-level variable (never re-fetch)

**Reuses existing:** `maps/north-america.svg` (already has `data-code` attributes on all 64 regions in `<g id="canada">` and `<g id="usa">` groups)

### StateInfoPanel

Shows on region click:
- Name, abbreviation code, capital city
- Timezone: code + label (e.g., "PST — Pacific")
- Coast designation, region
- Specialties as colored chips
- Country flag (US/CA)

### Completion

- Progress bar: "42/64 explored"
- Must click all 64 to proceed to Zone 2
- Calls `useSession().updateTraining('map', code)` on each click

---

## Phase 4: Training Zone 2 — Geographic Tiles

**Goal:** Grid of 64 clickable tile cards, one per state/province.

### StateTile Component

Each tile shows:
- State abbreviation (large), name, country indicator
- Timezone badge (color-coded: PST=blue, MST=orange, CST=green, EST=purple)
- Unvisited (muted) -> Visited (colored) -> Active (expanded info)

### Layout

- Tailwind grid: `grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3`
- Filter tabs: All | US | Canada | by timezone | by region
- Progress bar: "52/64 tiles explored"

### Completion

- Must click all 64 tiles
- Celebration animation on completion, navigate to `/train/complete`

---

## Phase 5: Training Complete Gate

**TrainingCompletePage:**
- Celebration animation (confetti)
- Summary: "You explored all 64 states and provinces"
- Timezone breakdown stats
- "Start the Games" button -> `/play`

**Route guard:** `/play` checks `session.training.completed === true`

---

## Phase 6: Game Shell + Interstitials

Port game orchestration from `js/main.js` to React.

### GameShell state machine (`useReducer`)

```typescript
type GamePhase =
  | { phase: 'intro'; gameIndex: number }
  | { phase: 'playing'; gameIndex: number; isRetry: boolean }
  | { phase: 'pass'; gameIndex: number }
  | { phase: 'fail'; gameIndex: number }
  | { phase: 'results' };
```

### Components

- `GameShell.tsx` — orchestrator (replaces `main.js`)
- `GameIntro.tsx` — mission briefing (replaces `renderIntro()`)
- `PassInterstitial.tsx` — pass screen with stars/confetti
- `FailInterstitial.tsx` — retry screen with countdown

**Critical file:** `js/main.js` — contains all transition logic to decompose

---

## Phase 7: Game Components

### 7a. Code Drop (`app/src/features/games/CodeDrop.tsx`)

- Port from `js/crack-the-code.js`
- Extract pure logic to `lib/crack-the-code.ts`: `pickQuestions()`, `buildChoices()`, `checkAnswer()`
- Falling block animation via CSS + React state
- Timer via `useEffect` + `requestAnimationFrame`
- **NEW: Add ~3 timezone questions** ("Which timezone is [State] in?" with timezone code choices)

### 7b. Pin Rush (`app/src/features/games/PinRush.tsx`)

- Port from `js/pin-it.js`
- **Reuses `<InteractiveMap>` from Phase 3** in `mode="gameplay"`
- Extract pure logic to `lib/pin-it.ts`: `pickPinQuestions()`, `checkMapClick()`
- **NEW: Add ~2 timezone questions** ("Find a state in the Pacific timezone")

### 7c. City Stack (`app/src/features/games/CityStack.tsx`)

- Port from `js/city-sorter.js`
- Extract pure logic to `lib/city-sorter.ts`
- Drag-and-drop with native HTML5 events or `@dnd-kit/core`

Interface for all games:
```typescript
interface GameProps {
  onComplete: (result: {
    score: number;
    correctCount: number;
    totalCount: number;
    streakPeak: number;
  }) => void;
  isRetry: boolean;
}
```

---

## Phase 8: Results, Badges, Leaderboard

- `ResultsPage.tsx` — ports `js/results.js` `mountResults()`
- `BadgeShelf.tsx` + `BadgeCard.tsx` — badge display
- `Leaderboard.tsx` — ports leaderboard rendering
- `AnimatedCount.tsx`, `StarStrip.tsx`, `Confetti.tsx` — UI effects

---

## Phase 9: Landing Page

- `LandingPage.tsx` — ports `index.html`
- `SignUpForm.tsx` — name/wave code/trainer inputs
- Shows **5 steps** in preview (2 training + 3 games)

---

## Phase 10: Testing

Replace custom test runner with Vitest + React Testing Library.

Port all existing tests from `tests/` to `app/src/**/__tests__/`.

New tests:
- Training zone components (MapExplorer, GeoTiles)
- Session context with training progress
- Route guards (training gate)
- Timezone quiz question generation

---

## Verification Plan

1. `cd app && npm run dev` — app starts without errors
2. Landing page: sign up creates session in localStorage
3. Training Zone 1: click regions on SVG map, info panel shows timezone data, progress tracks
4. Training Zone 2: click all tiles, filters work, progress tracks
5. Training gate: can't access `/play` until all 64 states clicked in both zones
6. Games play correctly: Code Drop, Pin Rush (reuses same SVG map), City Stack
7. Timezone quiz questions appear in Code Drop and Pin Rush
8. Pass/fail interstitials and retry flow work
9. Results page shows scores, badges, leaderboard
10. `cd app && npx vitest run` — all tests pass
11. Session persists across page refresh (localStorage)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `js/session.js` | Core state management, data contracts |
| `js/scoring.js` | Pass/fail thresholds (70%), star calculation |
| `js/badges.js` | 8 badge definitions and evaluation logic |
| `js/main.js` | Game orchestration, all transition logic |
| `js/crack-the-code.js` | Code Drop game logic |
| `js/pin-it.js` | Pin Rush game + map interaction |
| `js/city-sorter.js` | City Stack drag-and-drop game |
| `js/results.js` | Results page rendering |
| `js/leaderboard.js` | Leaderboard API + local fallback |
| `data/states.json` | 64 state/province entries (needs enrichment) |
| `maps/north-america.svg` | SVG map with `data-code` on all 64 regions |

## Design Tokens (from `css/styles.css`)

```css
--geo-paper: #F5F0E8;
--geo-ink: #2D3B2F;
--amz-dark: #232F3E;
--amz-orange: #FF9900;
--amz-amber: #FEBD69;
--amz-teal: #00A8A2;
--pass-green: #35D07F;
--red: #FF6577;
```
