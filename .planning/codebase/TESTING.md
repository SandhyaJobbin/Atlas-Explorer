# TESTING.md — Testing Strategy

**Date:** 2026-05-20

## Test Runner

- **Vitest** v4.1.5 configured in `app/vite.config.ts`:
  - `globals: true` (no explicit imports needed)
  - `environment: 'jsdom'` (DOM API mocking)
  - `setupFiles: './src/test-setup.ts'`
  - Path alias `@/` resolved to `./src/`

## Test Files

All tests in `app/src/__tests__/`:

| File | Tests | Lines | What it covers |
|------|-------|-------|----------------|
| `session.test.ts` | 18 | 249 | Session CRUD, game attempts, training, persistence, migration |
| `scoring.test.ts` | 7 | 80 | Pass threshold, stars, points calculation |
| `badges.test.ts` | 11 | 108 | All 8 badge conditions, deduplication |
| `crack-the-code.test.ts` | — | — | CodeDrop question generation + answer checking |
| `pin-it.test.ts` | — | — | PinRush question generation |
| `city-sorter.test.ts` | — | — | CityStack question generation |
| `flow-ui.test.ts` | — | — | Flow UI helpers |
| `game-route.test.ts` | — | — | Game index param resolution |
| `leaderboard.test.ts` | — | — | Leaderboard score aggregation + fallback |

## Test Patterns

### Session Tests (`session.test.ts`)

- Uses factory pattern (`makeSession()`, `passAttempt()`, `failAttempt()`)
- Tests the full session lifecycle: create → attempt games → pass/fail → complete
- Persistence tests use mock `Storage` object (implements `Storage` interface)
- Tests legacy migration paths (missing `training`, `demo` flag, etc.)

### Badge Tests (`badges.test.ts`)

- Parametric test data via `passResult()` / `perfectResult()` factory functions
- Tests each badge individually
- Tests edge cases (second attempt = no first-blood, duplicate prevention)

### Scoring Tests (`scoring.test.ts`)

- Pure function tests — no setup needed
- Covers edge cases: zero totals, boundary percentages

## Testing Gaps

- **No component tests** — `@testing-library/react` is installed but no tests use it
- **No E2E tests** — Playwright scripts exist only for manual screenshot capture (`app/scripts/screenshots.ts`), not CI-based testing
- **No integration tests** — no tests that exercise the full routing + context stack
- **No visual regression tests**
- **Test environment:** jsdom (no real browser rendering)

## Test Commands

```bash
# Run all unit tests
cd app && npx vitest run

# Run with watch
cd app && npx vitest

# Run specific test file
cd app && npx vitest run src/__tests__/scoring.test.ts

# Root orchestrator (sequential Node scripts — older style)
cd app && npm test  # runs vitest directly
```
