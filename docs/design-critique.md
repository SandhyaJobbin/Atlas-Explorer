# Atlas Explorer -- Design Critique

> Generated 2026-05-05 via automated Playwright screenshots + structured review.
> Screenshots: `app/screenshots/`

---

## Table of Contents

1. [Landing Page (Desktop)](#1-landing-page-desktop)
2. [Map Explorer (Desktop)](#2-map-explorer-desktop)
3. [Training Complete](#3-training-complete)
4. [Game Intro Screens](#4-game-intro-screens)
5. [CodeDrop Mid-game](#5-codedrop-mid-game)
6. [PinRush Mid-game](#6-pinrush-mid-game)
7. [CityStack Mid-game](#7-citystack-mid-game)
8. [Fail / Retry Intro](#8-fail--retry-intro)
9. [Results Page](#9-results-page)
10. [Mobile Viewport](#10-mobile-viewport)
11. [Cross-cutting Issues](#11-cross-cutting-issues)
12. [Summary & Prioritized Actions](#12-summary--prioritized-actions)

Severity: **Critical** = blocks usability or accessibility | **Major** = hurts polish/trust | **Minor** = refinement

---

## 1. Landing Page (Desktop)

**Screenshot:** `01-landing.png`

### Strengths
- Strong split-panel layout: dark left (form) + illustrated right (content) creates a clear entry point
- The "AE" badge and branding are well placed
- "Tap fast, stack streaks, own the map" is a punchy hero line
- Challenge track (01-04 steps) is a great preview of the journey
- "Quick Demo" secondary CTA is a smart low-friction option

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 1.1 | Major | Visual Hierarchy | The "Operational Readiness" stats panel (01, 03, 70%) at the top-right competes with the hero text. Both fight for primary attention. | Reduce the stats panel prominence -- smaller type, lower opacity, or move below the hero text. |
| 1.2 | Major | Color/Contrast | The compass illustration in the top-right is on a teal circle against a dark navy background. It's decorative clutter that doesn't serve navigation. | Remove or reduce opacity significantly. It floats without context. |
| 1.3 | Major | Spacing | The form labels ("PLAYER TAG", "WAVE CODE", "LEAD TRAINER") use all-caps tracking that's very tight on the left panel. The vertical spacing between form fields is generous but inconsistent with the compressed header area above them. | Standardize vertical rhythm. Use 16-20px gap between label and input, 24-28px between field groups. |
| 1.4 | Minor | Typography | "GEO RUSH - ICUBE" subtitle under "Atlas Explorer" uses very small tracked caps that may be unreadable at lower resolutions. | Increase to at least 11px / 0.75rem. |
| 1.5 | Minor | Consistency | The step cards (01 Map Explorer, 02 Code Drop, etc.) have a "TRAIN" / "PLAY" tag, but the tag is barely visible -- small, same-tone text that disappears into the dark card background. | Use a subtle pill badge with higher contrast, e.g. teal bg for TRAIN, orange bg for PLAY. |
| 1.6 | Major | Accessibility | The form inputs on the light left panel have very low-contrast borders (near-white on white). Users may not perceive the input boundary. | Add a visible border: 1px solid #D1D5DB or similar. |
| 1.7 | Minor | UX Pattern | No visible validation state or required-field indicators on the form. User won't know what's mandatory until they try to submit. | Mark required fields or add inline validation hints. |
| 1.8 | Minor | Layout | The right panel content (stats + hero + steps) is dense and could benefit from more vertical breathing room between sections. | Add 32px separator between the stats panel and hero text. |

---

## 2. Map Explorer (Desktop)

**Screenshots:** `02-map-explorer.png`, `02b-map-explorer-selected.png`

### Strengths
- The interactive SVG map is visually impressive and dominates the left panel appropriately
- The compass illustration and globe add thematic flavor
- The right-side panel (objectives list) is clean and scannable
- The "BEGIN EXPLORATION" CTA is prominent and well-placed
- The "0/63 explored" counter in the top-right provides clear progress tracking
- Pin markers on the map add visual interest

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 2.1 | Major | Visual Hierarchy | The right panel header stack is overloaded: "PHASE 00 - TRAINING ZONE" + "ATLAS CALIBRATION" + "Map Explorer" + description paragraph. Four levels of text hierarchy in a small space. | Collapse to 2 levels: a small phase tag and the main heading. Move the description into the body. |
| 2.2 | Major | Color/Contrast | The map regions are all one shade of gray (#6B7280-ish) against a dark #1F2937 ocean. There's no color differentiation to aid recognition or show progress. | Color-code explored vs unexplored regions (e.g., teal highlight for explored). This was likely intended since screenshots show 0 explored. |
| 2.3 | Minor | Spacing | The four objective cards ("Capitals", "Timezones", etc.) have generous padding but the label text (all-caps small) is very close to the value text below it. | Add 4px more gap between label and value. |
| 2.4 | Minor | Accessibility | The "63 REGIONS TO EXPLORE" subtext below the CTA button is extremely small and low contrast. | Increase size to 12px and bump contrast. |
| 2.5 | Minor | Consistency | The compass illustration overlaps the map area slightly, which looks intentional but the z-index stacking creates a visual artifact. | Ensure the compass has a subtle drop shadow or sits cleanly above the map edge. |
| 2.6 | Critical | UX Pattern | Screenshot 02b shows that clicking a state did NOT visibly change anything -- the "with state selected" screenshot looks identical to the base state. The state info panel may not be appearing, or the click target doesn't match. | Verify the `StateInfoPanel` component renders on state click. Check if `data-code` attributes exist on SVG paths. |
| 2.7 | Minor | Layout | The "TRAINING ZONE / NORTH AMERICA ATLAS" label at the bottom of the map is cramped against the bottom edge. | Add 16px bottom padding. |

---

## 3. Training Complete

**Screenshot:** `03-training-complete.png`

### Strengths
- Celebratory confetti animation creates a strong reward moment
- Milestone badges (Scout, Wayfinder, Cartographer, Completionist) provide a satisfying progression arc
- Timezone Breakdown card is a useful data summary
- The "Master Explorer Fact" with a trivia quote (Arkansas diamond mine) is a nice touch

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 3.1 | Major | Visual Hierarchy | The page has no CTA button visible in the viewport. Users hit a dead end -- where do they go next? The "proceed to games" action is presumably below the fold or auto-triggered. | Add a prominent "Start Mission Phase" or "Proceed to Games" CTA below the timezone card. |
| 3.2 | Major | Color/Contrast | The milestone badge icons are on dark circular backgrounds that blend into the dark green page background. The checkmark badges (green circles) on each icon are tiny and hard to distinguish. | Use brighter icon backgrounds or add a light ring/glow to separate them from the bg. |
| 3.3 | Minor | Typography | The timezone breakdown card has inconsistent text sizing -- timezone codes (PST, MST) are one size, the labels below them (Pacific, Mountain) are smaller, and the counts are large. This creates visual noise. | Unify to 2 sizes: timezone name (medium) and count (large). Drop the code or make it the primary label. |
| 3.4 | Minor | Spacing | The "50 US states - 13 Canadian provinces & territories" footer text at the very bottom is nearly invisible. | Either make it more prominent (regular text) or remove it -- the 63 count is already established. |
| 3.5 | Minor | Accessibility | The confetti animation may cause issues for users with vestibular disorders. | Respect `prefers-reduced-motion` media query to disable confetti. |

---

## 4. Game Intro Screens

**Screenshots:** `04-game-intro-codedrop.png`, `08-game-intro-pinrush.png`, `10-game-intro-citystack.png`

### Strengths
- Consistent layout pattern across all three game intros (map left, info right)
- The numbered pin progression (1 -> 2 -> 3) on the map is an excellent wayfinding device
- Phase tracking ("PHASE 1 // 03") provides context
- Stats boxes (Completion, Best Ratio) give returning players useful info
- The CTA labels are game-specific ("Begin Descent", "Open the Map", "Start Stacking") which adds personality
- "Unlimited retries - Stars based on precision" messaging removes anxiety

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 4.1 | Major | Visual Hierarchy | The large number badge (01, 02, 03) in the top-right corner of the info panel competes with the game title for attention. It's decorative but oversized. | Reduce the badge to 32px and move it inline with the phase label. |
| 4.2 | Minor | Color/Contrast | The green and teal pins on the map (representing completed and next games) are distinguishable from each other, but the color meaning isn't explained anywhere. | Add a small legend or use consistent iconography (checkmark for completed, arrow for current). |
| 4.3 | Minor | Typography | "No attempts yet" in the Best Ratio box wraps awkwardly into 3 lines. | Use a shorter string like "First try" or a dash. |
| 4.4 | Minor | Consistency | The bottom label ("NEXT TARGET: CODE DROP", "RECALCULATING: CODE DROP") uses different prefix text depending on first attempt vs retry. This is good UX, but the styling (orange pill) is the same for both states which hides the distinction. | Use a different color for retry state (e.g., red or amber pill for "RECALCULATING"). |
| 4.5 | Minor | Spacing | The three-dot progress indicator below the CTA button is nearly invisible. | Increase dot size from ~4px to 8px and add active-state styling to the current game's dot. |

---

## 5. CodeDrop Mid-game

**Screenshot:** `05-codedrop-midgame.png`

### Strengths
- The underwater/ocean theme is visually striking and cohesive
- The falling card with "CIPHER SIGNAL / Colorado / INPUT ID" is well-designed with clear hierarchy
- The code input field ("CODE CIPHER") and "COMMIT KEY" submit button are prominently placed
- Points/Streak HUD in the top-right is clean and readable
- The "AE" badge + "Code Drop / OCEAN DESCENT" branding at top-left anchors the screen
- Progress indicator ("1 OF 20") and depth bar provide spatial context

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 5.1 | Critical | Accessibility | The "CODE CIPHER" input field has extremely low contrast -- dark text placeholder on a near-black background. The two-letter placeholder dashes ("_ _") are barely visible. | Use a lighter input background (e.g., #1E3A5F) or brighter placeholder text. WCAG AA requires 4.5:1 contrast ratio. |
| 5.2 | Major | UX Pattern | The "COMMIT KEY" button appears disabled/grayed out but there's no visual cue that typing is required first. The button looks like a generic background element rather than an interactive control. | Style the button with a clear enabled state (teal/orange fill when input has content) and a visible disabled state (grayed + "Type the code" hint). |
| 5.3 | Major | Visual Hierarchy | The "DEPTH PROGRESS: 0%" bar at the top is very subtle. Combined with the "1 OF 20" counter, there are two redundant progress indicators competing. | Keep one: either the depth bar (for atmosphere) or the counter (for precision). If both, make the bar more prominent with a gradient fill. |
| 5.4 | Minor | Typography | "CIPHER SIGNAL" label on the falling card is all-caps tracked cyan text. The tracked all-caps style is used extensively across the app and starts to lose its emphasis when everything is tracked caps. | Reserve tracked caps for category labels only. Use regular weight for secondary labels. |
| 5.5 | Minor | Color | The bubble/particle effects at the bottom of the ocean area are nice but very subtle. The circles along the bottom are barely visible. | Increase bubble opacity or add a slight glow. They add atmosphere but are currently invisible at normal viewing distance. |

---

## 6. PinRush Mid-game

**Screenshot:** `09-pinrush-midgame.png`

### Strengths
- The "SATELLITE TARGET: Find Texas" prompt card is clear and immediately communicates the task
- The map rendering is clean with state boundaries visible
- The timer bar (yellow/orange, 42S LIMIT) creates appropriate urgency
- The bottom card tray showing upcoming targets (Texas, California, Ontario, etc.) with small state silhouettes is excellent design
- The "SKIP TARGET" button provides an escape valve
- Zoom controls (+/-/RESET) are well-placed at bottom-right

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 6.1 | Critical | Visual Hierarchy | The map is extremely dark (dark green on dark background). State boundaries are very hard to distinguish. Finding a specific state like Texas requires significant squinting. | Increase the contrast between states and borders. Use lighter fill for states (#4A6B5B) with darker strokes, or add subtle fill variation by region. |
| 6.2 | Major | Color/Contrast | The "DESERT EXPEDITION" subtitle under "Pin Rush" uses the same orange/amber as the timer bar, the brand color, and the active target card. Orange is overloaded as a color signal. | Reserve orange specifically for interactive/urgent elements (timer, current target). Use gray or white for decorative subtitles. |
| 6.3 | Major | UX Pattern | The timer bar shows "42S LIMIT" but there's no numeric countdown visible. Users need to mentally track the shrinking bar, which is stressful and imprecise. | Add a numeric countdown (e.g., "38s") next to or inside the timer bar. |
| 6.4 | Minor | Spacing | The HUD (Points/Streak/Objective) has good spacing but the "0x" streak value uses cyan (#00BCD4) while the objective "1/15" is in white. The color coding isn't explained. | Use consistent white for all HUD values, or add tooltip/legend for color meaning. |
| 6.5 | Minor | Layout | The three geometric shapes at the bottom-center of the map (compass rose pieces?) are large and obstruct the southern portion of the map. | Move decorative elements outside the interactive area or reduce their size significantly. |
| 6.6 | Minor | Accessibility | The small state silhouettes on the bottom target cards are very small and may not be recognizable, especially for states with similar shapes. | Increase silhouette size or add a subtle state-code label below each. |

---

## 7. CityStack Mid-game

**Screenshot:** `11-citystack-midgame.png`

### Strengths
- The forest background video/image creates strong atmosphere
- Three-column drop zone layout (British Columbia, Newfoundland and Labrador, Washington) is immediately understandable
- The draggable city cards at the top are clearly distinct from the drop zones
- The compass/crosshair loading indicator in each drop zone signals that cards should be placed there
- The HUD is consistent with other games (Points/Streak/Level)

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 7.1 | Critical | Readability | The city name cards at the top are severely truncated: "Cor...ir Pre...", "V...sto..e", "St. Jo h...". Card names are unreadable, defeating the purpose of the game. | Widen cards, reduce font size, or use a scrolling/wrapping layout for long names. This completely blocks gameplay. |
| 7.2 | Major | Color/Contrast | The entire screen has a dark green overlay from the forest background that makes everything muddy. The drop zones, cards, and text all blend together. | Increase the opacity of card backgrounds, or darken the forest overlay to create more separation. Use a frosted-glass/backdrop-blur effect on the card area. |
| 7.3 | Major | Visual Hierarchy | The drop zone headers ("BRITISH COLUMBIA", "NEWFOUNDLAND AND LABRADOR", "WASHINGTON") are the same visual weight as the draggable cards above. There's no clear distinction between "target" and "source". | Make drop zone headers bold/larger and add a colored underline. Make source cards slightly smaller with a different background tone. |
| 7.4 | Major | Layout | "NEWFOUNDLAND AND LABRADOR" is very long and may cause layout issues in the center column. | Consider abbreviating to "Newfoundland & Lab." in the game context, or use a two-line layout. |
| 7.5 | Minor | UX Pattern | The timer shows "0% REMAINING" in very small text. For a timed game, the timer needs to be much more prominent. | Make the progress bar taller (8px -> 12px) and add a numeric countdown. |
| 7.6 | Minor | Spacing | The large empty space below the three drop zones (bottom half of screen) is wasted. The game content is compressed into the top 40% of the viewport. | Expand drop zones vertically to use available space, making card placement targets larger and easier to hit. |

---

## 8. Fail / Retry Intro

**Screenshot:** `07-fail-game-intro-retry.png`

### Strengths
- "Remix Protocol" subtitle signals a retry state in-theme
- "RUN IT BACK" CTA text is encouraging and colloquial
- The Best Ratio (31%) gives honest feedback
- Layout is consistent with first-attempt intro screens

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 8.1 | Major | Visual Hierarchy | The retry intro looks almost identical to the first-attempt intro. Only the subtitle "Remix Protocol" and "RUN IT BACK" button text differ. Users may not realize they're retrying. | Add a more distinctive visual cue: different accent color on the info panel, a "RETRY" badge, or a brief motivational message about what went wrong. |
| 8.2 | Minor | UX Pattern | The score "80" shows in the top bar, but the completion ratio "0/3" is misleading -- they already attempted once. It should reflect attempt history. | Show "0/3 passed" more clearly, or display attempt count (e.g., "Attempt 2"). |
| 8.3 | Minor | Consistency | "Remix Protocol" is italic + highlighted, which is the only place in the app where italic is used for emphasis. | Use the same highlight treatment as other emphasis text (bold or color). |

---

## 9. Results Page

**Screenshot:** `12-results.png`

### Strengths
- "EXPEDITION CLEAR" headline with the trophy/celebration illustration creates a satisfying conclusion
- The three summary stats (Intelligence: 600, Merit Stars: 6, Sorties: 3) are clean and scannable
- Each stat has a colored underline accent (blue, orange, teal) for visual distinction
- The "MISSION LOG ENTRIES" section provides detailed per-game breakdown
- Agent name and sector pills ("AGENT: SCREENSHOT BOT", "SECTOR: DEMO") add personality
- Star ratings per game provide clear performance feedback

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 9.1 | Major | Color/Contrast | The entire page uses a dark olive/green palette with low-contrast text. The mission log cards (dark green on dark green background) lack edge definition. | Add subtle card borders or increase background contrast between cards and page. |
| 9.2 | Major | Visual Hierarchy | The "SECURED" status badge and "ID: CRACK" label are very small and low contrast (gray on dark). Game pass/fail status should be more prominent. | Make the status badge a colored pill (green for passed, red for failed) at a readable size. |
| 9.3 | Minor | Typography | "INTELLIGENCE" as a label for the total score is thematic but potentially confusing. Users may not immediately understand that this equals their game score total. | Add a smaller "(Total Score)" clarifier or tooltip. |
| 9.4 | Minor | Layout | The page scrolls (Game 3 "City Sorter" is cut off at the bottom). For only 3 games, the entire summary should fit in a single viewport. | Reduce card height or use a more compact layout for mission log entries. |
| 9.5 | Minor | Accessibility | The star ratings use emoji stars which may not render consistently across devices/screen readers. | Use SVG star icons with proper `aria-label` (e.g., "2 out of 3 stars"). |
| 9.6 | Major | UX Pattern | No CTA visible in the viewport -- no "Play Again", "View Leaderboard", or "Share Results" button. User hits a dead end. | Add primary CTA below the mission log, or a sticky footer with action buttons. |

---

## 10. Mobile Viewport

**Screenshots:** `13-landing-mobile.png`, `14-map-explorer-mobile.png`

### Strengths
- The landing form adapts well to mobile -- single column, full-width inputs, readable type
- "Resume Protocol" / "Skip & Start Fresh" on the resume card is clear for returning users
- The badge shelf preview is well-adapted to the narrower width

### Issues

| # | Severity | Category | Issue | Recommendation |
|---|----------|----------|-------|----------------|
| 10.1 | Critical | Layout | The mobile landing (screenshot 13) shows ONLY the form panel. The entire right side (hero text, stats, challenge track) is gone. On mobile, new users get zero context about what the app does before being asked to fill out a form. | Show a condensed hero section above the form on mobile: game title + one-line description + challenge preview. |
| 10.2 | Major | Color/Contrast | The mobile landing has a beige/cream background with very light gray inputs. The form fields blend into the background with almost no visual boundary. | Add visible borders or a subtle shadow to input fields on mobile. |
| 10.3 | Major | UX Pattern | Screenshot 14 shows the Map Explorer on mobile does NOT show the map at all -- it shows the landing page with a "Resume Protocol" card. The map explorer layout doesn't adapt to mobile. | Either: (a) stack the map above the info panel on mobile, or (b) show a "Map Explorer requires desktop" message with a graceful fallback. |
| 10.4 | Minor | Typography | "START DEPLOYMENT" button text uses heavy tracked caps that looks slightly crowded on mobile width. | Consider reducing letter-spacing on mobile breakpoints. |
| 10.5 | Minor | Spacing | Large whitespace below the "Quick Demo" button on mobile landing. The form doesn't fill the viewport height comfortably. | Center the form content vertically or add a small illustration/branding element below. |

---

## 11. Cross-cutting Issues

These issues appear across multiple screens:

| # | Severity | Category | Issue | Screens Affected |
|---|----------|----------|-------|-----------------|
| 11.1 | Major | Typography | Overuse of tracked uppercase (letter-spacing + text-transform: uppercase). Almost every label, heading subtitle, button, and category tag uses this style. When everything is emphasized, nothing is. | All screens |
| 11.2 | Major | Color System | The app uses 3+ shades of dark green/olive as primary backgrounds, but the shades are too close together, causing cards and containers to blend into each other. | Training Complete, Results, Game intros |
| 11.3 | Major | Consistency | The app has two distinct visual languages: (1) the landing/intro screens use a warm cream/amber palette, and (2) the games each have their own themed palette (ocean blue, desert amber, forest green). Transitions between these feel jarring. | Navigation between landing and games |
| 11.4 | Minor | Accessibility | No visible focus indicators on interactive elements across any screen. Keyboard navigation is likely broken. | All screens |
| 11.5 | Minor | Accessibility | The app uses emoji extensively for badges, game icons, and UI elements. Screen readers will read these as their Unicode descriptions, which may be verbose or unhelpful. | Landing, Training Complete, Results |
| 11.6 | Minor | Performance | Multiple background videos (desert, forest, ocean) are loaded for game themes. These are heavy assets for what is primarily a knowledge quiz app. | CodeDrop, PinRush, CityStack |
| 11.7 | Critical | UX Pattern | No back/exit button is visible during games. Once a game starts, there's no way to pause, quit, or return to the menu without using browser navigation. | All mid-game screens |

---

## 12. Summary & Prioritized Actions

### Critical (Fix immediately)

1. **CityStack card truncation** (#7.1) -- City names are unreadable, making the game unplayable
2. **Mobile landing lacks context** (#10.1) -- New mobile users see a form with zero explanation
3. **CodeDrop input contrast** (#5.1) -- Input field is nearly invisible against dark background
4. **No exit/back during games** (#11.7) -- Users are trapped once they start a game
5. **Map Explorer state click broken** (#2.6) -- Clicking states doesn't show info panel (verify)

### Major (Fix before launch)

6. **Dark-on-dark contrast everywhere** (#11.2, #9.1, #7.2) -- Cards and containers blend into backgrounds across Training Complete, Results, and CityStack
7. **Missing CTAs on completion screens** (#3.1, #9.6) -- Training Complete and Results pages are dead ends with no clear next action
8. **Tracked uppercase overuse** (#11.1) -- Reduce to labels/tags only; use regular case for descriptions and secondary text
9. **Landing form input visibility** (#1.6, #10.2) -- Low-contrast borders on both desktop and mobile
10. **PinRush map visibility** (#6.1) -- Map is too dark to find states effectively
11. **Retry state indistinguishable** (#8.1) -- Users can't easily tell they're retrying vs. first attempt
12. **Mobile Map Explorer broken** (#10.3) -- Map doesn't render on mobile viewport

### Minor (Polish pass)

13. Reduce visual noise on landing right panel (#1.1, #1.2, #1.8)
14. Standardize heading hierarchy on Map Explorer (#2.1)
15. Add `prefers-reduced-motion` support for confetti (#3.5)
16. Enlarge progress dots on game intros (#4.5)
17. Add numeric timer countdown to PinRush (#6.3) and CityStack (#7.5)
18. Add focus indicators for keyboard accessibility (#11.4)
19. Add proper aria-labels for emoji-based UI elements (#11.5)
20. Consider lazy-loading background videos (#11.6)

### Overall Assessment

The app has a **strong thematic foundation** -- the expedition/agent metaphor is well-executed, game variety is good, and the visual polish on individual screens (especially CodeDrop's underwater theme) is impressive. The primary issues fall into three buckets:

1. **Contrast and readability** -- The dark-on-dark palette is atmospheric but sacrifices legibility
2. **Flow gaps** -- Missing CTAs and dead-end screens break the user journey
3. **Mobile support** -- Critical screens don't render properly on smaller viewports

Addressing the 5 critical items and the top 7 major items would significantly improve the experience. The minor items can be tackled in a follow-up polish pass.
