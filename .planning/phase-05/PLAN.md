# Phase 5 Plan: Review Round Ordering and Leitner Loop (C2)

## Goal

Review round surfaces worst-performing regions first and loops until every mistake resolved.

## Success Criteria

1. Review presents regions ordered most-missed-first — region wrong twice appears before region wrong once
2. After correctly answering all reviewed regions once, bucket-0 regions (not yet resolved) presented again rather than ending review
3. Review never falsely reports "no mistakes" when mistakes exist — DC codes handled defensively

## Current State

- `ReviewRound.tsx`: Linear walkthrough of `new Set(session.games.flatMap(g => g.mistakes || []))` — reads **last attempt's mistakes only**, no sort, no loop
- `GameAttempt.mistakes` stores per-attempt mistakes (all attempts preserved)
- `GameState.mistakes` overwritten each attempt (last attempt only)
- `ReviewRound` has no mistake-count aggregation, no bucket logic, no looping

## Design

### 1. Mistake Count Aggregation

Aggregate across **all attempts** (not just last attempt):

```
session.games.flatMap(g => g.attempts.flatMap(a => a.mistakes || []))
```

Count per code → sort descending → unique list by most-missed-first.

Helper function: `getAggregatedMistakes(session: Session): { code: string; count: number }[]`

### 2. Two-Bucket Leitner Loop

- **Bucket-1** (resolved): regions answered correctly this review round
- **Bucket-0** (unresolved): regions not yet answered correctly

State machine per review round:
```
remaining = [...allRegionsSorted]
corrected = Set<string>  // codes answered correctly
currentIndex = 0

on answer:
  if correct → add to corrected Set
  move to next

on end of list:
  unresolved = allRegionsSorted.filter(c => !corrected.has(c))
  if unresolved.length > 0 → set remaining = unresolved, reset
  else → complete review
```

### 3. Edge Cases

- **DC codes**: If a mistake code doesn't match any known state code, filter it out silently (defensive). Helper signature: `getAggregatedMistakes(session, states)` — scoring.ts gets states param for filtering.
- **All resolved on first pass**: Loop ends immediately, proceed to results
- **No mistakes at all**: Keep existing "No mistakes" UI path (handled upstream in GameShellPage)
- **Loop cap**: Max 3 full loops. After 3rd pass, force-complete review regardless of unresolved items. Prevents infinite loop if player can't identify a region.
- **Skip button**: Add "Skip" button per region that marks it resolved (moves to bucket-1) without requiring correct answer. Player exits on their terms.

## Files to Modify

### `ReviewRound.tsx` — Primary change

- Import `getAggregatedMistakes` helper (or implement inline)
- Replace `mistakeCodes` computation with aggregated, sorted list
- Add Leitner bucket state (`correctedCodes: Set<string>`)
- Modify `handleNext` / `handleRegionClick` to track correct answers
- After exhausting list, check for unresolved → restart loop or complete

### `lib/scoring.ts` — Add helper

- Add `getAggregatedMistakes(session)` that returns sorted `{ code, count }[]`
- Filters unknown codes defensively
- Consumed by both ReviewRound and ResultsPage (optional migration)

### `lib/session.ts` — Minor

- Export `getAggregatedMistakes` if added there instead of scoring.ts

### `ResultsPage.tsx` — Migrate to aggregated counts

- Line 265: Replace `g.mistakes` with `g.attempts.flatMap(a => a.mistakes || [])`
- Line 266: Same for allCorrects (keep consistent)
- Keeps weak spots telemetry in sync with review ordering

### `GameShellPage.tsx` — No change needed

- Review dispatch logic stays same
- `onComplete` already navigates to results

## Implementation Notes

- The "most-missed" sort uses aggregated *frequency across all attempts*, not just distinct codes. A region wrong in 2 different attempts ranks higher than one wrong in 1 attempt.
- Within same count, fallback: alphabetical by state name (deterministic)
- Leitner state is ephemeral (per ReviewRound mount) — no persistence needed across page navigations
- `ReviewRound` already has `useMemo` for mistake lists — extend for sorted version

## Task Breakdown

1. Add `getAggregatedMistakes(session, states)` to `scoring.ts` — returns sorted `{ code, count, state }[]`, filters unknown codes
2. Migrate `ResultsPage.tsx` lines 265-271 to use aggregated mistakes from all attempts
3. Rewrite `ReviewRound.tsx`:
   a. Replace `mistakeCodes` with sorted aggregated list from helper
   b. Add correctedCodes Set and handleRegionClick tracking
   c. Add Leitner loop logic in handleNext (max 3 loops)
   d. Add skip button per region
   e. Update progress display to reflect loop cycle
4. Verify against all 3 success criteria

## Verification

1. Create demo session with controlled mistakes (2x wrong region A, 1x wrong region B) → region A appears first
2. Answer all correctly → review round completes, no extra loop
3. Answer some wrong on first pass → those regions reappear in second pass
4. Session with no mistakes → results directly (existing behavior preserved)
