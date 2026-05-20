# Requirements: Atlas Explorer

**Defined:** 2026-05-20
**Core Value:** The map must render fully and be usable — exploration and every game depend on seeing and interacting with the complete North America map without cropping or obscured controls.

## v1 Requirements

This milestone: ~20 UI/UX bug fixes across 7 screens + 6 V3 plan-completion features.
Each maps to exactly one roadmap phase.

### Landing Page

- [ ] **LAND-01**: The "Begin your Expedition" call-to-action is fully visible at 100% browser zoom — no layout overflow that forces zoom-out
- [ ] **LAND-02**: The landing page background behind the headline text is filled with intentional content, not left blank

### Map Rendering (MAP)

- [ ] **MAP-01**: Map waypoint/pointer markers all render within the visible map bounds — no markers placed off-map (e.g. far south)
- [ ] **MAP-02**: On the Discover North America start screen, the full map including Canada is visible — no cropping
- [ ] **MAP-03**: On the Discover North America game/exploration screen, the full map is visible — no half-cropping that hides regions or info
- [ ] **MAP-04**: On the Pin It game screen, the map renders fully with the same correct viewport as other screens

### Map Interaction (INTERACT)

- [ ] **INTERACT-01**: The Atlas Passport button is fully visible and clickable — not obscured beneath the Pace Monitor
- [ ] **INTERACT-02**: The zoom in/out controls are fully visible and clickable — not obscured beneath the Expedition Status panel
- [ ] **INTERACT-03**: Clicking a state/province produces a stable selection — its border no longer pops in and immediately reverts
- [ ] **INTERACT-04**: Hovering over small states no longer triggers random repeated popups
- [ ] **INTERACT-05**: The region popup is calmer and less intrusive — reduced frequency/intensity
- [ ] **INTERACT-06**: The per-second flicker effect is removed from the map explorer screen
- [ ] **INTERACT-07**: The per-second flicker effect is removed from the Pin It game
- [ ] **INTERACT-08**: The button currently hidden behind the Wave Standings widget is visible and clickable

### Gameplay Fixes (GAMEPLAY)

- [ ] **GAMEPLAY-01**: Completing all explorable regions advances the player to the results page (fix the states.json / SVG / TOTAL_REGIONS count mismatch)
- [ ] **GAMEPLAY-02**: In Crack the Code, the map reference legend stays within the map bounds
- [ ] **GAMEPLAY-03**: In Crack the Code, timezone questions are single-select — only one answer can be chosen and accepted

### Navigation (NAV)

- [ ] **NAV-01**: On the Resume Expedition screen, the Train button opens map training
- [ ] **NAV-02**: On the Resume Expedition screen, the Play button opens the games

### Results (RESULTS)

- [ ] **RESULTS-01**: A unified expedition results page aggregates outcomes across all four games (Discover North America, Crack the Code, Pin It, Tz Sorter)
- [ ] **RESULTS-02**: The post-results action hub ("What's Next?") is visible above the fold and offers retry / compare / review / journal actions

### Learning Features (LEARN)

- [ ] **LEARN-01**: A spaced-repetition review round resurfaces the player's past mistakes, ordered most-missed first, with a Leitner-style re-loop for partially-recalled items
- [ ] **LEARN-02**: Dynamic difficulty weights region selection by per-region accuracy and adapts ordering on retry attempts

### Architecture (ARCH)

- [ ] **ARCH-01**: All components consume states data from a single shared DataProvider — no independent per-component fetches of states.json
- [ ] **ARCH-02**: Game state is unified via a GameEvents emitter feeding a single GameState context, replacing fragmented per-game local refs for reporting

### Offline Resilience (OFFLINE)

- [ ] **OFFLINE-01**: An offline indicator is shown in the UI when the network connection drops
- [ ] **OFFLINE-02**: Game results/scores are queued locally when offline and synced to the leaderboard on reconnect

## v2 Requirements

None — all requested work is committed to this milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend rework / Google Apps Script reconfiguration | Leaderboard backend stays as-is; offline resilience is client-only |
| New games beyond the existing four | Milestone is polish + completion, not expansion |
| Native mobile app | Remains a web SPA |
| Atlas editorial theme redesign | Visual identity is settled; only layout bugs are fixed |
| Cross-session spaced repetition (FSRS day-scale scheduling) | Single-sitting classroom use only needs a within-session Leitner loop |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAND-01 | Phase 8 | Pending |
| LAND-02 | Phase 8 | Pending |
| MAP-01 | Phase 1 | Pending |
| MAP-02 | Phase 1 | Pending |
| MAP-03 | Phase 1 | Pending |
| MAP-04 | Phase 1 | Pending |
| INTERACT-01 | Phase 2 | Pending |
| INTERACT-02 | Phase 2 | Pending |
| INTERACT-03 | Phase 2 | Pending |
| INTERACT-04 | Phase 2 | Pending |
| INTERACT-05 | Phase 2 | Pending |
| INTERACT-06 | Phase 2 | Pending |
| INTERACT-07 | Phase 2 | Pending |
| INTERACT-08 | Phase 2 | Pending |
| GAMEPLAY-01 | Phase 1 | Pending |
| GAMEPLAY-02 | Phase 8 | Pending |
| GAMEPLAY-03 | Phase 8 | Pending |
| NAV-01 | Phase 8 | Pending |
| NAV-02 | Phase 8 | Pending |
| RESULTS-01 | Phase 8 | Pending |
| RESULTS-02 | Phase 8 | Pending |
| LEARN-01 | Phase 5 | Pending |
| LEARN-02 | Phase 6 | Pending |
| ARCH-01 | Phase 3 | Pending |
| ARCH-02 | Phase 4 | Pending |
| OFFLINE-01 | Phase 7 | Pending |
| OFFLINE-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27 (complete)
- Unmapped: 0

---
*Requirements defined: 2026-05-20*
*Last updated: 2026-05-20 after roadmap creation — all 27 requirements mapped*
