# Atlas Explorer: Playful Cartography Redesign

## Context

The current "Modern Geographic" design feels like a corporate assessment tool — flat, muted, and boring. The goal is to transform it into an exciting, game-like experience with Playful Cartography energy (Duolingo/Kahoot vibes) while keeping it appropriate for a mixed-age training context. Key priorities: animations, sound cues, progress/unlock visuals, particle effects, and rich map visuals.

**Decisions made:**
- Background: Warm cream (light parchment) across all screens
- Lottie: Full set (10 animations for celebrations/transitions)
- Avatar: Skip — focus on patterns, particles, animations, sound
- Per-game terrain themes: Keep and elevate
- No new frameworks — vanilla CSS + JS
- Tools available: Canva Pro, ChatGPT (image generation), free sources
- **Layout: Fixed-viewport desktop webapp — NO scrolling. Every screen fits 100vh/100vw like a real game.**

---

## Layout Philosophy: Game-App, Not Website

The entire app must feel like a **fixed-screen game application**, not a scrollable web page:

- `html, body`: `height: 100vh; overflow: hidden;`
- Every screen (landing, hub, game, interstitial, results) occupies exactly one viewport
- Content is arranged with flexbox/grid to fill available space — never overflows
- If content varies in size, use internal scrollable panels (small scrollable leaderboard table) but the page itself never scrolls
- Game cards expand to fill the viewport height (minus topbar)
- Transitions between screens are instant swaps or animated wipes — no scroll-to-section
- On smaller viewports (below 1024px width), gracefully compress but still no scroll
- Minimum supported resolution: 1280x720 (standard laptop)

**CSS foundation:**
```css
html, body {
  height: 100vh;
  overflow: hidden;
  margin: 0;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.topbar { flex-shrink: 0; }

.game-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

This applies to ALL screens:
- **Landing**: Two-panel layout fills viewport (form left, visual right)
- **Hub/Intro**: Map + mission brief side-by-side, vertically centered
- **Games**: Game card fills available space between topbar and bottom
- **Interstitials**: Centered modal overlay on current game backdrop
- **Results**: Grid layout that fits in viewport (internal scroll only for leaderboard rows if >10)

---

## Assets to Download & Create

### A. FROM CANVA PRO (canva.com)

#### Animated Stickers (export as GIF or APNG, ~100-200KB each)
Place in `assets/stickers/`:

| Search in Canva | File name | Use | Export settings |
|-----------------|-----------|-----|-----------------|
| "map pin animated" or "location bounce" | pin-bounce.gif | Active game waypoint on journey map | GIF, transparent bg, 200x200px |
| "compass spinning" | compass-spin.gif | Hub map decoration | GIF, transparent bg, 120x120px |
| "celebration confetti" | celebrate.gif | Pass interstitial overlay | GIF, transparent bg, 400x400px |
| "star sparkle animated" | star-sparkle.gif | Star earned moment | GIF, transparent bg, 80x80px |
| "fire flame animated" | fire.gif | Streak indicator (3+) | GIF, transparent bg, 60x60px |
| "checkmark animated" or "tick green" | checkmark.gif | Correct answer flash | GIF, transparent bg, 80x80px |
| "trophy celebration" | trophy.gif | Results (all levels complete) | GIF, transparent bg, 200x200px |
| "paper airplane flying" | airplane.gif | Level transition decoration | GIF, transparent bg, 150x80px |
| "wave water animated" | wave.gif | Code Drop ambient decoration | GIF, transparent bg, 300x60px |
| "sand dust wind" | sand-dust.gif | Pin Rush ambient decoration | GIF, transparent bg, 300x60px |

#### Illustration Elements (export as SVG or PNG with transparent bg)
Place in `assets/illustrations/`:

| Search in Canva | File name | Use | Export |
|-----------------|-----------|-----|--------|
| "anchor nautical illustration" | anchor.svg | Code Drop (water) theme icon | SVG, 80x80px |
| "cactus desert illustration" | cactus.svg | Pin Rush (desert) theme icon | SVG, 80x80px |
| "pine tree forest illustration" | pine-tree.svg | City Stack (forest) theme icon | SVG, 80x80px |
| "compass rose vintage" | compass-rose.svg | Journey map corner decoration | SVG, 200x200px |
| "ribbon banner" or "scroll banner" | ribbon-banner.svg | Score/title decoration | SVG, 300x80px |
| "treasure map" or "adventure map" | map-bg.png | Hub panel background texture | PNG, 800x600px, low opacity |
| "parchment paper texture" | parchment.png | Card background texture tile | PNG, 400x400px, seamless if possible |
| "watercolor splash blue" | splash-water.png | Code Drop card accent | PNG transparent, 300x300px |
| "watercolor splash orange/yellow" | splash-desert.png | Pin Rush card accent | PNG transparent, 300x300px |
| "watercolor splash green" | splash-forest.png | City Stack card accent | PNG transparent, 300x300px |
| "world map illustration" or "globe" | globe-illustration.png | Landing page hero | PNG transparent, 400x400px |
| "travel stickers set" | travel-stickers.png | Results page decorations | PNG transparent, 600x200px |
| "wax seal stamp" | wax-seal.png | Badge unlock decoration | PNG transparent, 100x100px |
| "torn paper edge" | torn-edge.png | City Stack card tops | PNG transparent, 400x20px |
| "dotted trail path" | trail-path.svg | Journey map route connector | SVG, 600x50px |

#### Background Videos (export as MP4, 720p, 5-10 seconds loop)
Place in `assets/video/`:

| Search in Canva | File name | Use | Export |
|-----------------|-----------|-----|--------|
| "ocean waves calm" or "water surface" | water-bg.mp4 | Code Drop ambient background (plays behind game at 10% opacity) | MP4, 720p, 8s loop, muted |
| "sand dunes wind" or "desert sand" | desert-bg.mp4 | Pin Rush ambient background | MP4, 720p, 8s loop, muted |
| "forest canopy light" or "leaves sunlight" | forest-bg.mp4 | City Stack ambient background | MP4, 720p, 8s loop, muted |
| "paper texture moving" or "parchment" | paper-bg.mp4 | Landing page subtle background | MP4, 720p, 10s loop, muted |

> NOTE: Videos will be `<video autoplay muted loop playsinline>` behind game cards at very low opacity (8-12%). They add atmospheric depth without distracting from gameplay. Keep file size under 2MB each.

#### Custom Patterns/Textures (export as PNG, seamless tile)
Place in `assets/patterns/`:

| Search/Create in Canva | File name | Use | Export |
|------------------------|-----------|-----|--------|
| "topographic lines pattern" | topo-pattern.png | Body background tile | PNG, 400x400px, subtle/light |
| "wave pattern blue" | wave-pattern.png | Water terrain card background | PNG, 200x100px, seamless |
| "dot grid pattern" | dots-pattern.png | Desert terrain card background | PNG, 200x200px, seamless |
| "contour lines green" | contour-pattern.png | Forest terrain card background | PNG, 200x200px, seamless |
| "paper texture cream" | paper-grain.png | Card surface texture overlay | PNG, 300x300px, very subtle |
| "confetti scattered" | confetti-pattern.png | Celebration background | PNG transparent, 600x600px |

#### How to export from Canva:
1. Open canva.com -> Elements tab
2. Search the term listed above
3. Drag to a canvas of the size specified
4. File -> Download -> choose format (SVG for vectors, PNG transparent for images, GIF for animated, MP4 for videos)
5. Name the file as listed and place in the correct `assets/` subfolder

---

### B. FROM CHATGPT (Image Generation)

Use ChatGPT's DALL-E to generate custom illustrations. Place in `assets/generated/`:

| Prompt to use | File name | Use |
|---------------|-----------|-----|
| "A cute illustrated compass rose in a playful cartography style, vibrant colors, flat design, white background, no text" | compass-hero.png | Landing page hero decoration |
| "3 illustrated game level icons in playful style: an ocean wave, a desert sun, and a forest tree, side by side, flat design, vibrant colors, transparent background" | level-icons.png | Journey map waypoint icons (crop into 3) |
| "An illustrated treasure map border frame, playful cartography style, warm cream parchment, dashed paths, compass marks, vibrant colors" | map-frame.png | Hub map container border decoration |
| "A set of 6 small illustrated landmark icons: Statue of Liberty, CN Tower, palm tree, mountain peak, cactus, lighthouse, playful flat style, vibrant colors, white background" | landmarks.png | Map landmark decorations (crop individually) |
| "An illustrated 'LEVEL COMPLETE' celebration badge, ribbon banner style, gold and coral colors, playful cartography design, no realistic text" | level-complete-badge.png | Pass interstitial decoration |
| "A playful illustrated expedition journal page with tape, stamps, and sticker decorations, warm cream background, empty center area" | journal-bg.png | Results page background texture |
| "3 illustrated travel postcards stacked at slight angles, featuring ocean, desert, and forest scenes, playful colorful style" | postcards-stack.png | Results per-game decoration |
| "A playful illustrated corkboard with pinned cards and ribbons, warm brown tones, empty slots for content" | corkboard-bg.png | Leaderboard background |

> TIP: Generate at 1024x1024, then resize/crop as needed. Save as PNG.

---

### C. FREE SOURCES

#### Sound Effects (9 clips, MP3, <50KB each)
Place in `sfx/`:

| Sound | Use | Source |
|-------|-----|--------|
| Bright chime | Correct answer | Kenney Interface Sounds (CC0) — kenney.nl/assets/interface-sounds |
| Low thud/buzz | Wrong answer | Same pack |
| Ascending notes | Streak (3+) | Same pack |
| Celebratory jingle | Level passed | Mixkit — mixkit.co/free-sound-effects/game/ |
| Descending notes | Level failed | Mixkit |
| Clock tick (loop) | Timer warning | Kenney |
| Soft pop | Button click | Kenney |
| Sparkle ding | Star earned | Mixkit |
| Fanfare | Badge unlocked | Mixkit |

#### Icons
- **Phosphor Icons** — phosphoricons.com (MIT) — lock, star, compass, sound toggle, trophy, map-pin
- Use as inline SVGs copied directly into HTML/JS

#### Lottie Animations (10 files)
Place in `assets/lottie/` as .json files. Render with `@lottiefiles/lottie-player` web component (~50KB CDN):

| Search on LottieFiles | File name | Use |
|-----------------------|-----------|-----|
| "spinning globe" or "earth rotate" | globe.json | Landing page hero decoration |
| "paper plane" or "airplane flying" | airplane.json | Page transition between levels |
| "flag plant" or "waving flag" | flag-plant.json | Level completed celebration |
| "confetti celebration" | confetti.json | Pass interstitial |
| "star burst" or "stars explosion" | star-burst.json | Star earned moment |
| "trophy gold" | trophy.json | Results screen (all levels complete) |
| "streak fire" or "flame loop" | fire-streak.json | Hot streak indicator (3+) |
| "level up" or "upgrade" | level-up.json | Advancing to next level |
| "countdown timer" | timer.json | Timer running low urgency |
| "checkmark success" | checkmark.json | Correct answer feedback |

#### Background Patterns (CSS/SVG generators)
- **Hero Patterns** — heropatterns.com — topographic/wave SVG patterns
- **SVG Backgrounds** — svgbackgrounds.com — customizable
- **Haikei** — haikei.app — generate blobs, waves, layered backgrounds

#### Fonts (Google Fonts CDN)
- **Nunito** — fonts.google.com/specimen/Nunito (weights: 700, 800, 900)
- Inter already loaded

---

## Implementation Plan

### Phase 1: Color Palette + Typography (Highest visual impact)

**Files:** `css/styles.css`, `css/geo.css`, `index.html`, `game.html`

Replace muted terrain tones with vibrant palette:
```css
:root {
  --primary:        #FF6B35;  /* warm coral-orange */
  --terrain-water:  #06B6D4;  /* electric cyan — was #4A7C6F */
  --terrain-desert: #F59E0B;  /* golden amber — was #C4883A */
  --terrain-forest: #10B981;  /* emerald green — was #3D6B3A */
  --correct:        #22C55E;
  --wrong:          #EF4444;
  --streak:         #8B5CF6;  /* purple */
  --xp-gold:        #FBBF24;
  --bg-cream:       #FFF8E7;  /* warm cream background */
  --bg-sand:        #F7F0E3;  /* card surfaces */
  --ink:            #3C3C3C;  /* primary text */
  --muted:          #6B7280;  /* secondary text */
}
```

- Add Nunito for headings (`font-weight: 800-900`)
- Keep Inter for body
- Backgrounds: warm cream + subtle gradient mesh (using Canva topo-pattern.png as body tile at 3-5% opacity)
- Swap font import in both HTML files
- Apply `height: 100vh; overflow: hidden` to html/body

### Phase 2: Component Shape + 3D Depth

**Files:** `css/geo.css`

- **Cards/panels**: `border-radius: 20px`, bottom shadow for 3D depth, Canva paper-grain.png overlay at 4% opacity
- **Buttons**: Chunky 3D style (4px colored bottom shadow, press-down transform on click, min-height 52px, `border-radius: 14px`)
- **Progress bar**: Rounded pill shape with gradient fill + bounce easing on update
- **Input fields**: Larger, glow ring on focus using terrain accent, `border-radius: 12px`
- **Elevation system**: 4 levels (resting -> hovered -> floating -> active-drag)
- **Watercolor accents**: Canva splash PNGs positioned behind game cards at 15% opacity

### Phase 3: Animations + Micro-interactions

**Files:** `css/geo.css`, `js/ui-effects.js`

- **Page transition**: Full-screen color slide wipe (terrain accent colored) — upgrade existing `pageWipe()`
- **Element entrances**: `.pop-in`, `.slide-up`, `.bounce-in` utility classes with staggered delays
- **Score popup**: "+100" text floats up and fades out (spawn at score location)
- **Timer urgency**: Pulsing fill bar + red edge vignette at <10%, Lottie timer.json at <20%
- **Streak badge**: Purple glow with bounce-in, Canva fire.gif at 5+
- **Buttons**: Scale 0.95 on `:active`, spring-back transition
- **Cards**: Subtle tilt parallax on hover (JS `mousemove` -> `perspective()` + `rotateX/Y`)
- **Correct/Wrong**: Canva checkmark.gif / Lottie checkmark.json overlay on answer

### Phase 4: Particle Systems

**Files:** `js/ui-effects.js`, `css/geo.css`

Per-terrain ambient particles (CSS-driven, lightweight):

**Water terrain (Code Drop):**
- Floating bubble particles rising from bottom (6-8 circles, staggered, 8-14s loop)
- Water ripple ring on correct answer (expanding circle with opacity fade)
- Splash particles on block landing
- Canva wave.gif as subtle bottom-edge decoration

**Desert terrain (Pin Rush):**
- Sand grain drift (tiny dots moving horizontally, slow, sparse)
- Sand burst on correct click (8-12 particles radiating outward)
- Heat shimmer overlay (subtle translateY oscillation)
- Canva sand-dust.gif as subtle decoration

**Forest terrain (City Stack):**
- Falling leaf particles (4-6 leaves, gentle drift with rotation)
- Green sparkle burst on correct drop
- Vine/growth animation on filled bucket

**Shared particles:**
- Gold sparkles on streak milestones (3, 5, 8)
- Star particles burst outward on star earned + star-sparkle.gif
- Confetti on level pass (upgrade existing + Lottie confetti.json)

Implementation: `spawnParticles(container, type, count)` function with randomized CSS custom properties.

### Phase 5: Sound Design

**Files:** NEW `js/audio.js`, integrate into `js/main.js` + game modules

- Web Audio API with lazy-loaded buffer cache (fetch MP3 on first use)
- Mute toggle button in topbar (Phosphor speaker icon, persisted to localStorage)
- Wire sounds to: correct, wrong, streak, pass, fail, tick, click, star, badge
- Respect `prefers-reduced-motion`

```javascript
// js/audio.js — public API
export function playSound(name) { ... }
export function toggleMute() { ... }
export function isMuted() { ... }
```

### Phase 6: Per-Game Visual Polish + Video Backgrounds

**Status:** Completed in the root vanilla app on 2026-05-04.

**Files:** `js/crack-the-code.js`, `js/pin-it.js`, `js/city-sorter.js`, `css/geo.css`

**Code Drop — "Ocean Descent":**
- Background video: water-bg.mp4 at 10% opacity behind drop zone
- Falling blocks: cyan glow border + slight rotation (random -3 to 3deg)
- Drop zone: ocean depth gradient over video
- Correct: block pulses with ripple ring + checkmark.gif overlay
- Wrong: block shatters (clip-path split), turns red
- Input: cyan glow ring on focus, pulse on correct
- Decoration: anchor.svg in corner, wave-pattern.png border

**Pin Rush — "Desert Expedition":**
- Background video: desert-bg.mp4 at 8% opacity behind map
- Map regions: lift on hover (translateY(-1px) + golden glow shadow)
- Correct click: stamp checkmark + sand particle burst
- Wrong click: region shakes + red flash
- Target label: bouncing callout with pointing arrow
- Radar sweep: warm golden tint
- Decoration: cactus.svg in corner, dots-pattern.png border

**City Stack — "Forest Canopy":**
- Background video: forest-bg.mp4 at 10% opacity behind kanban board
- Cards: ticket-style with torn-edge.png top, Canva travel sticker feel
- Drag: card lifts to elevation-4 + scale 1.05 + shadow grows
- Correct: satisfying snap + green sparkles
- Wrong: bounce-back with wobble + bucket shakes
- Drop zones: pulsing dashed border when dragging
- Decoration: pine-tree.svg in corner, contour-pattern.png border

### Phase 7: Richer Map Visuals

**Status:** Completed in the root vanilla app on 2026-05-04.

**Files:** `js/main.js` (renderIntro), `css/geo.css`, `maps/north-america.svg`

**Hub/Journey Map enhancements:**
- Background: Canva map-bg.png or ChatGPT map-frame.png as container texture
- Terrain shading on SVG regions (subtle color fills per territory)
- Animated route drawing between waypoints (stroke-dasharray + stroke-dashoffset)
- ChatGPT landmarks.png cropped icons placed at key map positions
- "Fog of war" — uncompleted territories grayed/dimmed, revealed with sweep on completion
- Canva compass-rose.svg / ChatGPT compass-hero.png in corner
- Coordinate grid overlay (3% opacity)
- Animated pins: Canva pin-bounce.gif for active, static colored for complete, lock icon for locked
- Trail path: Canva/SVG dotted-trail connecting waypoints

### Phase 8: Landing, Results & Celebrations + Lottie

**Files:** `js/main.js`, `js/results.js`, `js/ui-effects.js`, `index.html`, `game.html`

**Landing page:**
- Fixed viewport, two-panel layout (form left, visual showcase right)
- Background: paper-bg.mp4 at 5% opacity + topo-pattern.png tile
- Hero: Lottie globe.json or Canva globe-illustration.png with parallax
- ChatGPT compass-hero.png as decorative element
- Challenge cards as "chapters" with terrain icons (level-icons.png)
- Entry animation: panels slide in from sides

**Level transitions:**
- Paper airplane: Canva airplane.gif flies across during pageWipe
- Level-up: Lottie level-up.json plays briefly
- Flag plant: Lottie flag-plant.json on completion

**Results — "Expedition Journal":**
- Fixed viewport grid layout (no scroll)
- Background: ChatGPT journal-bg.png as page texture
- Score count-up with number pop animation + sound
- Stars reveal one-at-a-time with Lottie star-burst.json
- Per-game cards: use ChatGPT postcards-stack.png style framing + city photos
- Travel stickers: Canva travel-stickers.png scattered decoratively
- All passed: Lottie trophy.json + Canva trophy.gif + confetti

**Badge unlock ceremony:**
- Full-screen modal with blur backdrop
- Badge spins in with scale (3x -> 1x) + Canva wax-seal.png stamp effect
- Sound fanfare plays
- Star particles burst outward
- Ribbon banner (ribbon-banner.svg) unfurls behind

**Leaderboard:**
- Background: ChatGPT corkboard-bg.png texture
- Top 3: medal decorations (gold/silver/bronze)
- Current user row: pulsing glow border
- Internal scroll only if >10 rows (page itself stays fixed)
- Cards pin in one-at-a-time animation

---

## Key Technical Decisions

- **Fixed viewport**: `100vh` height, `overflow: hidden` on body — game-app feel
- No new frameworks — all vanilla CSS + JS
- Keep `data-terrain` system — just swap accent color values
- CSS animations preferred over JS (GPU compositing, performance)
- Lottie for complex animations — `@lottiefiles/lottie-player` web component (CDN, ~50KB)
- Canva GIFs: displayed as `<img>` elements, positioned absolutely, `pointer-events: none`
- Video backgrounds: `<video autoplay muted loop playsinline>` at very low opacity, lazy loaded
- Particles: CSS `@keyframes` with randomized custom properties (lightweight, no canvas)
- Respect `prefers-reduced-motion` — disable animations, hide video/GIF decorations
- Audio: Web Audio API with MP3 buffers, not `<audio>` elements (lower latency)
- Image optimization: all PNGs compressed via TinyPNG before committing
- New files/folders: `js/audio.js`, `sfx/`, `assets/lottie/`, `assets/svg/`, `assets/stickers/`, `assets/illustrations/`, `assets/video/`, `assets/patterns/`, `assets/generated/`

---

## Asset Folder Structure

```
assets/
  stickers/        <- Canva animated GIFs (10 files)
  illustrations/   <- Canva SVGs + PNGs (15 files)
  video/           <- Canva background videos (4 files, <2MB each)
  patterns/        <- Canva seamless texture tiles (6 files)
  generated/       <- ChatGPT DALL-E images (8 files)
  lottie/          <- LottieFiles JSON animations (10 files)
  svg/             <- SVGRepo/Phosphor decorative SVGs (8 files)
sfx/               <- Sound effects MP3s (9 files)
```

Total: ~60 asset files

---

## Critical Files to Modify

| # | File | Changes |
|---|------|---------|
| 1 | `css/styles.css` | `:root` variables — new palette, font stack, elevation tokens, `100vh` layout |
| 2 | `css/geo.css` | **Full rewrite** — theme, components, animations, patterns, particles, video bg styles, fixed viewport |
| 3 | `js/ui-effects.js` | Particles, score popup, card tilt, upgraded confetti/streak, Lottie helpers |
| 4 | `js/main.js` | Audio init, transitions, Lottie integration, map enhancements, video bg |
| 5 | `js/crack-the-code.js` | Ocean descent visuals + sound + particles |
| 6 | `js/pin-it.js` | Desert expedition visuals + sound + particles |
| 7 | `js/city-sorter.js` | Forest canopy visuals + sound + particles |
| 8 | `js/results.js` | Journal styling, celebrations, Lottie triggers, badge ceremony |
| 9 | `js/flow-ui.js` | Interstitial animations, stamp-press, GIF overlays |
| 10 | `index.html` | Font import, Lottie script, video element, fixed viewport meta, decorative assets |
| 11 | `game.html` | Font import, Lottie script, mute toggle, video elements, fixed viewport |

**New files:**
- `js/audio.js` — Web Audio sound manager
- `sfx/` — 9 MP3 files
- `assets/` subfolders — ~60 asset files total (see structure above)

---

## Verification

1. **NO SCROLL TEST** — On every screen, verify document doesn't scroll. Body overflow: hidden. All content fits 100vh exactly.
2. Open `index.html` — vibrant colors, Nunito headings, globe decoration, parchment video bg, fills viewport
3. Start a game — smooth color slide wipe transition + airplane decoration
4. Play Code Drop — ocean video bg visible, blocks glow cyan, bubbles float, ripple on correct + chime sound
5. Play Pin Rush — desert video bg, golden map hover, sand burst on correct + sound
6. Play City Stack — forest video bg, leaf particles, satisfying snap on correct + sound
7. Complete a level — Lottie confetti + flag plant + star burst + fanfare sound
8. Earn a badge — full ceremony: modal + spin + wax seal + ribbon + sound
9. Hub map — fog of war, animated route, landmarks, compass rose, pulsing pin
10. Results — journal texture, postcards, travel stickers, trophy if all passed, fits viewport
11. `prefers-reduced-motion` — all animations/video/GIF disabled gracefully
12. Mute toggle — persists across reload, no sound when muted
13. Performance — no jank, videos don't block interaction, particles clean up
14. Resolution test at 1280x720 — everything fits, no overflow
