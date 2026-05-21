# V3 Implementation Status & Remaining Changes

> Generated: May 17, 2026
> Based on full codebase review of all `.tsx`, `.ts`, and `.css` files in `app/src/`

---

## What Is Already Implemented (No Action Needed)

### Track A: NYT Palette Propagation
| Item | File(s) | Status |
|------|---------|--------|
| Atlas CSS tokens (`--atlas-*`) | `index.css` | Done |
| Focus ring uses `--atlas-accent` | `index.css:57` | Done |
| Scrollbar uses atlas green | `index.css:491-496` | Done |
| Semantic typography classes | `index.css:93-108` | Done |
| StateInfoPanel repainted, COUNTRY_THEME removed | `StateInfoPanel.tsx` | Done |
| ESC closes StateInfoPanel (even before 3s timer) | `StateInfoPanel.tsx:36-44` | Done |
| GameTopBar light top bar with atlas tokens | `GameTopBar.tsx` | Done |
| TrainingTopBar atlas palette + session timer | `TrainingTopBar.tsx` | Done |
| QuickCheck atlas palette + skip button | `QuickCheck.tsx:184-192` | Done |
| QuickCheck auto-dismiss after 30s | `QuickCheck.tsx:124-130` | Done |
| QuickCheck ESC to skip | `QuickCheck.tsx:111-121` | Done |
| TrainerDashboard full atlas palette | `TrainerDashboard.tsx` | Done |
| CheatSheet with cluster/table/print modes | `CheatSheet.tsx` | Done |
| ExpeditionReport atlas palette | `ExpeditionReport.tsx` | Done |
| ResultsPage atlas palette | `ResultsPage.tsx` | Done |
| CityStack loading screen atlas palette | `CityStack.tsx:254-257` | Done |
| CodeDrop loading screen atlas palette | `CodeDrop.tsx:275-279` | Done |
| PinRush loading screen atlas palette | `PinRush.tsx:231-234` | Done |
| Font cleanup (no Nunito/Playfair in index.html) | `index.html` | Done |

### Track B: Map / Exploration
| Item | File(s) | Status |
|------|---------|--------|
| Region hover tooltip (B1) | `MapExplorerPage.tsx:454-466`, `InteractiveMap.tsx` | Done |
| Exploration trail (B2) | `exploration-trail.ts`, `InteractiveMap.tsx:282-283`, `MapExplorerPage.tsx:414` | Done |
| Cluster completion popup (B3) | `MapExplorerPage.tsx:260-271`, `index.css:776-786` | Done |
| Cluster pulse animation | `InteractiveMap.tsx` via `pulsingClusterCodes` | Done |
| Time budget bar / Pace Monitor (B4) | `MapExplorerPage.tsx:84-99, 393-404` | Done |
| Region fly-to-panel transition (D2) | `MapExplorerPage.tsx:202-239`, `index.css:291-318` | Done |

### Track C: Classroom / Competition
| Item | File(s) | Status |
|------|---------|--------|
| Session timer hook (C1) | `useSessionTimer.ts` | Done |
| Timer pill in GameTopBar | `GameTopBar.tsx:30, 56-63` | Done |
| Timer pill in TrainingTopBar | `TrainingTopBar.tsx:14, 40-47` | Done |
| Wave leaderboard widget (C2) | `WaveLeaderboardWidget.tsx` | Done |
| 30s polling, paused during animations | `WaveLeaderboardWidget.tsx:60-71` | Done |
| Collapsible, remembers state in localStorage | `WaveLeaderboardWidget.tsx:24-43` | Done |
| Trainer dashboard (C3) | `TrainerDashboard.tsx` | Done |
| Project mode toggle | `TrainerDashboard.tsx` | Done |
| Player avatar with rank ring (C4) | `PlayerAvatar.tsx` | Done |
| Rank popover with progress bar | `PlayerAvatar.tsx:102-166` | Done |

### Track D: Feedback / Celebration
| Item | File(s) | Status |
|------|---------|--------|
| Streak meter with tiers | `StreakMeter.tsx` | Done |
| Streak edge vignette (5+) | `index.css:729-753`, `StreakMeter.tsx:49-57` | Done |
| Streak gold sweep (8+) | `index.css:755-765` | Done |
| Streak ring pulse (3+) | `index.css:694-712` | Done |
| Sound system (D1) | `useAudio.tsx` | Done |
| 13 distinct sounds with fallback tones | `useAudio.tsx:4-56` | Done |
| Volume control (default 30%) | `useAudio.tsx:91`, `VolumeControl.tsx` | Done |
| Mute on prefers-reduced-motion | `useAudio.tsx:80` | Done |
| Milestone ceremony (D4) | `MapExplorerPage.tsx:469-501` | Done |
| Milestone icon spin animation | `index.css:335-348` | Done |
| Score popups | `ScorePopup.tsx` | Done |
| Particle system | `ParticleSystem.tsx` | Done |

### Track E: Editorial / Content
| Item | File(s) | Status |
|------|---------|--------|
| Voice rewrite (E1) — main screens | `LandingPage.tsx`, `MapExplorerPage.tsx`, `ExpeditionReport.tsx`, `GameTopBar.tsx` | Done |
| No "Initialize Expedition" / "tactical" / "Phase 00" / "v4.0.0-PRO" / "ID: EXP-01" / "Official Document" in main screens | Verified via grep | Done |
| Region of the day (E2) | `region-of-day.ts`, `LandingPage.tsx:418-449` | Done |
| Cheat sheet (E3) | `CheatSheet.tsx` | Done |
| Trivia layer — 2-3 facts + cycle + save (E4) | `StateInfoPanel.tsx:46-68, 176-213` | Done |
| Journal entries visible in ResultsPage | `ResultsPage.tsx:372-393` | Done |

---

## Remaining Changes (Action Required)

### A. Legacy Color Residue — Low Effort, High Impact

#### A1. PinRush timer gradient uses `#FF9900`
**File:** `app/src/features/games/PinRush.tsx:309`
```
'linear-gradient(90deg, #F59E0B, #FF9900)'
```
→ Fix: Replace with `linear-gradient(90deg, var(--atlas-gold), var(--atlas-accent))` or the literal `#F9A825` → `#2E7D32`.

#### A2. LottiePlayer confetti uses old palette
**File:** `app/src/components/ui/LottiePlayer.tsx:13`
```
const CONFETTI_COLORS = ['#FF9900', '#00A8A2', '#232F3E', '#FEBD69', '#35D07F', '#FF6577'];
```
→ Fix: Replace with atlas palette: `['#F9A825', '#2E7D32', '#1A1A2E', '#E5E2DC', '#E8F5E9', '#D32F2F']`.

#### A3. MapExplorer intro left column uses dark navy background
**File:** `app/src/features/training/MapExplorerPage.tsx:296`
```
<div className="relative flex items-center justify-center bg-atlas-ink p-8 ...">
```
`bg-atlas-ink` is `#1A1A2E` (near-black). The intro screen's left half is dark while the right half is `bg-atlas-card` (white). This creates a visual split that feels like two different apps.
→ Fix: Change to `bg-atlas-warm` or a subtle gradient using atlas tokens. If the dark background is intentional for map contrast, add a thin `border-b border-atlas-border` to visually separate it as a deliberate design choice, not an accident.

#### A4. Passport drawer uses dark navy + white text (spy aesthetic residue)
**File:** `app/src/features/training/MapExplorerPage.tsx:615-729`
The Passport drawer uses `bg-atlas-ink` (dark navy) with `text-white` and `bg-white/5` panels. This is the one place in the app that still looks like the old spy theme.
→ Fix: Repaint the Passport drawer to use `bg-atlas-warm` with `bg-atlas-card` panels and `text-atlas-ink`. The stats bars should use atlas token fills, not `bg-white/10`.

### B. Voice & Tone Residue — Copy-Only Changes

#### B1. ResultsPage still uses spy language
**File:** `app/src/features/results/ResultsPage.tsx`

| Line | Current Copy | Suggested Replacement |
|------|-------------|----------------------|
| 428 | `ID: {game.key.toUpperCase()}` | Remove — system ID on user-facing surface |
| 437 | `Secured` / `Unstable` | `Passed` / `Needs Review` |
| 440 | `INTELLIGENCE` | `Score` |
| 444 | `PRECISION` | `Accuracy` |
| 477 | `Your Weak Spots` | `Regions to Review` |
| 478 | `Regions needing review` | Keep — already good |
| 499 | `Flawless Navigation` | `All Regions Mastered` |
| 548 | `Regional accuracy analysis & reinforcement telemetry` | `How you did across North America` |
| 549 | `Color-coded telemetry across North America` | `Your exploration map` |
| 672 | `ATLAS EXPLORER // END OF EXPEDITION LOG` | `Atlas Explorer — Expedition Complete` |

#### B2. MapExplorer Passport drawer uses spy language
**File:** `app/src/features/training/MapExplorerPage.tsx`

| Line | Current Copy | Suggested Replacement |
|------|-------------|----------------------|
| 626 | `Atlas Passport Dossier` | `Atlas Passport` |
| 627 | `Official Reconnaissance Logbook` | `Your Exploration Progress` |
| 641 | `Sovereign Nations` | `Countries` |
| 664 | `Chrono Zones` | `Timezones` |
| 689 | `Coastal Regions` | Keep — already good |
| 713 | `Regional Note` | Keep — already good |

#### B3. MapExplorer intro still uses "Training Phase 01" and "territories"
**File:** `app/src/features/training/MapExplorerPage.tsx`

| Line | Current Copy | Suggested Replacement |
|------|-------------|----------------------|
| 328 | `Training Phase 01` | `Explore the Map` |
| 334 | `geopolitical landscape` | `geography` |
| 339 | `Interactive Map` | Keep |
| 344 | `Click territories to unlock geographic context` | `Click regions to discover facts and timezones` |
| 353 | `Scan and memorize standard timezone alignments` | `Learn which states share each timezone` |
| 375 | `territories explored` | `regions explored` |
| 537 | `Select territories to reveal regional context` | `Click a region to learn more` |
| 544 | `Reconnaissance` | `Progress` |
| 723 | `Select territories on the map to unlock regional notes and trivia insights` | `Explore regions on the map to discover facts` |

#### B4. CodeDrop uses "Ocean Descent" spy-adjacent language
**File:** `app/src/features/games/CodeDrop.tsx`

| Line | Current Copy | Suggested Replacement |
|------|-------------|----------------------|
| 319 | `Ocean Descent` | `Code Challenge` |
| 320 | `Depth:` | `Question:` |
| 341 | `Code Prompt` | `Region Name` |
| 377 | `Code Cipher` | `Enter Postal Code` |
| 389 | `Transmitting...` | `Checking...` |
| 389 | `Commit Key` | `Submit` |
| 389 | `Type the code` | `Type the postal code` |

#### B5. PinRush uses "Desert Expedition" language
**File:** `app/src/features/games/PinRush.tsx`

| Line | Current Copy | Suggested Replacement |
|------|-------------|----------------------|
| 276 | `Desert Expedition` | `Map Challenge` |
| 284 | `POINTS` / `STREAK` / `OBJECTIVE` | Keep — these are fine |
| 325 | `Map Target` | `Find on Map` |

#### B6. CityStack uses "Zone Sorting" language
**File:** `app/src/features/games/CityStack.tsx`

| Line | Current Copy | Suggested Replacement |
|------|-------------|----------------------|
| 297 | `Tz Sorter` | `Timezone Sort` |
| 298 | `Zone Sorting` | `Sort by Timezone` |

### C. Missing Features from V3 Plan

#### C1. No first-run guided tour
**Impact:** New players land on MapExplorer with no explanation of how to interact.
→ Fix: Add a 3-step overlay on first session only (check `localStorage.getItem('atlas_tour_seen')`):
1. "Click any region on the map to learn about it" (highlights a region)
2. "Read the facts, then click another" (highlights the info panel)
3. "Explore all 64 regions, then test your knowledge!" (highlights the progress bar)
Auto-dismisses after 15 seconds or on click.

#### C2. No spaced repetition / review round
**Impact:** The game measures "did you answer correctly now?" but never resurfaces mistakes.
→ Fix: In the final 5 minutes of the session (or after all 3 games), show a "Review Round" featuring only the regions the player got wrong. Pull from `session.games[].mistakes[]`. This is the highest-leverage learning feature not yet implemented.

#### C3. No post-results action hub
**Impact:** ResultsPage ends with "Start New Expedition" — no contextual next steps.
→ Fix: After the action buttons, add a "What's Next?" section with:
- "Review your weak spots" → scrolls to Weak Spots section
- "Play your lowest-scoring game again" → links to that game with `?retry=gameKey`
- "Compare to wave average" → shows how their score compares to leaderboard median
- "Browse your saved journal entries" → scrolls to journal section

#### C4. No offline resilience
**Impact:** If classroom WiFi drops, leaderboard fetches fail silently and progress could be lost.
→ Fix: Add a `syncQueue` in `session.ts` that stores game results in localStorage when offline. On reconnect, flush the queue to the server. Show a small "offline — progress saved locally" indicator in the top bar when `navigator.onLine` is false.

#### C5. No dynamic difficulty
**Impact:** All regions are presented equally. Alaska (obvious) gets the same treatment as distinguishing Iowa from Illinois.
→ Fix: Track a hidden "difficulty rating" per region based on wave-wide error rates. Start each game with high-salience regions (coastal, large, unique timezones). As accuracy improves, introduce harder discriminations. This can be a Phase 4 feature — not critical for V3.

### D. Architecture Gaps

#### D1. Game state is fragmented
**Impact:** Each game tracks its own scoring, streaks, and results in local refs. The trainer dashboard may not capture everything accurately.
→ Fix: Introduce a `GameEvents` emitter pattern. Each game calls `emit('game:complete', { gameKey, score, streakPeak, mistakes, corrects })` which flows into a single `GameState` context. This is a larger refactor — recommend scoping to a separate PR after V3 ships.

#### D2. `states.json` fetched independently by each component
**Impact:** MapExplorer, CodeDrop, PinRush, CityStack, LandingPage, and ResultsPage all fetch `states.json` separately.
→ Fix: Fetch once in `App.tsx` or a `DataProvider` context, share via React context. Cache in `sessionStorage` with a 1-hour TTL.

---

## Priority Order for Remaining Work

| Priority | Item | Effort | Reason |
|----------|------|--------|--------|
| **P0** | B1-B6: Voice & tone copy sweep | 2h | User-facing language is the most visible gap |
| **P0** | A1-A2: Legacy color residue | 30min | Quick wins, eliminates visual inconsistency |
| **P1** | A3-A4: MapExplorer intro/Passport repaint | 1h | These are the two screens that still look "old theme" |
| **P1** | C1: First-run guided tour | 2h | Critical for new player onboarding |
| **P2** | C2: Spaced repetition / review round | 3h | Highest-leverage learning feature missing |
| **P2** | C3: Post-results action hub | 1h | Improves re-engagement |
| **P3** | C4: Offline resilience | 2h | Important for classroom reliability |
| **P3** | D2: Single `states.json` fetch | 1h | Performance improvement |
| **P4** | C5: Dynamic difficulty | 4h | Phase 4 feature, not V3-critical |
| **P4** | D1: Unified game state manager | 6h | Larger refactor, separate PR |

**Total V3 completion effort: ~17 hours** (P0-P3 only, excluding P4)

---

## Verification Checklist

After applying remaining changes, verify these screens:

1. **LandingPage** — Region of the day card visible, no spy language
2. **MapExplorer intro** — Warm background (not dark navy), explorer language throughout
3. **MapExplorer exploring** — Hover tooltip works, trail draws on click, Pace Monitor visible, Passport uses light theme
4. **StateInfoPanel** — ESC closes, 2-3 trivia facts visible, "Save to journal" works
5. **QuickCheck** — Skip button present, atlas palette, auto-dismiss after 30s
6. **CodeDrop** — Explorer language (not "Ocean Descent"/"Transmitting"), atlas tokens for UI chrome
7. **PinRush** — Timer gradient uses atlas colors, explorer language
8. **CityStack** — Explorer language, atlas tokens for UI chrome
9. **GameTopBar** — Light top bar, session timer pill, volume control, streak meter, player avatar
10. **ResultsPage** — No spy language ("Intelligence", "Precision", "ID:"), weak spots/strengths/heatmap visible, action buttons present
11. **ExpeditionReport** — Light editorial style, no "Official Document" / system IDs
12. **TrainerDashboard** — Opens at `/trainer?wave=XXX`, shows live data, project mode works
13. **WaveLeaderboardWidget** — Visible bottom-right during games, polls every 30s, collapsible
