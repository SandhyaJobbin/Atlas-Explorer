# Phase 7: Offline Resilience (C4) - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver offline resilience for Atlas Explorer: a visible offline indicator when connectivity drops, and a local score queue that drains to the leaderboard on reconnect. No Service Worker, no PWA cache, no IndexedDB migration.

Requirements: OFFLINE-01, OFFLINE-02 (from REQUIREMENTS.md)

</domain>

<decisions>
## Implementation Decisions

### Offline Detection
- **D-01:** Use `navigator.onLine` + `window.online`/`window.offline` events for the offline indicator. No heartbeat ping, no hybrid detection.
- **D-02:** Existing `submitAttemptScore()` `catch → saveLocalScore()` pattern remains as-is — it independently covers the server-unreachable-while-browser-says-online case for queue enqueue. The indicator and queue enqueue are decoupled.

### Offline Indicator Design
- **D-03:** Persistent top banner, full-width, positioned above main content. Yellow/amber background (`bg-amber-50` or similar atlas-compatible token).
- **D-04:** Lucide `WifiOff` icon + text: "You're offline — scores will sync when reconnected"
- **D-05:** Appears immediately on `window.offline` event, disappears on `window.online` event. Always visible while offline. Not dismissible.

### Queue Storage
- **D-06:** Separate localStorage key `atlas-explorer-sync-queue` for unsent scores. Independent from existing `atlas-explorer-local-leaderboard` key.
- **D-07:** Queue items stored as `{payload, queuedAt: ISO string, id: unique string}`.

### Drain Trigger
- **D-08:** Drain attempts fire only on `window.online` event. No drain on mount, no drain on focus.

### Deduplication
- **D-09:** Per-item sequential POST. After each successful response, remove that item from queue. If connection drops mid-stream, only unsubmitted items remain.

### APPS_SCRIPT_URL Gate
- **D-10:** Drain function is a no-op when `isConfigured()` returns false (APPS_SCRIPT_URL empty). Queue still accumulates scores locally — drain only activates once URL is configured. This avoids silent data loss where scores POST to nowhere.

### Game Start Message
- **D-11:** When offline, show gentle message on game start screen: "Connectivity required for leaderboard — scores will sync later". Do NOT block gameplay. Player can proceed and scores queue locally.

### Scope Boundaries
- **In scope:** Offline indicator, score queue, drain on reconnect, game-start offline message
- **Explicitly out of scope:** Service Worker, PWA shell cache, IndexedDB migration, map tile caching, cross-session FSRS, app shell offline rendering
- **Not building:** Cache-first strategy, cached map rendering offline, audio asset caching

</decisions>

<canonical_refs>
## Canonical References

### Leaderboard & Score Submission
- `app/src/lib/leaderboard.ts` — Current score submission with Apps Script + localStorage fallback. `submitAttemptScore()`, `saveLocalScore()`, `readLocalScores()`, `isConfigured()`
- `app/src/lib/session.ts` — Session state machine, GAME_DEFINITIONS

### Data Persistence Patterns
- `app/src/hooks/useData.tsx` — DataProvider context (sessionStorage caching, 1-hour TTL)
- localStorage keys: `atlas-explorer-local-leaderboard`, `atlas-explorer-session`

### Deployment & Routing
- `app/vite.config.ts` — GitHub Pages base path `/Atlas-Explorer/`
- Deployment: static GitHub Pages — all offline logic must be client-side

### External Integration
- `apps-script/Code.gs` — Google Apps Script backend (unconfigured, URL is empty string)

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `leaderboard.ts:submitAttemptScore()` — Already has `catch → saveLocalScore()` pattern. Queue hook wraps this with local-first write + queue append.
- `leaderboard.ts:saveLocalScore()` / `readLocalScores()` — localStorage CRUD pattern to replicate for sync-queue key.
- `leaderboard.ts:isConfigured()` — Reuse for drain gate.

### Established Patterns
- localStorage for persistence (session, leaderboard, audio prefs) — queue follows same pattern
- Pure lib functions in `src/lib/` — drain logic lives here as a pure async function
- Context providers in `src/hooks/` — offline state could live in a new `useOnlineStatus` hook or be added to existing context
- TailwindCSS v4 utility classes — indicator banner uses atlas-* theme tokens

### Integration Points
- `App.tsx` — Top-level provider composition. Offline indicator renders here or in a shared layout wrapper.
- `GameShellPage.tsx` — Game start screen where offline message appears.
- Leaderboard fetch components (`WaveLeaderboardWidget.tsx`, etc.) — benefit from sync after drain.

</code_context>

<specifics>
## Specific Ideas

- Offline indicator at top of viewport, pushed down by session banner if visible, otherwise flush with viewport top
- Queue hook API: `enqueueScore(payload)` → localStorage append. `drainQueue()` → sequential POST + remove on success. `getQueueLength()` → badge count for potential future UI
- `useOnlineStatus()` hook: returns `{isOnline, isOffline}` from navigator.onLine + event listeners. Single listener registered in App.tsx, context-provided for child consumption

</specifics>

<deferred>
## Deferred Ideas

- Service Worker / PWA shell cache — out of scope per milestone decision
- IndexedDB migration — not needed for simple score queue
- Map tile / asset caching for full offline play — would require Service Worker, deferred

None — discussion stayed within phase scope

</deferred>

---

*Phase: 7-Offline Resilience (C4)*
*Context gathered: 2026-05-21*
