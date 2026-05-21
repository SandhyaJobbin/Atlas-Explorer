# INTEGRATIONS.md — External Integrations & APIs

**Date:** 2026-05-20

## Backend / Data Persistence

### Google Apps Script (Unconfigured)

- **File:** `apps-script/Code.gs`
- **Handler:** `app/src/lib/leaderboard.ts`
- **Status:** NOT configured — `APPS_SCRIPT_URL` in `leaderboard.ts:4` is empty string `''`
- **Behavior when unconfigured:**
  - `submitAttemptScore()` falls back to `localStorage` (key `atlas-explorer-local-leaderboard`)
  - `fetchLeaderboard()` returns local scores
  - `awardBadge()` is no-op
  - `fetchBadges()` returns empty array
- **Configuration check:** `isConfigured()` at `leaderboard.ts:92` checks if URL starts with `https://`
- **Endpoints used when configured:**
  - `POST` with `{ action: 'submit', agent, waveCode, trainerName, game, attempt, scorePct, stars, passed }`
  - `POST` with `{ action: 'awardBadge', agent, badgeId, badgeName }`
  - `GET` with `action=fetchBadges&agent=X`
  - `GET` with `action=fetchLeaderboard&agent=X&waveCode=Y` (optional)

### localStorage (Client-side)

- **Session:** Key `atlas-explorer-session` stores full `Session` object
- **Leaderboard fallback:** Key `atlas-explorer-local-leaderboard` stores score submissions
- **States cache:** `sessionStorage` key `atlas_states_cache` (1-hour TTL)
- **Audio preferences:** `atlas_audio_muted` (boolean), `atlas_audio_volume` (0-1 float)

## Data Sources

### Static JSON

- `states.json` (US states + Canadian provinces data) — fetched via `fetch()` in `useData.tsx`, cached in `sessionStorage`
- `cities.json` — used by PinRush and other games
- `batches.json` — used by trainer dashboard
- **SVG Map:** `north-america.svg` — fetched once, cached in module-level `svgCache` variable

### Audio Assets

- MP3 files in `app/public/sfx/` — 11 sound files for game feedback
- Web Audio API fallback (oscillator tones) when MP3 unavailable

## External Hosting

- **GitHub Pages** via `actions/deploy-pages@v4`
- **CDN:** No external CDN — all assets served from `app/public/`
- **Fonts:** No external font loading detected (uses `font-display` class naming suggests local/custom fonts)

## No External APIs Used

- No REST APIs beyond the (unconfigured) Apps Script
- No third-party SDKs (maps, analytics, auth)
- No databases
- No webhooks

## CI/CD

- **GitHub Actions** at `.github/workflows/deploy.yml`
- Trigger: push to `main` or manual dispatch
- Steps: checkout → Node 20 → `npm ci` → `npm run build` → configure Pages → upload `app/dist` → deploy
