# CONVENTIONS.md — Code Style & Patterns

**Date:** 2026-05-20

## Code Style

- **Language:** TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`)
- **Imports:** Type-only imports use `import type { ... }`
- **JSX:** React 19 JSX transform (no `import React from 'react'` needed)
- **CSS:** TailwindCSS v4 utility classes (no CSS modules, no styled-components)
- **Animations defined inline:** Using `<style>` tags inside components (e.g., `InteractiveMap.tsx`, `CodeDrop.tsx`)
- **Format:** No Prettier config detected; ESLint handles code quality

## Patterns

### Context Provider Pattern

Every provider follows this shape:
```tsx
// hooks/useX.tsx
const XContext = createContext<XValue | null>(null);
export function XProvider({ children }) { ... }
export function useX() {
  const ctx = useContext(XContext);
  if (!ctx) throw new Error('useX must be used within XProvider');
  return ctx;
}
```

### Pure Logic Separation

Business logic lives in `lib/` as pure functions, never in components. Components call lib functions, and lib modules have zero React imports. This makes them easily testable.

Example: `session.ts` exports `createSession()`, `recordGameAttempt()`, etc. — all operate on plain `Session` objects.

### State Management

- **React Context** (not Redux/Zustand) for global state (session, data, audio)
- **`useReducer`** for complex local state (GameShellPage state machine)
- **`useRef`** + mutable refs for performance-critical values (game counters, animation state)
- **`structuredClone`** for immutable state updates (session mutation)

### Game Components

All games implement the `GameProps` interface:
```ts
interface GameProps {
  onComplete: (result: GameResult) => void;
  onStreakChange?: (streak: number) => void;
  isRetry: boolean;
}
```

### Error Handling

- Guard clauses at context usage (throw if used outside provider)
- `try/catch` with fallback to localStorage for network operations
- `console.error` / `console.warn` in catch blocks (no error tracking integration)
- Test files use `as any` type casts for property deletion in migration tests
- ESLint disables `no-explicit-any` in test files

### ESLint Configuration

Key rules (most React hooks strict rules OFF):
```js
'react-hooks/error-boundaries': 'off',
'react-hooks/immutability': 'off',
'react-hooks/preserve-manual-memoization': 'off',
'react-hooks/purity': 'off',
'react-hooks/refs': 'off',
'react-hooks/set-state-in-effect': 'off',
'react-refresh/only-export-components': 'off',
```

This indicates intentional relaxation of React hooks best-practice linting.

### useEffect Dependency Exemptions

Several `useEffect` hooks suppress exhaustive-deps warnings with `// eslint-disable-line`. Typically because they intentionally ignore certain deps (e.g., firing "once" on mount, or using refs for values that shouldn't trigger re-runs).

Found in: `CodeDrop.tsx`, `PinRush.tsx`, `CityStack.tsx`, `ResultsPage.tsx`, `PassInterstitial.tsx`, `FailInterstitial.tsx`, `TrainingCompletePage.tsx`, `MapExplorerPage.tsx`, `TrainerDashboard.tsx`.
