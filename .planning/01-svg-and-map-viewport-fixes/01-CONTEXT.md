# Phase 1: SVG and Map Viewport Fixes - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning
**Source:** Roadmap requirements + codebase research

<domain>
## Phase Boundary

Fix the North America map rendering so Canada is fully visible on all 4 map screens, training completes at exactly 63 regions (excluding DC), and waypoint markers appear within visible bounds. This is a brownfield fix pass — no new features, only corrections to existing code.

</domain>

<decisions>
## Implementation Decisions

### SVG ViewBox Fix (MAP-01, MAP-04)
- Patch the existing `app/public/maps/north-america.svg` viewBox — do NOT swap to `svg (1)/northAmerica.svg` (incompatible coordinate space breaks all overlay positioning)
- Expand y-start from `-50` to `-780` to include Canada's northernmost paths (y ≈ -771)
- Expand y-height from `830` to `1420` to cover full vertical range
- Add `preserveAspectRatio="xMidYMid meet"` to root `<svg>` element
- Remove any `width`/`height` attributes that InteractiveMap.tsx may inject on the SVG root

### DC Reconciliation (MAP-02, GAMEPLAY-01)
- DC exists in SVG (64 paths) but NOT in states.json (63 entries)
- Set `TOTAL_REGIONS = 63` in `app/src/lib/session.ts`
- Exclude DC from SVG listener registration in InteractiveMap.tsx Effect A (filter out `data-code="DC"`)
- Replace all hardcoded `64` literals with `TOTAL_REGIONS` or `states.length` across the codebase

### Waypoint Marker Positioning (MAP-03)
- Trail positioning uses `getBBox()` on SVG elements — depends on SVG coordinate space
- After viewBox fix, markers will naturally fall within visible bounds
- Verify fly-to-panel animation still works (uses `getBoundingClientRect()` + `getBBox()`)

### the agent's Discretion
- Exact viewBox values may need微调 after visual testing — the values above are calculated from path coordinate scan
- Test on Chrome, Firefox, Safari at 100% zoom and various browser zoom levels
- Hardcoded `64` literals found in 12+ locations across 4 files — all must be updated

</decisions>

<canonical_refs>
## Canonical References

**MANDATORY. Extract from ROADMAP.md and any specs/ADRs referenced in the PRD. Use full relative paths. Group by topic area.**

### Map Rendering
- `app/public/maps/north-america.svg` — North America map SVG (64 paths, current viewBox: `-189.42 -50 1157.42 830`)
- `app/src/components/map/InteractiveMap.tsx` — Map component with SVG injection, Effect A registers listeners on `.atlas-region`

### Session & Training
- `app/src/lib/session.ts` — TOTAL_REGIONS definition (line 12), training completion check (line 122-123)
- `app/src/features/training/MapExplorerPage.tsx` — Map explorer screen, milestone counters, progress display
- `app/src/features/training/TrainingCompletePage.tsx` — Training completion screen

### Games
- `app/src/features/games/PinRush.tsx` — Pin It game (map use site #2)
- `app/src/features/games/ReviewRound.tsx` — Review round (map use site #3)

### Results
- `app/src/features/results/ResultsPage.tsx` — Results page with heatmap (map use site #4)
- `app/src/features/results/ExpeditionReport.tsx` — Expedition report with region count

### Data
- `app/public/data/states.json` — Region data (63 entries, no DC)

### Utilities
- `app/src/lib/exploration-trail.ts` — Trail positioning logic using getBBox()

### Tests
- `app/src/__tests__/session.test.ts` — Session unit tests (hardcoded 64)

</canonical_refs>

<specifics>
## Specific Ideas

- Current viewBox: `-189.42 -50 1157.42 830`
- Canada paths extend to y ≈ -771 (e.g., `M198.71,-747.51L198.70,-771.09`)
- Suggested viewBox: `-189.42 -780 1157.42 1420`
- DC SVG path: `id="US-DC" class="atlas-region" data-code="DC" data-name="District of Columbia"`
- TOTAL_REGIONS currently = 64, should be 63
- states.json has 63 entries (50 US states + 13 Canadian provinces/territories)
- 4 map use sites: MapExplorerPage, PinRush, ReviewRound, ResultsPage
</specifics>

<deferred>
## Deferred Ideas

None — phase scope is fixed to MAP-01 through MAP-04 and GAMEPLAY-01.

</deferred>

---

*Phase: 01-svg-and-map-viewport-fixes*
*Context gathered: 2026-05-21 via research + codebase analysis*
