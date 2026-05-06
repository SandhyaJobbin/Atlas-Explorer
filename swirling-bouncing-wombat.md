# Bug Fix Plan: Atlas Explorer - 8 Issues

## Context
Multiple UI/UX bugs across the Atlas Explorer app: landing page button unclickable, broken SVG map, incorrect labels, unwanted stamps, Typewriter cursor issue, missing Enter key support, PinRush map invisible, and CityStack crash.

---

## Fix 1: Landing Page Submit Button Unclickable
**File:** `app/src/features/landing/LandingPage.tsx` (lines 289-304)

**Problem:** The form section uses `overflow-y-auto` on mobile (line 167) but the buttons at the bottom may be cut off or obscured by the viewport edge.

**Fix:** Add bottom padding/margin to the button container so it scrolls fully into view. Add `pb-8` or similar to the form's button section (line 289), or to the parent section's padding.

---

## Fix 2: SVG Map Broken in Map Explorer
**File:** `app/public/maps/north-america.svg`

**Problem:** The SVG viewBox is `"-189.42 -1146.98 1157.42 1914.13"` — the y-offset of -1146.98 is far too negative. Path data coordinates are roughly in range x:[-190, 970], y:[-37, 770]. The content is pushed to the bottom of a very tall viewport, making most of the map appear blank.

**Fix:** Recalculate the viewBox to properly frame the actual path data. Scan all path coordinates and set a tight viewBox like `"-189.42 -50 1157.42 830"` (will verify exact bounds by checking path data ranges). This also fixes **Fix 7 (PinRush map)** since both use the same SVG.

---

## Fix 3: "Coast" Label → "Country" with Name + Code
**Files:**
- `app/src/components/map/StateInfoPanel.tsx` (line 86-87)
- `app/src/components/ui/InfoCard.tsx` (line 54-55)
- `app/src/components/layout/IntelVault.tsx` (line 171)

**Fix:** Change label from `"Coast"` to `"Country"` and value from `{state.coast}` to a formatted string like `"United States (US)"` / `"Canada (CA)"`. Map `state.country` to full name:
```tsx
const countryLabel = state.country === 'CA' ? 'Canada (CA)' : 'United States (US)';
```

---

## Fix 4: Remove Verified/Fraudulent Stamp in CodeDrop
**File:** `app/src/features/games/CodeDrop.tsx`

**Fix:** Remove:
- `showStamp` state (line 45)
- `setShowStamp('VERIFIED')` (line 201)
- `setShowStamp('FRAUDULENT')` (lines 224, 243)
- `setShowStamp(null)` (lines 227, 246, 503)
- StampBadge render block (lines 490-497)
- StampBadge import (line 20 area)

---

## Fix 5: Remove Typewriter Underscore Cursor from State Name
**File:** `app/src/components/ui/Typewriter.tsx` (line 38)

**Problem:** The Typewriter always shows a trailing `_` cursor: `<span className="animate-pulse opacity-50 ml-0.5">_</span>`. This shows as "California_" on every card.

**Fix:** Hide the cursor after animation completes. Add a `finished` state and only show the cursor while typing is in progress:
```tsx
const [finished, setFinished] = useState(false);
// Set finished=true when animation completes
// Only render cursor span when !finished
```

---

## Fix 6: Enter Key to Dismiss Info Card in CodeDrop
**File:** `app/src/features/games/CodeDrop.tsx` (lines 500-509)

**Problem:** After answering correctly, the info card overlay appears with "Tap anywhere to continue" but doesn't respond to Enter key.

**Fix:** Add a `useEffect` that listens for Enter key when `correctState` is not null, and triggers the same action as clicking (dismiss card + advance question):
```tsx
useEffect(() => {
  if (!correctState) return;
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      setCorrectState(null);
      setShowStamp(null); // if stamp still exists at this point
      advanceQuestion();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [correctState]);
```

---

## Fix 7: PinRush Map Not Visible
**Root cause:** Same broken SVG viewBox as Fix 2. Fixing the SVG file fixes this. The InteractiveMap component and PinRush's CSS wrappers are correct — inline styles from InteractiveMap override the Tailwind fill classes properly.

---

## Fix 8: CityStack Crash — `retryAvailable` undefined
**File:** `app/src/features/games/GameShellPage.tsx` (line 173)

**Problem:** `session.games[shellState.gameIndex]` returns `undefined` when the session was persisted with fewer games than current `GAME_DEFINITIONS`. The `game` prop passed to `GameIntro` is undefined, causing crash at `game.retryAvailable`.

**Fix:** Add a defensive guard before rendering GameIntro:
```tsx
const currentGame = session.games[shellState.gameIndex];
```
If `currentGame` is undefined, either:
- Return a fallback/loading state, OR
- Migrate the session by ensuring `session.games` always matches `GAME_DEFINITIONS.length` (add missing games via `makeGameStates` defaults)

**Recommended:** Add session migration in session loading (`loadSession` or wherever session is restored from localStorage) to append missing game entries when `GAME_DEFINITIONS` grows. Also add a guard in GameShellPage as a safety net.

---

## Files to Modify
1. `app/src/features/landing/LandingPage.tsx` — padding fix
2. `app/public/maps/north-america.svg` — viewBox fix
3. `app/src/components/map/StateInfoPanel.tsx` — Coast → Country
4. `app/src/components/ui/InfoCard.tsx` — Coast → Country
5. `app/src/components/layout/IntelVault.tsx` — Coast → Country
6. `app/src/features/games/CodeDrop.tsx` — remove stamps, add Enter key handler
7. `app/src/components/ui/Typewriter.tsx` — hide cursor after animation
8. `app/src/features/games/GameShellPage.tsx` — guard undefined game
9. `app/src/lib/session.ts` — session migration for new games

## Verification
- Run `npm run dev` and test each fix:
  1. Landing page: scroll to bottom, click "Start Deployment"
  2. Map Explorer: SVG map should render with all regions visible and interactive
  3. StateInfoPanel/InfoCard: should show "Country" label with "United States (US)" or "Canada (CA)"
  4. CodeDrop: no stamp overlay on correct/wrong answers
  5. CodeDrop: state name should not have trailing underscore after typing animation
  6. CodeDrop: press Enter to dismiss the info card after a correct answer
  7. PinRush: map should be visible with all regions
  8. Navigate to third game (CityStack): should load without crash
