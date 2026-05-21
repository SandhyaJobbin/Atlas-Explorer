---
gsd_artifact: quick-plan
quick_id: 260521-im3
slug: fix-tz-sorter-timezone-sort-game-blank-s
date: 2026-05-21
---

# Quick Task: Fix tz-sorter (Timezone Sort) blank screen

## Description

The Timezone Sort game (`CityStack.tsx`) renders a blank screen. The component
calls `useParticles()` and renders `<AnimatedCard>`, but neither symbol is
imported. At runtime this throws `ReferenceError: useParticles is not defined`,
crashing the React tree before any UI paints.

## Root Cause

A pre-existing uncommitted refactor of `CityStack.tsx` (useData/useSession
migration, gameEvents, StreakMeter, mistake tracking) reorganized the import
block and dropped the `useParticles` and `AnimatedCard` import lines while
leaving their usages in place.

## Task

1. Re-add the two missing imports to `app/src/features/games/CityStack.tsx`,
   matching the paths used by sibling games (`PinRush.tsx`):
   - `import { useParticles } from '@/components/ui/ParticleSystem';`
   - `import { AnimatedCard } from '@/components/ui/AnimatedCard';`

## Verification

- `npx tsc -b --noEmit` passes with no errors.
- Timezone Sort game renders instead of a blank screen.

## Notes

`CityStack.tsx` carries a larger uncommitted refactor that cannot be cleanly
separated from this fix. Per user decision, the whole file is committed under
this quick task.
