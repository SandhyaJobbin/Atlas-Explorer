# Phase 2: Map Interaction and Z-Index Fixes - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Map interactions are stable and the full control surface is accessible — no flicker, no obscured buttons, no border pop-in. Fixes 8 interaction bugs (INTERACT-01 through INTERACT-08) across InteractiveMap.tsx and layout components. Pure CSS + event handler fixes, no new features.

</domain>

<decisions>
## Implementation Decisions

### Selection Border Pop-In (INTERACT-03)
- Root cause: Effect B in InteractiveMap.tsx clears and re-applies ALL classLists every rAF frame, combined with `transition-all duration-300` on `.atlas-region` causing animation on every visual state update
- Fix: Stop full classList reset per rAF — only update changed classes via classList diff or style toggle. Remove `transition-all` from base `.atlas-region`, apply transitions only via explicit state classes.

### Hover Flicker on Small States (INTERACT-04, INTERACT-05)
- Debounce `onRegionHover` in Effect A listener registration (150ms threshold) — filter out rapid successive calls for same code
- Remove `pointermove` handler for hover entirely — use `pointerenter` for show + `pointerleave` for hide only. No position updates during hover.

### Per-Second Flicker (INTERACT-06, INTERACT-07)
- Investigate: probable cause is a volatile prop changing every second (timezoneMap, mode, or heatmapMap from parent timer) causing Effect B full re-run
- Fix: Audit Effect B deps, wrap volatile values in useRef or useMemo, split into separate effects per visual concern

### Obscured Controls (INTERACT-01, INTERACT-02, INTERACT-08)
- Fix: CSS z-index reorder in layout — single pass for all 3 overlapping controls. Identify stacking context of Passport button, zoom controls, and button behind Wave Standings, set explicit z-index values.
- Priority: Fix all 3 in one CSS pass (same root cause)

### Claude's Discretion
- Exact debounce timing values (150ms suggested)
- Which props trigger the per-second flicker — must be identified via dependency audit
- Specific z-index values for layout fix

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/src/components/map/InteractiveMap.tsx` — Core SVG map with pan/zoom/click/hover (612 lines, 2 main effects: Effect A for listener registration, Effect B for visual state)
- `app/src/components/map/StateOutline.tsx` — Single state outline (independent, no flicker issues)

### Established Patterns
- CSS classes via Tailwind utility classes + inline `<style>` tags for atlas-specific styles
- Pointer events for all mouse/touch interaction
- requestAnimationFrame batching for visual state updates (Effect B)
- CSS transitions via `[&_.atlas-region]:transition-all [&_.atlas-region]:duration-300`

### Integration Points
- MapExplorerPage passes `onRegionHover` and `onRegionClick` to InteractiveMap
- PinRush receives InteractiveMap in gameplay mode
- Layout components (AppLayout, WaveLeaderboardWidget) control container stacking

</code_context>

<specifics>
## Specific Ideas

- Selection pop-in: Effect B (line 252-301) runs on rAF and fully resets/rewrites classList for every region. If mode/timezoneMap changes trigger re-render in parent, this creates visible flicker.
- Hover: Both pointerenter and pointermove (lines 220-230) fire onRegionHover with position. Small states get rapid enter/move/leave cycles from pointer precision issues.
- Layout: WaveLeaderboardWidget likely has z-index > zoom controls and Passport button. Check AppLayout.tsx for stacking order.

</specifics>

<deferred>
## Deferred Ideas

None — all INTERACT requirements fit within phase scope.

</deferred>
