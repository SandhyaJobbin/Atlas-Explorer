# Design Critique — Atlas Explorer (Plan + Code + Screenshots)

## Context

You shared two plan files (V1 → V2) and asked me to design-critique the existing game. V2 is the updated version of V1 (V2 contains V1's 8 bug fixes as Phase 0, then adds Phases 1-5 for rebrand/redesign/social/retention). Several V2 items are already in the codebase (`QuickCheck.tsx`, `ExpeditionReport.tsx`, `celebrations.ts`, `trainer-report.ts` exist; `Typewriter.tsx` is deleted; multiple components modified).

**Target context** (drives the critique):
- **Desktop-only**, 60-minute mandatory classroom training, ~20 trainees per wave, on laptops with possibly a projector.
- "Lifeless, average" is the user complaint V2 is trying to fix.
- "Did you explore North America?" is the north-star question — the app must teach, not just quiz.

I read: `LandingPage.tsx`, `MapExplorerPage.tsx`, `QuickCheck.tsx`, `StateInfoPanel.tsx`, `CodeDrop.tsx` (head), `PinRush.tsx` (head), `ResultsPage.tsx` (head), `ExpeditionReport.tsx` (head), `GameTopBar.tsx`, `index.css`, `index.html`.

This file is **the critique itself**, structured in three parts:
1. Plan critique (V2 as a strategy document)
2. Code critique (what's been implemented)
3. Screenshot review workflow (for when you share screens)

---

## Part 1: V2 Plan Critique

### Strengths
- **Clear phased structure** (0 Triage → 1 Rebrand → 2 Map → 3 Visual → 4 Social → 5 Retention) with effort estimates and "Resolved Decisions" table — easy to scan and execute against.
- **Explicit "manager-approved DO NOT CHANGE" guard** on `StateInfoPanel` / `InfoCard` content — protects you from accidental scope creep.
- **Phase 2 is the strongest section**: anti-speedrun (3-second card hold + Quick Checks every 8 regions + regional clusters + progress trail) directly attacks the root cause of "trainees speedrun, learn nothing."
- **Bug fixes folded into Phase 0** rather than dangling separately — V2 correctly absorbs V1.

### Issues with the V2 Plan

1. **[Critical] _Consistency_ — Internal contradiction about IntelVault.tsx.** Phase 1A says "DELETE IntelVault.tsx" (line 94). Phase 1B says "MODIFY IntelVault.tsx" for Coast→Country (line 110). The plan can't both delete and modify the same file. Pick one.
   → Fix: Delete IntelVault entirely (decision is already in Resolved Decisions row 2). Remove the Phase 1B reference to it; Coast→Country only needs `StateInfoPanel.tsx` and `InfoCard.tsx`.

2. **[Critical] _Scope_ — "NYT-inspired palette" is a Phase 3 task but the Phase 1 rebrand (renaming Trainee → Explorer, removing IntelVault, etc.) ships before it.** That means Phase 1 inherits the old colors and has to be re-themed in Phase 3. You'll do every component twice.
   → Fix: Move the palette/typography swap (current Phase 3D) up to Phase 1 — *before* you do the language/naming pass. Rebrand = visual + verbal at the same time, or it feels inconsistent for everyone testing between phases.

3. **[Major] _Risk_ — 15-21h estimate is optimistic given Phase 2's scope.** Phase 2 alone is "QuickCheck + regional clusters with map highlighting + progress trail + minimum-display-time + cluster celebrations + objectives unlock gating" — that's a 1-2 day feature build, not 4-5 hours.
   → Fix: Re-estimate Phase 2 at 8-12h. If time-boxed, ship `QuickCheck` + minimum display time first (the two highest-impact anti-speedrun pieces) and treat regional cluster guided progression as a stretch.

4. **[Major] _Missing requirement_ — No design constraints for projector/classroom viewing.** 20 trainees in a room, a trainer presenting on a projector — fonts at 8-11px (very common in the current code) will be unreadable from the back row.
   → Fix: Add a "Classroom display constraint" section to Phase 3: minimum body font 14px, minimum label 11px (not 8-10px), high contrast on key signals (score, timer, current question). This is essential since you're desktop-only and instructor-led.

5. **[Major] _Missing requirement_ — Keyboard navigation isn't called out anywhere.** Desktop-only app, 60-minute attention-test → trainees will absolutely use Enter/Tab/Space. Plan only mentions Enter for one bug fix (CodeDrop card dismiss). Every modal (Quick Check, StateInfoPanel, BadgeShelf, milestone popup) needs ESC to close and Enter to confirm.
   → Fix: Add "Keyboard navigation pass" as Phase 1C or a cross-cutting concern: ESC closes any overlay, Enter advances primary CTA, Tab order is sensible, focus returns to the originator on close.

6. **[Major] _Architecture_ — `trainer-report.ts` is described as "Export as JSON payload (for future Google Sheets / dashboard integration)" with no transport/storage decision.** This will be useless to a trainer unless they can actually see the report. Right now there's no backend.
   → Fix: Either (a) downscope to "downloadable JSON the trainer copies after the wave," or (b) commit to a transport (Firebase / Google Sheets webhook / a simple `fetch` to an endpoint). Pick one and own it.

7. **[Minor] _Voice_ — V2 says "warm, inviting exploration narrative" but proposes specifics like "Initialize Expedition", "Phase 00 · Atlas calibration", "v4.0.0-PRO" (current code), "ID: EXP-01" (ExpeditionReport).** These read like NASA mission control, not National Geographic. They're closer to the old spy theme than the explorer rebrand.
   → Fix: Add a tiny voice-and-tone style guide as part of Phase 1A: explorer voice is "let's go discover X" not "initiate protocol Y." Replace "Initialize Expedition" with "Begin Your Expedition" or "Start Exploring," drop the version numbers and IDs from the user-facing surface.

8. **[Minor] _Decision missing_ — Plan never says what happens if someone gets a Quick Check wrong.** Phase 2B says "no score penalty," but does the trainee retry? See the answer and move on? Get the next region's card preview?
   → Fix: Specify: wrong answer → show explanation card → button "Continue Exploration" → no retry, just keep going. (This is what `QuickCheck.tsx` already does — codify it in the plan to lock it in.)

9. **[Minor] _Gap_ — No plan for offline/poor-wifi.** Classroom wifi is unreliable; mandatory training shouldn't fail. Phase 4 leaderboard requires network.
   → Fix: Add to Phase 4 verification: leaderboard fetch failures must not block game progression. Score gets cached locally and submitted when network returns.

### Summary of plan critique
V2 is a solid strategy document with one structural fix needed (palette swap must precede or coincide with the rebrand, not follow it) and one internal contradiction (IntelVault delete vs modify). Three under-specified areas — classroom display constraints, keyboard nav, trainer-report transport — should be filled in before execution.

---

## Part 2: Code Critique (Current Implementation)

The single biggest finding cuts across every file:

### 🚨 Cross-cutting issue: Palette schism

The V2 plan committed to a single "NYT Games-inspired" palette (warm off-white #FAF8F5, ink #1A1A2E, accent green #2E7D32, gold #F9A825). The `--atlas-*` tokens are defined in `index.css`. **But only LandingPage actually uses them.** Every other screen has drifted:

| Screen | Palette used | NYT-compliant? |
|---|---|---|
| `LandingPage.tsx` | `#FAF8F5`, `#1A1A2E`, `#2E7D32`, `#F9A825`, `#E5E2DC` | ✅ Yes |
| `MapExplorerPage.tsx` | `#232F3E` navy, `#00A8A2` teal, `#FEBD69` amber, `#35D07F` green | ❌ Old retro/arcade |
| `StateInfoPanel.tsx` | `#232F3E`, `#C41E3A` (Canada red), `#F5F0E8` | ❌ Old retro/arcade |
| `QuickCheck.tsx` | `#00A8A2` teal, `#232F3E`, `bg-red-100/border-red-500` Tailwind | ❌ Old retro/arcade |
| `GameTopBar.tsx` | `#0c120e` near-black, `#FF9900` Amazon orange | ❌ Old retro/arcade |
| `ExpeditionReport.tsx` | `#10B981` emerald, `#F59E0B` amber, dark gradients | ❌ Third palette |
| `PinRush.tsx` TZ_BG | `#3B82F6/F97316/22C55E/A855F7/0EA5E9/EC4899/14B8A6/EF4444` Tailwind | ❌ Default Tailwind |
| `index.css` | Defines `--atlas-*` tokens, but components don't reference them | N/A |

A trainee moving Landing → MapExplorer → CodeDrop → Results sees **four different visual identities** in 60 minutes. This is the #1 reason the app feels "average" — there is no single design language to recognize and trust.

### Critique list (severity-ordered)

1. **[Critical]** _Consistency & Polish_ — **Palette schism described above.** App reads as four separate apps stitched together.
   → Fix: Phase 1 should swap the palette across all surfaces before anything else, and components must reference `var(--atlas-*)` tokens, not hardcoded hex. Audit `Grep "#[0-9A-Fa-f]{6}"` and replace literals.

2. **[Critical]** _Accessibility_ — **`StateInfoPanel` disables the close button for 3 seconds with no keyboard escape.** A trainee who accidentally opens the wrong region is trapped for 3s with no way to back out, and there's no `useEffect` listening for ESC.
   → Fix: Always allow ESC to close, even before the 3s timer. The point is to prevent click-spam, not block intentional navigation. Show the radial countdown for X-button visual feedback, but ESC always works.

3. **[Critical]** _Typography_ — **Critical UI uses 8-10px fonts** (`text-[8px]`, `text-[9px]`, `text-[10px]` appear 40+ times across MapExplorerPage, GameTopBar, StateInfoPanel, ExpeditionReport). On a classroom projector or even a 1080p laptop at arm's length, these are illegible.
   → Fix: Establish a minimum readable size: labels ≥ 11px, body ≥ 14px, score/timer/headlines ≥ 18px. Replace ad-hoc `text-[10px]` with semantic classes (`text-label`, `text-body`, `text-display`).

4. **[Major]** _Visual hierarchy / Cognitive load_ — **MapExplorer top bar tries to display 6+ status objects simultaneously**: progress count, progress bar, 7 checkpoint dots, current position pin, 4 milestone badges, legend toggle. With the Passport drawer open, add another 12 stats. There's nowhere for the eye to rest.
   → Fix: Pick the one signal that matters most ("X / 64 regions") and make it the only display always-on. Move milestones into the Passport drawer, only flash them briefly when earned. Move the legend into a hover/click affordance on the map itself, not a top-bar button.

5. **[Major]** _Polish / Animation overload_ — Landing page CTA simultaneously has `animate-pulse` + `hover:scale-[1.02]` + `active:scale-[0.98]` + `transition-all` + `shadow-lg`. MapExplorer has `animate-glow-pulse` + `animate-bounce-in` + `animate-pop-in` + `animate-stagger-in` + `transition-transform`. Ambient `FloatingParticles` runs constantly on Landing.
   → Fix: One animation per element at a time. Pulse OR scale, not both. Floating emoji particles are charming for 5 seconds and annoying for 55 minutes — drop them, or use sparingly only on the landing intro and dismiss after first interaction.

6. **[Major]** _Voice & Tone_ — Copy reads as half-spy/half-explorer: "Initialize Expedition", "Phase 00 · Atlas calibration", "tactical simulations", "Master Screener", "Joining Wave", "ID: EXP-01", "v4.0.0-PRO". The V2 plan committed to warm explorer language but the surface text still pages back to spycraft.
   → Fix: Strict rewrite pass. Replace every "tactical / mission / deploy / initialize / sector / protocol" with explorer alternatives ("Begin", "Trip", "Region", "Map", "Discover"). Drop version numbers and system IDs from user-facing UI.

7. **[Major]** _UX patterns_ — **Quick Check has no skip/dismiss.** Pops up between regions every 8 clicks; the trainee has to answer. In a 60-min mandatory class, a trainee who needs the bathroom or a quick break is stuck. Also: the modal is full-screen blocking with `backdrop-blur-sm` — nothing else is reachable.
   → Fix: Add a small "Skip this check" link styled as a low-prominence text button (not a CTA). Or auto-dismiss after 30s of no interaction. Trainees who skip get a softer reminder next round.

8. **[Major]** _Iconography_ — Mixed icon systems throughout: emoji (🧭, 📘, 📖, 🗺️, ✈️, ⛺, 🏆), inline SVG paths (close X, chevrons), Lottie animations (globe), GIF stickers (`pin-bounce.gif`). Each carries different weight, color, and rendering quality. On Windows laptops, emoji rendering varies wildly across browsers.
   → Fix: Pick one icon system as the primary (recommend: Lucide React for consistency) and reserve emoji only for *celebratory* moments (milestone reached, badge earned). Replace pin-bounce.gif with a styled CSS element or Lucide pin icon.

9. **[Minor]** _Polish_ — Focus ring is `outline: 2px solid #FF9900` (orange) but accent color is `#2E7D32` (green) on the NYT palette. Inconsistent.
   → Fix: Use the accent color for focus too: `outline: 2px solid var(--atlas-accent)`. Keep `outline-offset: 4px` (good for visibility).

10. **[Minor]** _Consistency_ — Two fonts loaded but only some used: Nunito declared via `@font-face` in `index.css` but `--font-sans` is Inter. Instrument Serif AND Playfair Display both loaded (one is enough).
    → Fix: Pick one display font, drop the other. Drop Nunito or use it (don't load fonts you don't use — perf hit on first paint).

11. **[Minor]** _Polish_ — `MapExplorerPage` `phase === 'intro'` panel has the headline `"Map Explorer"` — repeats the top-bar label two inches above it. Two H1-style headings on the same screen.
    → Fix: Make the intro headline more inviting/specific: "Discover North America" or "Your Journey Begins" — let the top-bar own the system label.

12. **[Minor]** _Accessibility_ — `StateInfoPanel` watercolor splash references `splash-forest.png` / `splash-water.png` — if either is missing, the panel renders with broken background. No fallback visible.
    → Fix: Verify both assets exist; otherwise CSS `background-image` will silently fail.

### Strengths in current code
- `@media (prefers-reduced-motion: reduce)` block in `index.css` correctly disables animations — strong accessibility win.
- `useMemo` usage in `MapExplorerPage` for `stats`, `timezoneMap`, `passportTrivia` is well-applied — no needless re-renders.
- `QuickCheck` component is well-isolated, uses real session data, gives meaningful explanations on wrong answers — best-in-class for the file set I read.
- Confetti / streak fire / celebration triggers are factored into `celebrations.ts` rather than scattered — good architecture.

### Code critique summary
The app has the right bones but is wearing four different outfits. The single highest-leverage fix is a palette + typography sweep that propagates `--atlas-*` tokens through every component. After that, three accessibility/UX fixes (ESC closes the panel, fonts ≥ 11px, Quick Check can be skipped) and one cognitive-load fix (simplify the MapExplorer top bar) close the gap to "polished."

---

## Part 3: Screenshot review workflow

You said "all three" but haven't sent screenshots yet. When you do, share them as image attachments and I'll run the design-critique skill mode against each screen using the format:

```
## Design Critique: [screen name]
### Issues (Critical/Major/Minor, with → Fix)
### Strengths
### Summary
```

To get the most value, prioritize sending screens in this order:
1. **MapExplorer (exploring phase, with a region open)** — highest-traffic screen, palette-schism epicenter.
2. **CodeDrop mid-game** — to verify the falling block animation, streak counter, feedback states.
3. **PinRush mid-game** — to verify map rendering at game scale.
4. **ResultsPage (all games passed)** — for the celebration / leaderboard / ExpeditionReport surface.
5. **Quick Check modal** — to verify it doesn't feel like an exam.

For each screenshot, tell me **what state it's in** (mid-game, post-answer correct, post-answer wrong, etc.) so I can critique against the intended UX, not guess.

---

---

## Part 4: V3 Enhancement Plan — One Big Push

**Goal:** Address the user's actual experience ("V2 is hosted but UI/UX still looks the same; I don't see the NYT style") by doing the missing palette propagation **and** adding new elements in a single coordinated release. ~15-20 hours of focused work, split into 5 parallel tracks that can be tackled in any order.

> **Why "you didn't host it wrong":** Hosting can't change CSS. The visual identity didn't change because the *code* in MapExplorer, the three games, GameTopBar, ResultsPage, and ExpeditionReport never adopted the NYT palette. They still hardcode `#232F3E` (navy), `#00A8A2` (teal), `#FEBD69` (amber), `#FF9900` (orange), and Tailwind defaults. When you visit the hosted site you're seeing exactly what V2 produced — which was a Landing-only rebrand.

### Track A: NYT Palette Propagation (the missing Phase 3)

**Estimate: 4-5h.** The foundation everything else depends on.

#### A1: Make `--atlas-*` tokens the single source of truth
**File:** `app/src/index.css`
- Keep the existing `@theme` block; it's correct.
- Add Tailwind v4 utility aliases so components can write `bg-atlas-warm` / `text-atlas-ink` instead of `bg-[var(--atlas-warm)]`. Define them in `@theme` so they generate as utilities.
- **Delete the legacy `--color-*` aliases** (`--color-bg-cream`, `--color-bg-sand`, `--color-ink`, `--color-muted`, etc.). They make it too easy to forget the atlas tokens exist. After this, the only valid color tokens are `--atlas-*`.
- Update `:focus-visible` to use `var(--atlas-accent)` not `#FF9900`.
- Update scrollbar styling to use `rgba(46, 125, 50, 0.2)` (atlas accent) not orange.

#### A2: Repaint MapExplorerPage end-to-end
**File:** `app/src/features/training/MapExplorerPage.tsx`
- Replace every `#232F3E` / `bg-[#1F2937]` / `bg-[#232F3E]` with `bg-atlas-warm` for backgrounds, `bg-atlas-card` for cards, `bg-atlas-ink` for dark sections.
- Replace every `#00A8A2` (teal) with `var(--atlas-accent)` (#2E7D32 green).
- Replace `#FEBD69` (amber) with `var(--atlas-gold)` (#F9A825).
- Replace `#35D07F` with `var(--atlas-accent)`.
- Replace `text-white/30`, `text-white/40`, `text-white/60` (used because backgrounds were dark navy) with `text-atlas-muted` (#787774). When background changes from dark to warm off-white, white text becomes invisible — this is a coordinated swap.
- **Drop the dark navy `bg-[#1F2937]` exploring-phase background entirely.** It clashes with NYT. Make MapExplorer's exploring phase `bg-atlas-warm` with `bg-atlas-card` for the map container.

#### A3: Repaint StateInfoPanel
**File:** `app/src/components/map/StateInfoPanel.tsx`
- Drop the `COUNTRY_THEME` system entirely. It introduces two more colors (`#232F3E` for US, `#C41E3A` for Canada) that don't belong.
- US and Canada both use the same neutral atlas card style; differentiate them only by a small flag emoji (🇺🇸 / 🇨🇦) and the country pill, not entire color schemes.
- Pill backgrounds: `bg-atlas-accent-light text-atlas-accent` for US, same with a subtle red border for Canada — but keep the panel background uniform.

#### A4: Repaint GameTopBar
**File:** `app/src/components/layout/GameTopBar.tsx`
- Replace `bg-[#0c120e]` (near-black) with `bg-atlas-ink` (#1A1A2E) or `bg-atlas-card` with `border-b border-atlas-border` for a *light* top bar (recommended — NYT app top bars are light, not black).
- Replace `text-[#FF9900]` (Amazon orange) with `text-atlas-gold` for accents, `text-atlas-ink` for primary text.
- Progress bar fill: `bg-atlas-accent` not `#FF9900`.

#### A5: Repaint games (CodeDrop, PinRush, CityStack)
**Files:** `app/src/features/games/CodeDrop.tsx`, `PinRush.tsx`, `CityStack.tsx`
- For PinRush's `TZ_BG` map (per-timezone colors): this is the one place where bright, distinct colors are *intentional* — keep them but lower saturation to NYT-compatible muted versions (think editorial illustration, not arcade). Suggested: PST `#5B8DEF` (muted blue), MST `#E8A86B` (muted orange), CST `#4FAA76` (muted green), EST `#A684C7` (muted purple), etc.
- All UI chrome (score, streak, buttons, panels) uses atlas tokens.

#### A6: Repaint ExpeditionReport
**File:** `app/src/features/results/ExpeditionReport.tsx`
- Drop the dark green `#16221A` → `#111A14` → `#18261D` gradient. Use `bg-atlas-card` with a `border-2 border-atlas-accent/40` and a subtle paper-texture overlay (already in `index.css`).
- Drop `#10B981` emerald → use `var(--atlas-accent)`. Drop `#F59E0B` amber → use `var(--atlas-gold)`.
- "Official Document" pill and "ID: EXP-01" tag — see Track E1 (drop the system-jargon copy).

#### A7: Drop unused font
**File:** `app/index.html`
- Pick **one** display font: Instrument Serif (recommended — more modern, closer to NYT editorial) OR Playfair Display. Drop the other from the `<link>`.
- Drop the `@font-face` Nunito declarations in `index.css` (not used anywhere).

#### A8: Verify with one screen at a time
After each file's repaint, take a screenshot and verify against `LandingPage` for palette match. If anything still reads "different app," repeat.

---

### Track B: Map / Exploration Elements

**Estimate: 4-5h.** All in `MapExplorerPage.tsx` + `InteractiveMap.tsx`.

#### B1: Region hover preview tooltip
**Files:** `app/src/components/map/InteractiveMap.tsx`, `MapExplorerPage.tsx`
- On region hover (not click), show a small floating tooltip near the cursor with **region name + timezone code** (e.g., "California · PST"). No card, no commitment.
- Use `pointer-events-none` so the tooltip never blocks the underlying region.
- Style: `bg-atlas-ink text-atlas-warm rounded-lg px-3 py-1.5 text-sm shadow-lg`.
- Hide on click (the full card takes over).
- **Why it matters:** Lets trainees scan-and-plan without the 3-second card commitment. Reduces "I clicked the wrong one" frustration.

#### B2: Animated exploration trail drawn on the map
**Files:** `app/src/components/map/InteractiveMap.tsx`, new helper `app/src/lib/exploration-trail.ts`
- Track the *order* regions were clicked (extend `session.training` with `mapExplorerOrder: string[]`).
- Render an SVG `<path>` overlay on top of the map connecting region centroids in click order.
- Animate the path drawing in with `stroke-dasharray` + `stroke-dashoffset` whenever a new region is added.
- Style: `stroke: var(--atlas-accent)`, `stroke-width: 2.5`, `stroke-linecap: round`, `opacity: 0.6`, `pointer-events: none`.
- Add a small "compass pin" emoji at the most recent point.
- **Why it matters:** Visual record of the journey — the trail tells a story. Becomes screenshot-worthy at completion. Reinforces the "expedition" metaphor.

#### B3: Cluster-unlocked reveal animation
**Files:** `MapExplorerPage.tsx`, `InteractiveMap.tsx`, `app/src/lib/celebrations.ts`
- When a cluster is completed (already detected in `handleRegionClick` via `CLUSTER_CHECKPOINTS`), pulse all regions in that cluster simultaneously with a `var(--atlas-accent)` glow for 1.5 seconds, then settle into a permanent "mastered" tint.
- Add a brief centered banner ("Pacific Coast cluster mastered · 6/6 regions") that fades in/out over 2 seconds.
- Style: subtle, editorial — not arcade. Soft glow, fade transition, no confetti for this one.
- **Why it matters:** Cluster completion is currently invisible to the user; this celebrates the geographic intuition the plan was trying to build.

#### B4: Time-based progress visualization
**File:** `MapExplorerPage.tsx`
- Add a horizontal "time budget" bar to the top of the exploring phase: shows `[elapsed] / 15 min` for the map training portion.
- Color states: green (on pace), gold (1.5x normal pace, hint to speed up), red glow (over budget).
- **Why it matters:** Trainees know whether they're on schedule. Trainer can glance at the room and gauge collective progress.

---

### Track C: Classroom / Competition Elements

**Estimate: 4-5h.**

#### C1: Live session timer in top bar
**Files:** `app/src/components/layout/GameTopBar.tsx`, `TrainingTopBar.tsx`, `app/src/hooks/useSessionTimer.ts` (new)
- New hook `useSessionTimer` that returns elapsed time since `session.createdAt` and "remaining of 60 min."
- Display in top bar as a pill: `⏱ 47 min remaining` (atlas-gold text on atlas-card background, atlas-error tint when < 10 min remaining).
- **Why it matters:** Mandatory 60-min training needs a visible budget. Removes "how long is left?" anxiety.

#### C2: Live wave leaderboard mini-widget
**Files:** `app/src/components/layout/WaveLeaderboardWidget.tsx` (new), used in `GameShellPage.tsx`
- Floating widget in bottom-right corner during games (not on Landing/MapExplorer).
- Shows top 3 of the player's wave: rank, initials, score. Highlights the current player's row in `bg-atlas-accent-light`.
- Polls `fetchLeaderboard(session.agent, session.waveCode)` every 30 seconds. Don't poll during animations to avoid distraction.
- Collapsible (default open; remembers state in localStorage).
- **Why it matters:** Creates the "I just passed Sarah!" classroom buzz V2 Phase 4 promised. Without a visible live leaderboard, competition is invisible.

#### C3: Trainer dashboard route
**Files:** `app/src/features/trainer/TrainerDashboard.tsx` (new), route added in `App.tsx` or wherever routes live
- Route: `/trainer?wave=WAVE-24`. No auth gate (it's a classroom tool — trainer has the URL).
- Shows: wave name, # active explorers, leaderboard table (all participants, not just top 3), per-game pass rate, average score, time-to-complete distribution histogram.
- Auto-refreshes every 15 seconds.
- "Project Mode" toggle: hides debug info, maximizes leaderboard text size for projector visibility.
- **Why it matters:** V2 Phase 4 invented `trainer-report.ts` as a JSON exporter with no UI. This makes it actually useful during the session, not just after.

#### C4: Player avatar with rank ring in top bar
**Files:** `app/src/components/layout/PlayerAvatar.tsx` (new), used in `GameTopBar.tsx`, `TrainingTopBar.tsx`
- 36px circle with player initials, generated from `session.agent` (first letter of first + last word).
- Ring around avatar shows current rank tier color: Explorer (atlas-muted), Pathfinder (atlas-accent-light), Navigator (atlas-accent), Trailblazer (atlas-gold).
- Click → opens a small popover showing current score, rank, % to next rank.
- **Why it matters:** Light identity layer; reinforces progression visually without an XP bar.

---

### Track D: Feedback / Celebration Elements

**Estimate: 3-4h.**

#### D1: Sound design system
**Files:** `app/src/hooks/useAudio.ts` (exists, extend), `app/public/assets/sounds/` (verify or add)
- Audit the current `playSound()` callsites. Document which exist: probably `click`, `correct`, `wrong`, `streak`, `badge`. Make sure each is a *distinct, intentional* sound, not a generic UI click.
- **Click:** soft paper-tap (200ms, light wood-block timbre).
- **Correct:** rising two-note chime (think NYT Wordle correct).
- **Wrong:** muted thud, no harsh buzzer (encouraging, not punishing).
- **Streak (3+):** ascending arpeggio that escalates pitch with streak length.
- **Milestone reached:** brief celebratory swell (~1.5s).
- **Cluster unlocked:** subtle bell.
- Add a master volume slider in top bar (icon button). Default to 30% volume. Mute by default if `prefers-reduced-motion` is set (extends the principle to audio).
- **Why it matters:** Audio is the cheapest way to make an app feel "alive." Done well it's invisible reinforcement; done poorly it's annoying. The current playSound calls suggest audio exists but isn't part of a designed system.

#### D2: Region "flies to panel" transition
**Files:** `MapExplorerPage.tsx`, possibly `StateInfoPanel.tsx`
- When a region is clicked, briefly animate the region's SVG outline scaling up and translating to the position where the InfoPanel will appear — then the panel renders.
- Implementation: a temporary cloned SVG path with `transform` animation, removed after 300ms.
- Use `cubic-bezier(0.1, 0.8, 0.3, 1)` for the satisfying overshoot.
- **Why it matters:** Currently the panel "appears" out of context. The transition creates a sense of zooming into the region.

#### D3: Streak escalation visuals
**Files:** `GameTopBar.tsx`, `CodeDrop.tsx`, `PinRush.tsx`
- Current: streak counter shows `⚡` or `🔥` and `glow-pulse` at 3+.
- Enhanced:
  - 1-2 streak: small streak badge, no animation.
  - 3-4 streak: badge grows, gold ring appears.
  - 5+ streak: ring becomes animated, screen-edge vignette pulses gold subtly during the next question.
  - 8+ streak: brief screen-edge gold sweep on each correct answer.
- All gradations use `var(--atlas-gold)`; never red/blue/purple (palette discipline).

#### D4: Milestone ceremony enhancement
**Files:** `MapExplorerPage.tsx`, `app/src/lib/celebrations.ts`
- Current `milestonePopup` is a small centered card. Upgrade to a 2-second full-screen takeover with:
  - Large milestone icon (rotating slowly).
  - Title ("Wayfinder reached") in display font.
  - Sub-line ("25 regions explored").
  - Dismissible with any key or auto-dismiss after 2s.
- Pause the underlying map (no new clicks during ceremony).

---

### Track E: Editorial / Content Elements (the "NYT" feeling)

**Estimate: 3-4h.**

#### E1: Voice & tone rewrite pass
**Files:** Many â€” `LandingPage.tsx`, `MapExplorerPage.tsx`, `ExpeditionReport.tsx`, `GameTopBar.tsx`
- Status: Done.
- Completed the rewrite across `LandingPage.tsx`, `MapExplorerPage.tsx`, `ExpeditionReport.tsx`, and `GameTopBar.tsx`.
- Replaced mission-control and system-jargon language with warmer editorial explorer copy: "Initialize Expedition" became "Begin Your Expedition", "tactical simulations" became "exploration games", "Master the Learning Zone" became "Discover every region", and "EXPEDITION PROGRESS" became "Your progress".
- Removed user-facing system tags including "Phase 00 / Atlas calibration", "Sector: NA-01", "v4.0.0-PRO", "Official Document", and "ID: EXP-01".
- Cleaned the landing form copy to use "Wave" and "Trainer", and updated the active-session summary to read "You're with {wave}" instead of the more mechanical "Joining Wave" phrasing.
- Default surface copy now follows sentence case, with all-caps reserved only for compact UI labels where it supports scanability.

#### E2: "Region of the Day" featured card on Landing
**File:** `app/src/features/landing/LandingPage.tsx`, new helper `app/src/lib/region-of-day.ts`
- Status: Done.
- Added `region-of-day.ts` with deterministic per-day region selection based on `new Date().toDateString()`.
- Landing now fetches the same `states.json` dataset used by training, picks the daily region, and renders an editorial "Region of the day" card below the 4-step grid.
- The card shows the region name, postal code, flag, timezone, capital, and first trivia fact, plus a CTA that focuses the entry form.
- On Landing's right panel (where the globe currently lives), add a small editorial card below the 4-step grid: "Region of the day: New Mexico" with one paragraph of trivia, the postal code, a small flag, and a "this is what awaits you" CTA.
- Selection: deterministic per-day (`new Date().toDateString()` hashed → region index) so all trainees in the same day see the same region — supports trainer talking point.
- **Why it matters:** Editorial layer that says "this app has substance." Gives the trainer a natural conversation starter.

#### E3: In-app cheat sheet (printable / downloadable)
**Files:** `app/src/features/results/CheatSheet.tsx` (new), linked from ResultsPage
- One-page reference: all 64 regions grouped by cluster, showing name + postal code + timezone + capital.
- Two view modes: in-app (scrollable card) and print-optimized (single landscape page, no nav chrome).
- "Download as PDF" button uses `window.print()` with print CSS — no backend needed.
- **Why it matters:** Trainees want to take something home. A clean reference sheet makes the training stick beyond the session.

#### E4: Expanded trivia layer on StateInfoPanel
**File:** `app/src/components/map/StateInfoPanel.tsx`
**Status:** Fixed.
- The "Did you know?" section currently picks one random trivia fact. Enhance:
  - Show 2-3 facts, not 1.
  - Add a small "🔁 Another fact" button to cycle through remaining trivia.
  - Add a "📌 Save to journal" button (writes to `session.training.journalEntries: string[]` for review in ResultsPage).
- **Why it matters:** Trivia is the most "sticky" content — making it browseable rather than randomly served increases learning.

---

### V3 Track Summary

| Track | Focus | Effort | Order |
|---|---|---|---|
| **A: Palette** | NYT propagation across all screens | 4-5h | First (blocks visual coherence) |
| **B: Map** | Hover, trail, cluster reveal, time bar | 4-5h | After A |
| **C: Classroom** | Timer, leaderboard widget, trainer dashboard, avatar | 4-5h | After A (can parallelize with B) |
| **D: Feedback** | Sound system, transitions, streak/milestone polish | 3-4h | After A |
| **E: Editorial** | Voice rewrite, Region of Day, cheat sheet, trivia | 3-4h | After A |

**Total: 18-23 hours.** Track A must ship first; B/C/D/E can ship in any order or in parallel.

### V3 Verification

After the full push, take side-by-side screenshots of these screens and compare to V2:
1. **Landing** — should look identical (already NYT-compliant).
2. **MapExplorer intro phase** — should switch from dark navy `#232F3E` background to warm `#FAF8F5`. Cards should be white with `border-atlas-border`.
3. **MapExplorer exploring phase** — same warm background, region trail visible as you click, hover preview tooltip on hover, top bar shows time-remaining pill.
4. **StateInfoPanel open** — uniform card style for both US and Canada (only flag differs), ESC closes it, all text ≥ 11px.
5. **QuickCheck modal** — green NYT accent, skip link present, atlas tokens throughout.
6. **CodeDrop / PinRush / CityStack mid-game** — light top bar (not near-black), atlas-accent for primary actions, leaderboard widget visible bottom-right.
7. **ResultsPage with ExpeditionReport** — light editorial style (not dark green gradient), atlas tokens, no "Official Document / ID: EXP-01" jargon.
8. **Trainer dashboard at `/trainer?wave=XXX`** — opens, shows live data, project-mode toggle works.

Run `npm run dev` and walk through the full session end-to-end. The whole thing should read as **one app** — a single visual identity from Landing to ExpeditionReport.

### Critical V3 files (in order touched)

**Track A (palette):**
- `app/src/index.css` — drop legacy `--color-*`, fix focus, fix scrollbar
- `app/src/features/training/MapExplorerPage.tsx` — biggest repaint
- `app/src/components/map/StateInfoPanel.tsx` — drop COUNTRY_THEME duality
- `app/src/components/layout/GameTopBar.tsx` — light top bar
- `app/src/components/layout/TrainingTopBar.tsx` — match GameTopBar
- `app/src/features/games/CodeDrop.tsx`, `PinRush.tsx`, `CityStack.tsx`
- `app/src/features/training/QuickCheck.tsx`
- `app/src/features/results/ResultsPage.tsx`, `ExpeditionReport.tsx`
- `app/index.html` — drop one display font

**Track B (map):**
- `app/src/components/map/InteractiveMap.tsx`
- `app/src/features/training/MapExplorerPage.tsx`
- `app/src/lib/exploration-trail.ts` (new)
- `app/src/lib/celebrations.ts`

**Track C (classroom):**
- `app/src/hooks/useSessionTimer.ts` (new)
- `app/src/components/layout/PlayerAvatar.tsx` (new)
- `app/src/components/layout/WaveLeaderboardWidget.tsx` (new)
- `app/src/features/trainer/TrainerDashboard.tsx` (new)
- `app/src/components/layout/GameTopBar.tsx`, `TrainingTopBar.tsx`
- `app/src/features/games/GameShellPage.tsx`

**Track D (feedback):**
- `app/src/hooks/useAudio.ts`
- `app/public/assets/sounds/` (verify/add files)
- `app/src/lib/celebrations.ts`
- `app/src/components/map/InteractiveMap.tsx`
- `app/src/features/games/CodeDrop.tsx`, `PinRush.tsx`
- `app/src/index.css` (streak/milestone keyframes)

**Track E (editorial):**
- Many text-only edits across `LandingPage.tsx`, `MapExplorerPage.tsx`, `ExpeditionReport.tsx`, `GameTopBar.tsx`
- `app/src/lib/region-of-day.ts` (new)
- `app/src/features/results/CheatSheet.tsx` (new)
- `app/src/components/map/StateInfoPanel.tsx`

---

## Remaining items from Part 2 critique (carry-over to V3 execution)

These are the smaller fixes from the original critique that should be picked up during the V3 push:

1. **ESC closes `StateInfoPanel`** — even before 3s timer. (Track A4 or D2 follow-on.)
2. **Font-size sweep** — replace `text-[8px]` / `text-[9px]` / `text-[10px]` with `text-xs` (12px) minimum. Critical instructional text → `text-sm` (14px)+. (Done during Track A repaints.)
3. **Simplify MapExplorer top bar** — keep "X / 64" + Legend + Time pill (Track C1). Move milestone badges into Passport drawer. (Track A2 or B4.)
4. **Quick Check skip link** — small low-prominence "Skip" text button. (Track A3.)
5. **Fix V2 plan internal contradictions** before next planning cycle — delete IntelVault entirely, move palette swap into Phase 1 not 3. (Already addressed by V3 doing palette first.)
