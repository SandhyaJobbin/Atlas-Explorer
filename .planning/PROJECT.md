# Atlas Explorer

## What This Is

Atlas Explorer is a single-page web app for geography education: learners explore an
interactive map of US states and Canadian provinces, then play games to test their
knowledge of postal codes, timezones, and locations. This milestone is a polish-and-completion
pass — fixing ~20 UI/UX bugs across 7 screens and finishing 6 remaining V3 plan features.

## Core Value

The map must render fully and be usable — exploration and every game depend on seeing
and interacting with the complete North America map without cropping or obscured controls.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — inferred from existing codebase (mapped 2026-05-20). -->

- ✓ Session-based training flow: explore map → play games → results — existing
- ✓ Interactive SVG map of US states + Canadian provinces — existing
- ✓ Three games: Crack the Code (CodeDrop), Pin It (PinRush), City/Tz Sorter (CityStack) — existing
- ✓ Scoring, badges, and leaderboard (localStorage + Google Apps Script) — existing
- ✓ Trainer dashboard for wave/classroom management — existing
- ✓ Atlas editorial theme (NYT-style palette, atlas-* CSS tokens) — existing

### Active

<!-- This milestone. All are hypotheses until shipped and validated. -->

**Map & layout fixes**
- [ ] Full North America map renders without cropping (Canada visible) on start + game screens
- [ ] Off-map map pointers/waypoints positioned correctly within map bounds
- [ ] Overlapping controls fixed: Atlas passport button, zoom in/out controls, and buttons hidden behind Pace Monitor / Expedition Status / Wave Standings are visible and clickable
- [ ] Landing "Begin your Expedition" CTA visible at 100% zoom; empty background behind text filled

**Map interaction fixes**
- [ ] State/province selection is stable — borders no longer pop in and revert
- [ ] Hover popups on small states no longer flicker/pop randomly; popup intensity reduced
- [ ] Per-second flicker effect removed (MapExplorer + Pin It)

**Game logic fixes**
- [ ] Completing all 63 regions advances to the results page
- [ ] Crack the Code timezone questions are single-select (one answer accepted)
- [ ] Crack the Code map reference legend stays inside map bounds

**Navigation & results**
- [ ] Resume Expedition screen: Train button opens map training, Play button opens games
- [ ] Unified expedition results page aggregating all four games

**V3 plan completion**
- [ ] C2 — Spaced repetition / review round resurfacing prior mistakes
- [ ] C3 — Post-results action hub ("What's Next?" with retry/compare/journal links)
- [ ] C4 — Offline resilience (sync queue, local progress, offline indicator)
- [ ] D2 — Single shared states.json fetch (one DataProvider, no per-component fetch)
- [ ] C5 — Dynamic difficulty (per-region difficulty rating, adaptive ordering)
- [ ] D1 — Unified game state manager (GameEvents emitter → single GameState context)

### Out of Scope

- Backend rework — Google Apps Script leaderboard stays as-is; no new server
- New games beyond the existing four — milestone is polish + completion, not expansion
- Native mobile app — remains a web SPA
- Redesign of the Atlas editorial theme — visual identity is settled; only fix layout bugs

## Context

- **Brownfield.** Codebase mapped 2026-05-20 — see `.planning/codebase/` (ARCHITECTURE, STACK, etc.).
- Stack: React 19.2, TypeScript 6.0, Vite 8, TailwindCSS v4, react-router-dom 7 (HashRouter).
- Source of the V3 backlog: `v3-remaining-changes.md` (dated 2026-05-17). **This doc may be
  partially stale** — the 2026-05-20 codebase map shows a `review` game phase and a
  `DataProvider` context already exist, which the doc claims are missing (C2, D2). Each phase
  must verify current code state before implementing.
- An in-progress map asset swap exists in the `svg (1)/` folder (new `northAmerica.svg`,
  `map-data.js`). Whether to fix the current `app/public/maps/north-america.svg` or wire in
  the new assets is a per-phase implementation decision (fix whichever resolves cropping cleanest).
- **Execution runtime:** the user runs code fixes in OpenCode CLI. Model routing per task type:
  - Planning / architecture / roadmap → Opus (`claude-opus-4-6`)
  - Complex coding / debugging / refactors → Sonnet (`claude-sonnet-4-6`)
  - Simple edits / boilerplate / Q&A → Haiku (`claude-haiku-4-5-20251001`)
- Deployment: GitHub Pages, base path `/Atlas-Explorer/`, GitHub Actions on push to `main`.

## Constraints

- **Tech stack**: React 19 + TS 6 + Vite 8 + Tailwind v4 — match existing patterns, no new frameworks
- **Routing**: HashRouter only (GitHub Pages has no server-side routing)
- **Hosting**: static GitHub Pages — offline resilience (C4) must work client-side, no server state
- **Compatibility**: existing session/localStorage schema is relied upon — migrate, don't break
- **Execution**: fixes applied via OpenCode CLI by the user

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single milestone covers all bugs + all 6 V3 items (incl. P4 C5/D1) | User chose full scope over deferring the larger refactors | — Pending |
| Map fix approach (patch current SVG vs. swap to `svg (1)/` assets) left to per-phase decision | Both options unverified; pick whichever fixes cropping cleanest | — Pending |
| Add a unified cross-game results page | User wants an overall expedition summary beyond per-game results | — Pending |
| Train→map / Play→games wiring lives on the Resume Expedition screen, not landing | User clarified the non-functional buttons are on the resume screen | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-20 after initialization*
