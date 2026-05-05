# Asset Replacements

Reference document tracking Lottie-to-GIF replacements and overall asset usage across the app.

## Lottie Removal

5 files to delete after replacement.

| Lottie File | What it actually renders | Replaced By | Used In |
|---|---|---|---|
| `assets/lottie/globe.json` | Spinning cyan circle with orange stroke | `assets/stickers/compass-spin.gif` (418 KB) | `LandingPage.tsx:339` - right panel hero |
| `assets/lottie/level-up.json` | Pulsing/fading shape | `assets/stickers/star-sparkle.gif` (254 KB) | `LandingPage.tsx:195` - active session card bg |
| `assets/lottie/trophy.json` | Rocking yellow rectangle | `assets/stickers/trophy.gif` (1.4 MB) | `ResultsPage.tsx:186` - header when all passed |
| `assets/lottie/confetti.json` | Expanding gold ring | CSS confetti animation | Planned for `PassInterstitial.tsx` (not yet wired) |
| `assets/lottie/flag-plant.json` | Simple shape animation | `assets/stickers/checkmark.gif` (82 KB) | Planned for level complete (not yet wired) |

## Component Changes

| Component | Current | After |
|---|---|---|
| `LottiePlayer.tsx` | Uses `@lottiefiles/dotlottie-react` to render .json | Thin `<img>` wrapper mapping lottie paths to GIF paths |

## Dependency Removal

- Remove `@lottiefiles/dotlottie-react` from `app/package.json`
- After replacement, delete `app/public/assets/lottie/` directory entirely

## Assets NOT Changing

These are already working well.

- All 10 GIF stickers in `assets/stickers/` - used as-is
- All 4 background videos in `assets/video/` - used as `<video>` elements
- All 15 illustrations in `assets/illustrations/` - used as `<img>` / CSS backgrounds
- All 6 patterns in `assets/patterns/` - used as CSS background tiles
- All 14 generated images in `assets/generated/` - used as `<img>` / backgrounds
- All 9 SFX in `sfx/` - used via Web Audio API (`useAudio` hook)
- Kenney sounds in `assets/audio/` - available for UI feedback
