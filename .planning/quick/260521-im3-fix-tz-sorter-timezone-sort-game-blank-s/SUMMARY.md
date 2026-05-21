---
gsd_artifact: quick-summary
quick_id: 260521-im3
slug: fix-tz-sorter-timezone-sort-game-blank-s
date: 2026-05-21
status: complete
commit: 7198353
---

# Summary: Fix tz-sorter (Timezone Sort) blank screen

## Outcome

Fixed. The Timezone Sort game now renders instead of crashing to a blank screen.

## What changed

- `app/src/features/games/CityStack.tsx` — re-added two missing imports:
  - `import { useParticles } from '@/components/ui/ParticleSystem';`
  - `import { AnimatedCard } from '@/components/ui/AnimatedCard';`

## Root cause

The component used `useParticles()` and `<AnimatedCard>` but a pre-existing
uncommitted refactor had dropped both import lines, causing a runtime
`ReferenceError` that crashed the React tree before render.

## Verification

- `npx tsc -b --noEmit` — passes, no errors.

## Notes

- Commit `7198353` bundles a larger pre-existing uncommitted refactor of
  `CityStack.tsx` (useData/useSession migration, gameEvents, StreakMeter,
  mistake tracking) that could not be cleanly separated from the fix. This was
  an explicit user decision.
- Other modified/untracked files in the working tree were left untouched.
