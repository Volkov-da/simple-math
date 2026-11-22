# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A keyboard-driven mental arithmetic trainer (timed 30/60/120s sessions; addition, subtraction, multiplication, division, percent; 1–4 digit operands). It is a fully client-side React 18 + TypeScript + Vite SPA with no backend, deployed to GitHub Pages.

Roadmap, technical decisions (planned Python FastAPI + Supabase backend) and the feature backlog are in `docs/BACKLOG.md`. Check it before proposing new features or architecture.

## Commands

- `npm run dev`: Vite dev server. The app is served under `/simple-math/`, not `/`.
- `npm run build`: type-checks with `tsc -b` (strict settings from `tsconfig.app.json`), then runs `vite build` into `dist/`.
- `npm test`: runs the Vitest suite once. `npm run test:watch` re-runs on change.
- Single test file or test: `npx vitest run src/lib/problems.test.ts`, or add `-t "division"` to filter by test name.
- `npm run lint`: ESLint (flat config in `eslint.config.js`).
- `npm run preview`: serves the built `dist/`.

On this Windows machine Node is installed at `C:\Program Files\nodejs`. If `npm` isn't found in a shell, prepend that folder to `PATH`.

## Deployment / routing gotchas

- Every push to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`. It runs lint, tests and build, so any of them failing blocks the deploy.
- The base path `/simple-math` is hardcoded in two places, which must stay in sync: `base` in `vite.config.ts` and `basename` on `BrowserRouter` in `src/main.tsx`.
- SPA deep-link handling:
  - `404.html` redirects to `/?/path`, and an inline script in `index.html` decodes that back with `history.replaceState`. `vite.config.ts` builds `404.html` as a second Rollup input.
  - The CI workflow then overwrites `dist/404.html` with a copy of `dist/index.html`. In production, the custom `404.html` redirect script is therefore replaced.

## Architecture

- **Routes** (`src/App.tsx`): `/` Start, `/practice` Practice, `/summary/:sessionId` Summary, `/settings` Settings, `/statistics` Statistics. Route components are large page files; logic worth testing lives in `src/lib/`.
- **`src/lib/types.ts`**: shared types (`Skill`, `DigitSettings`, `PracticeSettings`, `Item`, `SessionSummary`). Don't redeclare these in pages.
- **`src/lib/storage.ts`** is the only module that touches localStorage for app data. Pages must go through it (`loadSettings`/`saveSettings`, `loadSessions`/`saveSession`/`getSession`). This keeps a future sync backend (planned: Supabase) pluggable.
  - Keys: `lengthSec`, `ops`, `digits`, `summaries` (history, newest first, deduped, capped at `MAX_SESSIONS`), and legacy `lastSummary` (read-only fallback for `getSession`). Sound settings (`soundMuted`, `soundVolume`) are still handled by `SoundManager`.
  - All reads validate and migrate. `migrateDigits()` accepts the v1 (number per skill), v2 (`{first: n, second: n}`) and current (`{first: {min,max}, second: {min,max}}`) formats. Change the shape there, with a test.
- **`src/lib/problems.ts`**: pure problem generation. `generateItem(ops, digits, random)` picks an enabled skill; `generateProblem(skill, digits, random)` builds one. The `random` function is injectable so tests use a seeded PRNG. `isTrivial*` helpers reject trivial pairs (×1, +0, a÷a), and every answer is a non-negative integer (division builds the dividend as divisor × quotient; percent only uses percentages that divide evenly).
- **Practice timer**: time left is computed from a deadline timestamp (`deadlineRef`), not by counting ticks. Pausing shifts the deadline and the current problem's start time forward, so paused time counts neither against the clock nor toward average speed. Live stats are mirrored in `statsRef` so `endSession()` (also called from the interval) always sees current values. Answers are submitted through a `<form>`; empty submissions are ignored.
- **Sessions**: `endSession()` saves a `SessionSummary` (real enabled skills and digit settings, `endReason`, totals, and `perSkill` attempted/correct/time) and navigates to `/summary/:id`. Summary loads that session by its URL id.
- **Sound**: `src/utils/sounds.ts` exports a singleton `soundManager` that synthesizes tones with the Web Audio API (there are no audio files). The AudioContext is created lazily on the first `play()`, because browsers block contexts created before user interaction. `src/contexts/SoundContext.tsx` wraps it for React through `useSound()`.
- **Styling**: Tailwind CSS v4 through `@tailwindcss/postcss`. Theme tokens (`primary`, `success`, `warning`, etc.) are defined in an `@theme` block in `src/index.css`. Many components also use inline `style={{}}` objects. Animations use framer-motion, with shared variants in `src/utils/animations.ts`. Icons come from lucide-react.
