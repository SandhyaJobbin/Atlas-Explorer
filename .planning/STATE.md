# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20)

**Core value:** The map must render fully and be usable — exploration and every game depend on seeing and interacting with the complete North America map without cropping or obscured controls.
**Current focus:** Phase 1 — SVG and Map Viewport Fixes

## Current Position

Phase: 1 of 8 (SVG and Map Viewport Fixes)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-05-20 — Roadmap created, all 27 requirements mapped across 8 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap init: Patch existing SVG viewBox (not swap to svg(1)/northAmerica.svg) — lower risk, avoids coordinate-space breakage across all 4 map use sites
- Roadmap init: Phase 3 (D2) must precede Phase 7 (C4) — hard dependency confirmed in PITFALLS.md
- Roadmap init: DC reconciliation approach = exclude DC path from SVG listener registration, set TOTAL_REGIONS = 63 (15 min fix, lower risk than adding DC to states.json)
- Roadmap init: C5 difficulty scoped to session object only — avoids shared-device contamination on classroom Chromebooks

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1: Must decide SVG fix strategy (patch viewBox vs. swap asset) before writing code — research recommends patch
- Phase 3: Verify DataProvider uses sessionStorage (not localStorage) — may need to switch for C4 offline resilience to survive tab close
- Phase 7: APPS_SCRIPT_URL must be configured before C4 sync queue is meaningful — gate drainQueue() on if (APPS_SCRIPT_URL)

## Deferred Items

Items acknowledged and carried forward:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| C4 | Service Worker PWA shell cache | Out of scope | Research |
| C5 | Class-wide per-region difficulty heatmap | Out of scope | Research |
| C2 | Full SM-2/FSRS cross-session scheduling | Out of scope | Research |
| C4 | IndexedDB migration for session data | Out of scope | Research |

## Session Continuity

Last session: 2026-05-20
Stopped at: Roadmap created and written. REQUIREMENTS.md traceability updated. Ready to begin Phase 1 planning.
Resume file: None
