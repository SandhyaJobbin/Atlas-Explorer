# STACK.md — Technology Stack

**Date:** 2026-05-20

## Languages & Runtime

- **TypeScript 6.0** (`app/tsconfig.app.json`, target `es2023`, strict mode, `verbatimModuleSyntax`)
- **React 19.2** with JSX (`react-jsx`)
- **HTML5** (`app/index.html` — single entry point)
- **CSS** with TailwindCSS v4 utility classes

## Build & Dev Tooling

| Tool | Version | Config File | Purpose |
|------|---------|-------------|---------|
| Vite | ^8.0.10 | `app/vite.config.ts` | Dev server + production bundler |
| TypeScript | ~6.0.2 | `app/tsconfig.app.json`, `app/tsconfig.node.json` | Type checking |
| ESLint | ^10.2.1 | `app/eslint.config.js` | Linting (TS + React hooks plugins) |
| Vitest | ^4.1.5 | `app/vite.config.ts` `test` block | Unit testing |
| Playwright | ^1.59.1 | `app/scripts/screenshots.ts` | E2E screenshots (scripts only) |

## Framework / UI

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.5 | Core UI framework |
| react-dom | ^19.2.5 | DOM rendering |
| react-router-dom | ^7.14.2 | Client-side routing (HashRouter) |
| tailwindcss | ^4.2.4 | Utility-first CSS |
| @tailwindcss/vite | ^4.2.4 | TailwindCSS Vite plugin |
| lucide-react | ^1.16.0 | Icon library |

## Testing

| Tool | Version | Scope |
|------|---------|-------|
| Vitest | ^4.1.5 | Runner for all unit tests |
| jsdom | ^29.1.1 | DOM environment for tests |
| @testing-library/react | ^16.3.2 | React component tests (available, not yet used in tests) |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers |
| @testing-library/user-event | ^14.6.1 | User event simulation |

## Infrastructure

- **Hosting:** GitHub Pages (via `app/vite.config.ts` `base: '/Atlas-Explorer/'`)
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`) — builds on push to `main`, deploys to Pages
- **Backend:** Google Apps Script (`apps-script/Code.gs`) — unconfigured (URL is empty string)

## Config & Scripts

Root `package.json`:
- `dev`: `cd app && npx vite`
- `test`: runs 9 Node test scripts sequentially

App `package.json`:
- `dev`: vite dev server
- `build`: `tsc -b && vite build`
- `lint`: `eslint .`
- `test`: `vitest run`
- `preview`: `vite preview`

## Server Logs Present

Multiple Vite log files in `app/` root:
- `vite.err.log`, `vite.out.log` (main CI runs)
- `vite.e3.err.log`, `vite.e3.out.log` (phase builds)
- `vite.phase5.err.log`, `vite.phase5.out.log`
- `vite.smoke.err.log`, `vite.smoke.out.log`
- `vite.critique.err.log`, `vite.critique.out.log`
- `vite.d4.err.log`, `vite.d4.out.log`

Indicates iterative build/CI cycle with Vite during development.
