---
phase: 07
slug: offline-resilience-c4
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-21
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `app/vite.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose --related`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | OFFLINE-01 | — | Offline indicator visible within 1s on disconnect | unit | `npx vitest run src/hooks/useOnlineStatus.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | OFFLINE-02 | — | Score enqueued to localStorage when offline, drained on reconnect | unit | `npx vitest run src/lib/sync-queue.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | OFFLINE-02 | — | Drain no-op when APPS_SCRIPT_URL empty | unit | `npx vitest run src/lib/sync-queue.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | OFFLINE-02 | — | Per-item sequential POST, remove on success, retain on failure | unit | `npx vitest run src/lib/sync-queue.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/src/hooks/useOnlineStatus.test.ts` — unit tests for online/offline hook
- [ ] `app/src/lib/sync-queue.test.ts` — unit tests for enqueue/drain/dedup logic
- [ ] `app/src/components/OfflineIndicator.test.tsx` — component render tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Offline indicator appears on real disconnect | OFFLINE-01 | Requires browser DevTools network throttling | Open DevTools → Network tab → switch to Offline. Confirm amber banner with WifiOff icon appears within 1s |
| Scores survive tab close while offline | OFFLINE-02 | Requires localStorage + tab lifecycle | Go offline, complete a game, close tab, reopen app, go online. Confirm score appears on leaderboard |
| Full reconnect flow end-to-end | OFFLINE-02 | Requires network state transition and Apps Script POST | Go offline, play game, go online. Confirm sync queue drains and leaderboard updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
