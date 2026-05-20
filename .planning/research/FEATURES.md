# Feature Research

**Domain:** Geography education SPA — polish-and-completion milestone (brownfield)
**Researched:** 2026-05-20
**Confidence:** HIGH (existing code read directly; research corroborates patterns)
**Scope:** C2 Spaced Repetition, C3 Post-Results Action Hub, C4 Offline Resilience,
           C5 Dynamic Difficulty, unified cross-game expedition results page

---

## Current State Baseline (read from codebase)

Before classifying new features, this is what already exists so nothing is double-counted:

| Feature | Status | Location |
|---------|--------|----------|
| ReviewRound — map-click active recall of mistake regions | SHIPPED | `features/games/ReviewRound.tsx` |
| Post-results "What's Next?" card grid (4 tiles) | SHIPPED | `features/results/ResultsPage.tsx` lines 621–741 |
| Compare-to-wave-average inline toggle | SHIPPED | `ResultsPage.tsx` `showAverageCompare` state |
| Browse Saved Journal tile | SHIPPED | `ResultsPage.tsx` (disabled when empty) |
| Replay Lowest Game tile | SHIPPED | `ResultsPage.tsx` (navigates to `/play?game=<key>`) |
| Review Weak Spots tile (scroll anchor) | SHIPPED | `ResultsPage.tsx` → `#review-snapshot` |
| Accuracy heatmap on results page | SHIPPED | `ResultsPage.tsx` |
| `mistakes[]` / `corrects[]` per `GameState` | SHIPPED | `types/index.ts`, `session.ts` |
| `reviewCompleted` flag on `Session` | SHIPPED | `types/index.ts` |
| Leaderboard polling with 10 s interval | SHIPPED | `ResultsPage.tsx` |
| `saveSession` / `loadSession` via localStorage | SHIPPED | `lib/session.ts` |

**Implication for this milestone:** C3 (post-results hub) is largely done. The four
"What's Next?" tiles exist. The gaps are behavioural polish, not new screens.
C2 (review round) has the map-click recall shell. The gaps are the *scheduling* layer
(which items to resurface, and in what order). C4 and C5 have zero implementation.

---

## Feature Landscape

### Table Stakes (Users/Teachers Expect These)

Features whose absence will make the milestone feel incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **C2-a: Mistake-driven review ordering** — surface regions from `mistakes[]` in order of most-missed first | The ReviewRound already fires; learners expect "worst first" not arbitrary order | LOW | Already collected: `mistakeCounts` map built in `ResultsPage.tsx`; pass sorted array to `ReviewRound` |
| **C2-b: Review-round skip when no mistakes** | User gets a confusing dead end if ReviewRound launches with no mistakes | LOW | Already handled in `ReviewRound.tsx` lines 63–78; verify `GameShellPage` also guards |
| **C3-a: "What's Next?" tiles are always visible** | Teachers need post-session guidance even when all games passed | LOW | Already exists; risk is the section renders below the fold on short displays — CSS `position: sticky` bottom strip or anchor link at top of page |
| **C4-a: In-flight progress not lost on wifi drop** | Classroom wifi is notoriously unreliable; learner loses 20 min of work = rage | MEDIUM | localStorage saves happen per-attempt (already in `saveSession` calls); the gap is the leaderboard POST failing silently |
| **C4-b: Offline indicator shown when network lost** | Silent failure looks like a bug to learners and teachers | LOW | `useOnlineStatus` hook (20 lines) + banner component; `navigator.onLine` + `online`/`offline` events |
| **C4-c: Leaderboard submit retried when connectivity restores** | Without retry the score never reaches the trainer dashboard | MEDIUM | Pending-submit queue in localStorage; retry on `online` event; one entry per session ID |
| **C5-a: Questions weighted by historical accuracy** | Learners frustrated repeating states they've already mastered | MEDIUM | Per-region hit/miss counts already stored in `mistakes[]`/`corrects[]`; use these to bias question generation |
| **Unified results page aggregating all four games** | PROJECT.md requirement; current results page already does this via `session.games[]` loop and `ExpeditionReport` — verify it renders correctly once the fourth game slot exists | LOW | `GAME_DEFINITIONS` drives the loop; adding game 4 (review) score to `getSubmissionPayload` game4 field is the only change needed |

### Differentiators (Competitive Advantage for a Classroom Geography Game)

Features that meaningfully improve learning outcomes or teacher utility beyond Kahoot/Quizlet parity.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **C2-c: Leitner-style bucket progression in ReviewRound** — correct recall promotes a region to "mastered", wrong recall keeps it for another pass until all regions in the queue are resolved | Learners see visible progress through their mistakes; motivationally superior to a flat list | MEDIUM | Requires `reviewQueue: { code: string; bucket: 0\|1 }[]` added to `Session`; ReviewRound loops until bucket 1 for all items; single session only (no cross-session persistence needed) |
| **C5-b: Per-region difficulty rating visible on map** — regions with >50% class-wide miss rate shown with a subtle indicator in MapExplorer | Teachers can see live which regions the whole wave is struggling with | HIGH | Requires aggregating leaderboard mistake data server-side; out of scope for static GitHub Pages; defer |
| **C4-d: Static-asset service worker cache** — app shell (JS, CSS, fonts) cached so the app loads even with no network | Classroom projector offline scenario: teacher can still demo | HIGH | Requires Vite PWA plugin (`vite-plugin-pwa`); adds Workbox config; non-trivial to wire correctly with HashRouter and GitHub Pages base path; Medium complexity but adds risk |
| **C3-b: Personalised "focus tip" computed from session data** — e.g. "You missed 4 Eastern timezone states — focus on that zone next time" | Actionable insight, not just a score | MEDIUM | Pure client computation from `mistakeCounts` grouped by `StateEntry.timezone`; no backend needed; renders inside the existing "What's Next?" card |

### Anti-Features (Over-Engineering to Avoid)

| Feature | Why Requested | Why Problematic | Better Approach |
|---------|---------------|-----------------|-----------------|
| **Full SM-2 / FSRS spaced repetition with inter-session scheduling** (next-review due date, ease factor, interval doubling) | SM-2 is the academic gold standard; sounds rigorous | Atlas Explorer sessions are single-sitting (30–60 min classroom blocks); SM-2's value is scheduling *days* apart; within one session a simple "most-missed first" queue is identical in effect and trivially simpler | Use mistake-frequency ordering (C2-a) + Leitner-2-bucket within-session loop (C2-c); skip SM-2 entirely |
| **IndexedDB for offline storage** | IndexedDB handles large structured data, offline-first apps use it | The existing session schema is small (`<50 KB`), already in localStorage, and the codebase has zero IndexedDB usage; migration risk far exceeds benefit | Keep localStorage; add a pending-submit queue entry (one key, one JSON object) |
| **Background Sync API service worker** | The "real" PWA offline sync pattern | Background Sync requires a service worker, which conflicts with the Vite + HashRouter + GitHub Pages base-path setup in non-trivial ways; limited browser support on school-managed Chromebooks | Simpler: retry the leaderboard POST on `window.addEventListener('online', ...)` in the existing leaderboard module; no service worker needed |
| **Per-learner difficulty profile persisted across sessions** | Adaptive systems maintain learner models long-term | This app has no authentication; `localStorage` is cleared between incognito sessions common in school labs; a "profile" with no identity is noise | Adapt within-session only (C5-a); discard after session clears |
| **Generative AI question variation** | AI can produce novel geography questions | This is a one-wave classroom tool; question corpus (63 regions × 3 game types) is already well-defined; AI adds latency, API cost, and unpredictable content | Use the existing question generators with difficulty-weighted selection |
| **Real-time class-average difficulty update per region** | Duolingo-style collective learning curve | Requires server-side aggregation; Google Apps Script leaderboard is pull-only; would require a new write endpoint, CORS changes, and race-condition handling | Static per-session heatmap on results page (already shipped) is sufficient for classroom use |
| **Tooltip / onboarding tour for "What's Next?" hub** | First-time users may not know what to do | The hub already has descriptive subtitles on every tile; an overlay tour adds code weight for a page learners see once per session | Keep the existing descriptive copy; improve it if user testing shows confusion |

---

## Concrete Algorithm Descriptions

### C2 — Spaced Repetition (within-session)

**Recommended approach: Mistake-frequency queue + 2-bucket Leitner pass**

The full SM-2 algorithm is overkill for a single sitting. The effective equivalent:

```
1. Build mistake queue after all games complete:
   mistakeQueue = session.games
     .flatMap(g => g.mistakes ?? [])
     .reduce((acc, code) => { acc[code] = (acc[code]||0)+1; return acc; }, {})
   
   sorted = Object.entries(mistakeQueue)
     .sort(([,a],[,b]) => b - a)   // most-missed first
     .map(([code]) => ({ code, bucket: 0 }))

2. ReviewRound iterates the queue showing map-click recall (already built).
   - Correct answer  → promote to bucket 1 (mastered this pass)
   - Wrong answer    → stays in bucket 0 (will loop back)

3. Loop until bucket 0 is empty. Then completeReviewRound().

4. Session field: reviewQueue: Array<{ code: string; bucket: 0|1 }>
   Persisted to localStorage so a page refresh mid-review resumes correctly.
```

**What this gives:** Learners see their worst mistakes first. Partially-mastered items
re-appear. The visual "queue draining" is motivating. No external library needed.
ReviewRound.tsx already has the map-click mechanic; the only new logic is the queue
management and the bucket loop.

**What C2 does NOT need:** ease factors, inter-session intervals, half-life regression,
or any external spaced-repetition library.

### C5 — Dynamic Difficulty (within-session question selection)

**Recommended approach: Accuracy-weighted question pool sampling**

Each game's question generator currently picks regions uniformly at random or by
fixed ordering. To adapt:

```
// In each game's question generator:
function weightedRegionPool(states: StateEntry[], session: Session): StateEntry[] {
  const mistakeCounts = buildMistakeCounts(session);  // from existing mistakes[]
  
  return states.flatMap(state => {
    const misses = mistakeCounts[state.code] ?? 0;
    const weight = misses > 2 ? 3    // heavily missed → 3× representation
                : misses > 0 ? 2    // some misses → 2× representation
                :              1;   // clean → 1× representation
    return Array(weight).fill(state);
  });
}
// Then shuffle and slice to question count
```

**Difficulty rating per region** — store in session (not a separate data file):
```
// On each game question answered:
session.regionDifficulty[code] = {
  attempts: prev.attempts + 1,
  misses:   prev.misses + (wasWrong ? 1 : 0),
}
// Derived difficulty: misses / attempts
```

**What C5 does NOT need:** IRT (Item Response Theory), reinforcement learning,
generative AI, or a separate difficulty data file. The existing `mistakes[]` array
on each `GameState` is sufficient signal for within-session weighting.

**Sequencing dependency:** C5 requires C2 data (mistakes accumulated across all games)
to be most effective. If C5 runs from game 1 onward, it has no history yet. The
practical approach: C5 kicks in only on retry attempts (when `isRetry === true`),
not on first play. On retry the current game's `mistakes[]` from the failed attempt
feed the weighted pool.

---

## Feature Dependencies

```
C2-a (mistake-frequency ordering)
    └──requires──> existing mistakes[] on GameState        [already present]
    └──requires──> ReviewRound to accept sorted queue      [needs small refactor]

C2-c (Leitner bucket loop)
    └──requires──> C2-a (sorted queue as input)
    └──requires──> reviewQueue[] field on Session type     [new field]
    └──requires──> ReviewRound to loop until bucket 0 empty [refactor loop logic]

C3-a (What's Next? always visible)
    └──requires──> existing ResultsPage section            [already present]
    └──enhances──> nothing; pure CSS/layout fix

C3-b (personalised focus tip)
    └──requires──> C2-a (mistakeCounts by region)
    └──requires──> StateEntry.timezone grouping            [already in types]

C4-a (progress not lost)
    └──requires──> saveSession already called per-attempt  [verify call sites]

C4-b (offline indicator)
    └──standalone──> new useOnlineStatus hook + banner component

C4-c (leaderboard retry on reconnect)
    └──requires──> C4-b (online/offline events already wired for the hook)
    └──requires──> pending-submit localStorage key         [new: one key]
    └──requires──> retry logic in lib/leaderboard.ts       [new: ~30 lines]

C5-a (accuracy-weighted question pool)
    └──requires──> existing mistakes[] on GameState        [already present]
    └──best used when──> isRetry === true                  [already a prop]
    └──does NOT require──> C2 to be implemented first

Unified results page
    └──requires──> ExpeditionReport (already shipped)
    └──requires──> game4 score wired in getSubmissionPayload [session.ts ~1 line]
    └──requires──> ResultsPage loop correctly handles 4 games [verify GAME_DEFINITIONS length]
```

### Dependency Notes

- **C2-c requires C2-a:** The Leitner bucket loop is an enhancement of the sorted queue; build the sort first, add the bucket loop on top.
- **C4-c requires C4-b's event listeners:** The retry-on-reconnect logic reuses the same `online` event the offline indicator subscribes to; wire them in the same hook.
- **C5-a and C2 are independent:** C5 weighs question pools using per-game `mistakes[]` from the *current* failed attempt; C2 operates post-game on cross-game aggregated mistakes. They share data but do not depend on each other's code.
- **Unified results page does not require new code:** The existing `session.games` loop in `ResultsPage` already renders all games; the only gap is `game4: 0` in `getSubmissionPayload` — wire the review round's correct count when review is scored.

---

## MVP Definition for This Milestone

This is a polish-and-completion pass, not a new product. "MVP" here means the minimum
that makes each V3 item shippable and valuable, without over-engineering.

### Ship With (this milestone)

- [ ] **C2-a** — Sort ReviewRound queue by mistake frequency (most-missed first). Complexity: LOW. 1 helper function + pass sorted array as prop.
- [ ] **C2-b** — Verify ReviewRound skip guard exists in both ReviewRound.tsx and GameShellPage.tsx (already mostly there; confirm edge case).
- [ ] **C2-c** — Leitner 2-bucket loop in ReviewRound (loop until bucket 0 empty). Complexity: MEDIUM. New `reviewQueue` field on Session type + update ReviewRound loop logic.
- [ ] **C3-a** — Ensure "What's Next?" section is reachable without scrolling (sticky CTA strip or anchor at top). Complexity: LOW. CSS only.
- [ ] **C3-b** — Timezone-grouped focus tip in "What's Next?" ("You missed N Eastern states"). Complexity: LOW. Pure computation, renders inside existing hub.
- [ ] **C4-b** — `useOnlineStatus` hook + top-bar offline banner. Complexity: LOW. ~30 lines.
- [ ] **C4-c** — Pending leaderboard submit queue in localStorage; retry on `online` event. Complexity: MEDIUM. ~60 lines in `lib/leaderboard.ts` + hook wiring.
- [ ] **C5-a** — Accuracy-weighted question pool on retry attempts. Complexity: MEDIUM. New helper in each game's question generator; triggered only when `isRetry === true`.
- [ ] **Unified results** — Verify `ResultsPage` renders cleanly with review round included; wire `game4` score in `getSubmissionPayload`. Complexity: LOW.

### Explicitly Defer (not this milestone)

- [ ] **C4-d** (service worker / PWA shell cache) — Adds Workbox, conflicts with HashRouter base-path; not worth the risk for a polish pass.
- [ ] **C5-b** (class-wide difficulty heatmap) — Requires server aggregation; out of scope.
- [ ] **Full SM-2** — Wrong abstraction level for a single-sitting classroom game.
- [ ] **IndexedDB migration** — No benefit over localStorage for this data size.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| C4-b: Offline indicator | HIGH (prevents confusion during wifi drops) | LOW | P1 |
| C4-c: Leaderboard retry queue | HIGH (scores must reach trainer dashboard) | MEDIUM | P1 |
| C2-a: Mistake-frequency ordering | HIGH (learners see worst-first = better recall) | LOW | P1 |
| C2-c: Leitner bucket loop | MEDIUM (motivating but not blocking) | MEDIUM | P2 |
| C5-a: Accuracy-weighted retry | MEDIUM (better retry experience) | MEDIUM | P2 |
| C3-a: What's Next? visibility | MEDIUM (polish; already exists, just below fold) | LOW | P1 |
| C3-b: Timezone focus tip | LOW-MEDIUM (nice personalisation) | LOW | P2 |
| Unified results wiring | HIGH (stated requirement) | LOW | P1 |
| C4-a: Verify save-on-attempt | HIGH (correctness check) | LOW | P1 |

---

## Competitor Feature Analysis

| Feature | Kahoot | Quizlet Learn | Our Approach |
|---------|--------|---------------|--------------|
| Spaced repetition | None | SM-2/FSRS (cross-session) | Within-session mistake-frequency queue + 2-bucket Leitner — appropriate for classroom single-sittings |
| Dynamic difficulty | None | Adaptive card selection | Accuracy-weighted question pool on retry (simpler; sufficient for 3-game linear sequence) |
| Offline resilience | No offline play | Cached cards work offline | `navigator.onLine` banner + localStorage retry queue for leaderboard POST (no service worker needed) |
| Post-results hub | Basic scoreboard | Streak/progress graphs | 4-tile action grid (already built); add timezone focus tip for personalisation |
| Unified results | Per-game only | Deck-level summary | Cross-game `ExpeditionReport` already built; wire review round score into submission payload |

---

## Sources

- Codebase read directly (2026-05-20): `session.ts`, `types/index.ts`, `ReviewRound.tsx`, `ResultsPage.tsx`, `GameShellPage.tsx`, `ExpeditionReport.tsx`
- SM-2 algorithm: [SM-2 explained — DEV Community](https://dev.to/umangsinha12/how-spaced-repetition-actually-works-the-sm-2-algorithm-1ge3); [Anki/RemNote SM-2 docs](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm)
- Dynamic difficulty review: [MDPI — Dynamic Difficulty Adjustment in Serious Games](https://www.mdpi.com/2078-2489/17/1/96); [IntechOpen — DDA Concepts and Techniques](https://www.intechopen.com/online-first/1228576)
- Offline detection React pattern: [useOnlineStatus hook patterns — DEV Community](https://dev.to/dzungnt98/detecting-online-offline-status-in-react-443e); [useSyncExternalStore approach — Medium](https://medium.com/@Brahmbhatnilay/using-the-usesyncexternalstore-hook-in-react-to-get-online-status-with-window-navigator-online-47fbf304db97)
- Offline-first localStorage queue: [Offline-first without a backend — DEV Community](https://dev.to/crisiscoresystems/offline-first-without-a-backend-a-local-first-pwa-architecture-you-can-trust-3j15); [Offline storage for PWAs — LogRocket](https://blog.logrocket.com/offline-storage-for-pwas/)
- Duolingo spaced repetition: [Duolingo blog — spaced repetition](https://blog.duolingo.com/spaced-repetition-for-learning/); [Settles 2016 HLR paper](https://research.duolingo.com/papers/settles.acl16.pdf)
- Quizlet adaptive mode: [Kahoot vs Quizlet comparison — LearnClash](https://learnclash.com/blog/kahoot-vs-quizlet)

---

*Feature research for: Atlas Explorer — geography education SPA, polish-and-completion milestone*
*Researched: 2026-05-20*
