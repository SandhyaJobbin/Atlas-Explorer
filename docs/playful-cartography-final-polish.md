# Playful Cartography Redesign — Final Polish Plan

## Context

The Playful Cartography redesign (docs/playful-cartography-redesign.md) is ~95% implemented. A thorough audit found only 3 real code gaps remaining. The 5 Lottie files from the spec that were never downloaded (star-burst, fire-streak, checkmark, airplane, timer) cannot be obtained — but existing GIF stickers and CSS effects already cover those use cases adequately, so no code changes needed for those.

## Remaining Gaps (3 changes)

### 1. City Stack: Add dashed border to drop zones during drag
**File:** `css/geo.css` (~line 4804)
**Issue:** The `.is-dragging` state triggers a pulsing border-color animation (`canopyDropPulse`), but the border style remains solid. Spec says "pulsing dashed border when dragging".
**Fix:** Add `border-style: dashed !important;` to the `.city-stack-card.is-dragging .kanban-column` rule.

### 2. Star-sparkle.gif: Wire into star earned moments
**File:** `js/ui-effects.js` (near `spawnStarBurst()` ~line 232)
**Issue:** `assets/stickers/star-sparkle.gif` exists but is never used. Spec says it should appear on "star earned moment".
**Fix:** In `spawnStarBurst()` (or wherever stars are revealed in results), append a positioned `<img src="assets/stickers/star-sparkle.gif">` that auto-removes after ~1s. The image should be `position: absolute; pointer-events: none;` like other stickers.
**CSS:** Add a `.star-sparkle-sticker` class in `css/geo.css` with sizing (~80x80px), absolute positioning, fade-out animation, and `prefers-reduced-motion: reduce` -> `display: none`.

### 3. Hub map: Add coordinate grid overlay
**File:** `js/main.js` (inside `renderIntro` where hub map is built, ~line 167-200)
**Issue:** Spec calls for a subtle coordinate grid overlay at 3% opacity on the hub map.
**Fix:** Add an SVG `<pattern>` element that draws a light grid (dashed lines every ~50px) and overlay it as a `<rect>` with `fill="url(#coord-grid)"` at 3% opacity inside the hub map SVG container. Add `pointer-events: none` so it doesn't interfere with clicks.
**CSS:** `.hub-coord-grid { opacity: 0.03; pointer-events: none; }` in `css/geo.css`.

## Files to Modify

| File | Change |
|------|--------|
| `css/geo.css` | Add `border-style: dashed` to drag state; add `.star-sparkle-sticker` class; add `.hub-coord-grid` class |
| `js/ui-effects.js` | Wire `star-sparkle.gif` into star burst function |
| `js/main.js` | Add coordinate grid SVG overlay to hub map |

## Not Changing (Lottie files)

The 5 undownloaded Lottie animations (star-burst.json, fire-streak.json, checkmark.json, airplane.json, timer.json) are **not referenced in code** — the implementation already uses GIF stickers and CSS animations as alternatives:
- `checkmark.gif` used for correct answer overlay
- `fire.gif` used for streak indicator
- `airplane.gif` used in page wipe
- CSS pulsing used for timer urgency
- CSS particles used for star bursts

No code changes needed for these.

## Verification

1. **City Stack drag test:** Start a City Stack game, drag a card — drop zones should show pulsing **dashed** green borders
2. **Star sparkle test:** Complete a level and earn stars — star-sparkle.gif should flash briefly on each star
3. **Hub map grid test:** Load the hub/intro screen — a very faint grid should be visible over the map at 3% opacity
4. **Reduced motion test:** Enable `prefers-reduced-motion: reduce` in browser — star-sparkle sticker and grid should gracefully degrade (sticker hidden, grid still visible as static element)
5. **Existing functionality regression:** Play through all 3 games end-to-end to confirm nothing broke
