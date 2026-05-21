# Atlas Explorer — Strategic Overhaul Plan

> **"Did you explore North America?"**

## The Big Picture

Atlas Explorer is a **60-minute mandatory geography training tool** for classes of ~20 new hires on laptops. It teaches US & Canada state names, postal codes, coastal/regional awareness, and timezones. The current app is functional but **lifeless** — trainees speedrun through the map training without learning, and the overall experience is "average."

This plan transforms Atlas Explorer from a flat quiz tool into a **living, breathing exploration experience** that people actually remember.

---

## What We Know (From the Grilling)

| Dimension | Current State | Target State |
|---|---|---|
| **Theme** | Spy/Intelligence ("IntelVault," "Master Screener") | 🌎 Explorer / Adventurer |
| **Vibe** | Lifeless, average | Energetic, unique, memorable |
| **Map Training** | Click 64 regions → speedrun | Genuine discovery + micro-learning |
| **Retention** | Short-term quiz performance | Long-term geography knowledge |
| **Social** | Leaderboard exists but dormant | Live wave competition (20 people) |
| **Pass Bar** | 70%, unlimited retries | Same — but make retries feel like growth, not grind |
| **Negative Language** | "Fraudulent" stamps | Positive, encouraging feedback |
| **Scope** | US + Canada | Same (future expansion possible) |

---

## Phase 0: Triage — Fix What's Broken 🚑

**Goal:** Make the app actually *work*. No UX improvements matter if buttons don't click and maps don't render.

**Time estimate:** 1-2 hours

### Fix 0A: SVG Map ViewBox (Fixes Bug #2 + #7)
> Two games are completely broken because of this one SVG issue.

#### [MODIFY] [north-america.svg](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/public/maps/north-america.svg)
- Recalculate `viewBox` from actual path data bounds (currently `-1146.98` y-offset pushes content off-screen)
- Target: tight `viewBox` like `"-189.42 -50 1157.42 830"` based on real coordinate ranges
- **Impact:** Fixes both Map Explorer training AND PinRush game in one shot

### Fix 0B: Landing Page Button Scroll (Bug #1)
#### [MODIFY] [LandingPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/landing/LandingPage.tsx)
- Add bottom padding to the form/button container so "Start" button isn't clipped on mobile viewport

### Fix 0C: CityStack Crash Guard (Bug #8)
#### [MODIFY] [GameShellPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/GameShellPage.tsx)
- Guard against `undefined` game when session has fewer games than `GAME_DEFINITIONS`
#### [MODIFY] [session.ts](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/lib/session.ts)
- Add session migration in `loadSession()` to append missing game entries when definitions grow

### Fix 0D: Enter Key Dismiss (Bug #6)
#### [MODIFY] [CodeDrop.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/CodeDrop.tsx)
- Add `useEffect` keydown listener for Enter when `correctState` is set

### Verification
- [ ] SVG map renders with all 64 regions visible and clickable
- [ ] Landing page button scrollable and clickable on all viewport heights
- [ ] Navigate to CityStack (game 3) without crash
- [ ] Press Enter to dismiss info card in CodeDrop

---

## Phase 1: The Rebrand — Explorer / Adventurer 🌎

**Goal:** Strip the spy/intelligence theme and replace it with a warm, inviting exploration narrative. The app should feel like unfolding a treasure map, not filing a case report.

**Time estimate:** 2-3 hours

### 1A: Language & Terminology Overhaul

| Old (Spy) | New (Explorer) |
|---|---|
| IntelVault | Journey Log |
| Master Screener | Trailblazer |
| Lead Analyst | Navigator |
| Specialist | Pathfinder |
| Trainee | Explorer |
| Mission | Expedition |
| Deploy / Deployment | Begin Expedition |
| "Verified" / "Fraudulent" stamps | ✅ Correct! / ❌ Try Again (warm language) |

#### [MODIFY] [session.ts](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/lib/session.ts)
- Rename `RANK_THRESHOLDS` labels: Trainee → Explorer, Specialist → Pathfinder, Lead Analyst → Navigator, Master Screener → Trailblazer
- Update rank icons to explorer-themed emojis (🧭, 🗺️, ⛰️, 🌎)

#### [MODIFY] [CodeDrop.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/CodeDrop.tsx)
- Remove `showStamp` state and all `StampBadge` references (Bug #4)
- Replace with positive feedback animations (green glow for correct, gentle shake for wrong)

#### [MODIFY] [GameIntro.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/GameIntro.tsx)
- Update mission-themed copy to expedition language

#### [DELETE] [IntelVault.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/components/layout/IntelVault.tsx)
- Remove the IntelVault sidebar component entirely — it's more hindrance than help

#### [MODIFY] [GameTopBar.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/components/layout/GameTopBar.tsx)
- Remove IntelVault toggle button
- Add a **compact progress indicator** inline in the top bar: "🗺️ 42/64 explored" or "Game 2/3"
- Clean, minimal — just enough for trainees to know where they stand

#### [MODIFY] [GameShellPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/GameShellPage.tsx)
- Remove IntelVault import, state, and render
- Remove the vault toggle from GameTopBar props

### 1B: Coast → Country Label (Bug #3)

#### [MODIFY] [StateInfoPanel.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/components/map/StateInfoPanel.tsx)
#### [MODIFY] [InfoCard.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/components/ui/InfoCard.tsx)
- Change `"Coast"` label → `"Country"` with formatted value `"United States (US)"` / `"Canada (CA)"`

### 1C: Remove Typewriter Effect (Bug #5)

> **Decision: Remove entirely.** The typewriter effect adds visual clutter without educational value.

#### [DELETE] [Typewriter.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/components/ui/Typewriter.tsx)
- Delete the Typewriter component
- Replace all usages with plain text rendering (search for `<Typewriter` across codebase)
- State names should render instantly without animation

### Verification
- [ ] No spy/intelligence language anywhere in the UI
- [ ] All ranks show explorer theme
- [ ] No "Fraudulent" or "Verified" stamps
- [ ] Country label shows correctly
- [ ] No typewriter animation or trailing `_` cursor anywhere
- [ ] IntelVault sidebar completely removed
- [ ] Progress indicator visible in top bar

---

## Phase 2: Map Training Redesign — Kill the Speedrun 🗺️

**Goal:** The 64-region exploration is the app's **biggest missed opportunity**. Currently people just click-spam to unlock games. Redesign this into genuine micro-learning moments that stick.

**Time estimate:** 4-5 hours

> [!IMPORTANT]
> This is the highest-impact phase for the "educational" goal. If trainees actually learn during map exploration, they'll perform better in games AND retain knowledge long-term.

### 2A: "Discovery Cards" — Preserve & Enforce the Approved Content

> [!CAUTION]
> **Manager-approved content — DO NOT CHANGE.** The existing `StateInfoPanel` and `InfoCard` components contain the approved card layout. All fields must remain exactly as they are.

The cards already display excellent educational content:
- **Region** badge (e.g., Pacific, Mountain)
- **State name + postal code** (e.g., "California" + "CA")
- **State Code** (detail cell)
- **Timezone** (label + abbreviation, e.g., "Pacific | PST")
- **Capital** (e.g., "Sacramento")
- **Country** ("United States (US)" / "Canada (CA)" + 🇺🇸/🇨🇦 flag)
- **Specialties** ("Known For" tags)
- **Trivia** ("Did you know?" random fact)

**The problem isn't the cards — it's that trainees speedrun past them.** The fix is to make trainees actually *engage* with the cards:

#### [MODIFY] [MapExplorerPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/training/MapExplorerPage.tsx)
- Keep using `StateInfoPanel` exactly as-is (approved content preserved)
- Add a **minimum display time** (3 seconds) before the close button can be clicked — prevents speed-clicking
- Add a subtle entrance animation (slide up from bottom or fade-in) to draw attention
- Disable clicking the next region until the current card is acknowledged

#### [MODIFY] [StateInfoPanel.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/components/map/StateInfoPanel.tsx)
- Implement the 3-second radial countdown timer on the close button
- **[Accessibility]** Add a `useEffect` keydown listener for `Escape` to always allow immediate modal dismissal, ensuring users are never trapped if they misclick

### 2B: Anti-Speedrun: "Quick Check" Micro-Quizzes

After every **8 regions explored**, present a **Quick Check** — a single-question quiz about one of the last 8 regions they just saw:
- "What's the postal code for California?" → `CA`
- "Which timezone is Texas in?" → `CST`
- "Is British Columbia in the US or Canada?" → `Canada`

This forces attention. They can't just click-spam because they know a quiz is coming.

#### [NEW] QuickCheck.tsx
- Inline quiz component that appears every 8 regions
- Simple multiple-choice (4 options)
- No score penalty — it's a learning check, not a test
- Correct: 🎉 celebration + "Nice! You're paying attention"
- Wrong: Show the answer with context, no shame

#### [MODIFY] [MapExplorerPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/training/MapExplorerPage.tsx)
- Track regions explored count, trigger QuickCheck at 8/16/24/32/40/48/56/64
- Show progress as a trail/path that fills as they explore (not just a counter)

### 2C: Regional Grouping — Guided Exploration

Instead of random clicking, guide trainees through the map in **regional clusters**:
1. **Pacific Coast** (WA, OR, CA, AK, HI, BC) → Quick Check
2. **Mountain** (MT, ID, WY, NV, UT, CO, AZ, NM, AB) → Quick Check
3. **Central/Midwest** (ND, SD, NE, KS, MN, IA, MO, WI, IL, MI, IN, OH, SK, MB, ON) → Quick Check
4. **South** (TX, OK, AR, LA, MS, AL, TN, KY, WV, VA, NC, SC, GA, FL) → Quick Check
5. **Northeast** (PA, NY, NJ, CT, RI, MA, VT, NH, ME, DE, MD, DC) → Quick Check
6. **Eastern Canada** (QC, NB, NS, PE, NL) → Quick Check
7. **Northern Territories** (YT, NT, NU) → Quick Check

Each cluster **highlights on the map** so trainees build a mental model of *regions*, not just individual states.

#### [MODIFY] [MapExplorerPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/training/MapExplorerPage.tsx)
- Add regional cluster progression
- Highlight current cluster on the SVG map
- Show cluster name and timezone as header
- Unlock next cluster after completing current one

### 2D: Progress Trail

Replace the simple "X/64 explored" counter with a visual **exploration trail** — a winding path across the continent that fills as they progress through clusters. Each cluster completion is a "checkpoint" on the trail.

#### [MODIFY] [MapExplorerPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/training/MapExplorerPage.tsx)
- Add a progress bar styled as a trail/path
- Checkpoint markers at each cluster boundary
- Current position indicator (a little explorer pin or compass icon)

### Verification
- [ ] Clicking a region shows a Discovery Card with name, code, timezone, country
- [ ] Quick Check quiz appears every ~8 regions
- [ ] Cannot skip Quick Check (must answer to continue)
- [ ] Regions are grouped by cluster with guided progression
- [ ] Progress trail visually fills as exploration continues
- [ ] Total exploration time increases from ~3 min (speedrun) to ~12-15 min (learning)

---

## Phase 3: Visual Energy Injection 💥

**Goal:** Make the app feel **alive**. The #1 complaint is "lifeless" — this phase adds motion, color, and celebration to every interaction.

**Time estimate:** 3-4 hours

> [!TIP]
> The goal isn't to add animations for the sake of it. Every animation should either **celebrate progress**, **guide attention**, or **reinforce learning**. Gratuitous motion is just annoying.

### 3A: Celebration System

#### [NEW] celebrations.ts
- Confetti burst on game pass (already partially exists — enhance it)
- Star collection animation when earning stars
- Rank-up ceremony animation (e.g., compass spinning + rank badge reveal)
- Streak counter with fire effect at 5+ streak
- Cluster completion celebration in map training

### 3B: Landing Page Energy

#### [MODIFY] [LandingPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/landing/LandingPage.tsx)
- Animated globe or map illustration as hero
- Subtle floating particles (not distracting — think gently drifting compass points or map pins)
- "Begin Expedition" button with pulse animation
- NYT-inspired clean aesthetic: strong typography, generous whitespace, restrained color

### 3C: Game UI Polish

#### [MODIFY] [CodeDrop.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/CodeDrop.tsx)
- Correct answer: satisfying green flash + 🎉 + knowledge reinforcement ("CA = California ✓")
- Wrong answer: gentle shake + reveal correct answer with context
- Streak counter with escalating visual intensity

#### [MODIFY] [PinRush.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/PinRush.tsx)
- Pin drop animation when placing answer
- Distance feedback visualization (how close was your pin?)
- Region highlight on correct answer

#### [MODIFY] [CityStack.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/CityStack.tsx)
- Stacking animation for timezone sorting
- Visual timezone bands across the screen
- Smooth drag-and-drop with haptic-style feedback

### 3D: Color Palette — NYT Games-Inspired

> **Decision: NYT Games-inspired.** Clean, sophisticated, typography-forward. Think NYT Wordle/Connections — not flashy, but unmistakably polished and premium.

Design principles:
- **Strong typography** as the primary design element (large, confident type)
- **Generous whitespace** — let content breathe
- **Restrained palette** — fewer colors, used with purpose
- **Warm neutrals** as the base, with one signature accent

| Token | Color | Usage |
|---|---|---|
| `--atlas-ink` | `#1A1A2E` | Primary text, headers |
| `--atlas-warm` | `#FAF8F5` | Page background (warm off-white) |
| `--atlas-card` | `#FFFFFF` | Card surfaces |
| `--atlas-border` | `#E5E2DC` | Subtle borders, dividers |
| `--atlas-muted` | `#787774` | Secondary text, labels |
| `--atlas-accent` | `#2E7D32` | Primary actions, correct answers, CTA |
| `--atlas-accent-light` | `#E8F5E9` | Accent backgrounds |
| `--atlas-gold` | `#F9A825` | Stars, achievements, streaks |
| `--atlas-error` | `#D32F2F` | Wrong answers (used sparingly) |
| `--atlas-error-light` | `#FFEBEE` | Error backgrounds |

Typography stack:
- **Headlines:** "Instrument Serif" or "Playfair Display" (editorial feel)
- **Body:** "Inter" or "Source Sans 3" (clean, readable)
- **Data/Codes:** "JetBrains Mono" (for postal codes, timezones)

#### [MODIFY] [index.css](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/index.css)
- Replace current color tokens with NYT-inspired palette
- Update typography to editorial stack
- Add generous spacing utilities
- Update component styles to use new tokens

#### [MODIFY] [index.html](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/index.html)
- Add Google Fonts imports for Instrument Serif / Playfair Display + Inter

### Verification
- [ ] Every correct answer has a satisfying visual/audio response
- [ ] Streak counter visible and escalates visually
- [ ] Landing page feels warm and inviting
- [ ] Color palette is consistent across all screens
- [ ] Animations are smooth (no jank on budget laptops)

---

## Phase 4: Social & Competition — Wave Energy 🏆

**Goal:** 20 people in a room should feel competitive energy. The leaderboard needs to go live and create buzz.

**Time estimate:** 3-4 hours

> [!IMPORTANT]
> This is what turns a "fine" training into a memorable one. When new hires compete and cheer, they bond AND retain more.

### 4A: Live Leaderboard Activation

#### [MODIFY] [leaderboard.ts](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/lib/leaderboard.ts)
- Activate the leaderboard for wave-based competition
- New hires in the same `waveCode` see each other's progress
- Real-time score updates (polling or manual refresh)

#### [MODIFY] [ResultsPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/results/ResultsPage.tsx)
- Show wave leaderboard on results screen
- Highlight current player's rank
- Show top 3 with podium-style display (🥇🥈🥉)
- Display rank title earned (Explorer → Pathfinder → Navigator → Trailblazer)

### 4B: Wave Code Entry & Trainer Connection

#### [MODIFY] [LandingPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/landing/LandingPage.tsx)
- Make wave code entry prominent
- Show "Joining Wave: [CODE]" with count of current participants
- Trainer name displayed as "Led by: [Name]"

### 4C: Trainer Reporting (Prep)

#### [NEW] trainer-report.ts
- Utility to generate a summary report per wave:
  - Average score, pass rate, time to complete
  - Per-game breakdown
  - Standout performers
- Export as JSON payload (for future Google Sheets / dashboard integration)

### Verification
- [ ] Two browsers with same wave code show each other on leaderboard
- [ ] Scores update after each game completion
- [ ] Results page shows wave ranking
- [ ] Trainer report generates correct summary data

---

## Phase 5: Retention Reinforcement 🧠

**Goal:** Move from "perform well during session" to "actually remember this next week." This is about long-term retention.

**Time estimate:** 2-3 hours

### 5A: "Review Snapshot" on Results Page

When a trainee finishes all games, the Results page should show a **knowledge summary** — not just scores:

#### [MODIFY] [ResultsPage.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/results/ResultsPage.tsx)
- Add "Your Weak Spots" section: regions/states they got wrong most often
- Add "Your Strengths" section: regions they nailed
- Visual map with color-coded accuracy per region (heat map style)
- Downloadable/printable one-page "cheat sheet" of all states + codes + timezones

### 5B: Knowledge Reinforcement in Game Feedback

When a trainee gets an answer wrong, don't just say "Wrong" — **teach:**

#### [MODIFY] [CodeDrop.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/CodeDrop.tsx)
#### [MODIFY] [PinRush.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/PinRush.tsx)
#### [MODIFY] [CityStack.tsx](file:///C:/Users/anoop/OneDrive/Desktop/AMZ/app/src/features/games/CityStack.tsx)
- Wrong answer feedback includes:
  - The correct answer prominently displayed
  - A brief context line ("Oregon (OR) is on the Pacific Coast, PST timezone")
  - Visual: highlight the correct region on a mini-map

### 5C: "Expedition Report" — Shareable Summary

#### [NEW] ExpeditionReport.tsx
- At the very end, generate a shareable "Expedition Report" card:
  - Player name + rank earned
  - Total score + stars
  - Number of territories mastered
  - Time to complete
  - A fun stat ("You explored North America faster than 80% of your wave!")
- Designed to be screenshot-friendly (trainees might share in team chats)

### Verification
- [ ] Results page shows weak spots and strengths
- [ ] Wrong answers in games show teaching context
- [ ] Expedition Report renders and looks screenshot-worthy
- [ ] Cheat sheet content is accurate for all 64 regions

---

## Phase Summary

| Phase | Focus | Impact | Effort |
|---|---|---|---|
| **0: Triage** | Fix 5 critical bugs | App actually works | 🟢 Low (1-2h) |
| **1: Rebrand** | Explorer theme + language + Bug #3,4,5 | Feels intentional, not generic | 🟡 Medium (2-3h) |
| **2: Map Redesign** | Kill speedrun, add micro-learning | **Highest educational impact** | 🔴 High (4-5h) |
| **3: Visual Energy** | Animations, color, celebrations | App feels alive | 🟡 Medium (3-4h) |
| **4: Social** | Leaderboard, wave competition | Room buzz, bonding | 🟡 Medium (3-4h) |
| **5: Retention** | Teaching feedback, review, report | Long-term knowledge retention | 🟢 Low-Med (2-3h) |

**Total estimate:** 15-21 hours across all phases

---

## Resolved Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Typewriter effect | ❌ **Remove entirely** — adds clutter, no educational value |
| 2 | IntelVault sidebar | ❌ **Remove sidebar** — replace with compact progress indicator in top bar |
| 3 | Regional clusters | ✅ **Confirmed** — Pacific, Mountain, Central, South, Northeast, Eastern Canada, Northern Territories |
| 4 | Color palette | 🎨 **NYT Games-inspired** — clean, sophisticated, typography-forward |
| 5 | Phase ordering | ✅ **Confirmed** — 0→1→2→3→4→5 (dependencies first) |
| 6 | Map Explorer cards | 🔒 **Manager-approved content — DO NOT CHANGE** |

---

## Files to Modify (Complete List)

| File | Phases |
|---|---|
| `app/public/maps/north-america.svg` | 0 |
| `app/src/features/landing/LandingPage.tsx` | 0, 3, 4 |
| `app/src/features/games/GameShellPage.tsx` | 0 |
| `app/src/features/games/CodeDrop.tsx` | 0, 1, 3, 5 |
| `app/src/features/games/PinRush.tsx` | 3, 5 |
| `app/src/features/games/CityStack.tsx` | 3, 5 |
| `app/src/features/games/GameIntro.tsx` | 1 |
| `app/src/features/training/MapExplorerPage.tsx` | 2 |
| `app/src/features/results/ResultsPage.tsx` | 4, 5 |
| `app/src/components/map/StateInfoPanel.tsx` | 1, 2 |
| `app/src/components/ui/InfoCard.tsx` | 1 |
| `app/src/components/layout/GameTopBar.tsx` | 1 |
| `app/src/lib/session.ts` | 0, 1 |
| `app/src/lib/leaderboard.ts` | 4 |
| `app/src/index.css` | 3 |
| `app/index.html` | 3 |

### New Files
| File | Phase |
|---|---|
| `QuickCheck.tsx` | 2 |
| `celebrations.ts` | 3 |
| `trainer-report.ts` | 4 |
| `ExpeditionReport.tsx` | 5 |

### Deleted Files
| File | Phase | Reason |
|---|---|---|
| `Typewriter.tsx` | 1 | Removed — no educational value, adds visual clutter |
| `IntelVault.tsx` | 1 | Removed — sidebar replaced by compact top bar progress indicator |
