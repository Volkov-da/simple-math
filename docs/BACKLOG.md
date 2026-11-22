# Ideas & Backlog

Product direction and planned work for Math Practice. Target audience: the general public.

## Roadmap

| Phase | Status | Scope |
|---|---|---|
| 1. Bug fixes & foundation | Done (branch `phase-1-foundation`) | Deadline-based timer, Summary by URL id, typed storage layer, extracted + tested problem generator, ESLint/Vitest, uncapped history |
| ~~2. Installable / offline (PWA)~~ | Dropped | — |
| 3. Engagement | Next | Daily streaks, daily goals/logins, achievements |
| 4. Backend, accounts & sync | Planned | Python backend, Google sign-in, cloud sync, problem analytics |

## Decisions

- **Backend: Python with FastAPI, together with Supabase.**
  - Supabase provides Postgres and authentication (Google sign-in is supported via `signInWithOAuth({ provider: 'google' })`).
  - FastAPI handles custom logic: problem batches, attempt ingestion, analytics, streak/achievement rules. It verifies Supabase-issued JWTs instead of running its own auth.
  - FastAPI needs separate hosting (e.g. Render, Fly.io, Railway); GitHub Pages only serves the static frontend. Free tiers may sleep, which causes slow first requests.
  - Keep TypeScript types in sync with the API by generating them from FastAPI's OpenAPI schema.
- **The game loop stays in TypeScript in the browser.** No network calls during a timed session. The local generator (`src/lib/problems.ts`) remains the fallback when the backend is unreachable.
- **All persistence goes through `src/lib/storage.ts`**, so switching from localStorage to the API only changes that module.
- Accounts should be optional: the app works without logging in, and the first sign-in uploads local history.

## Idea: server-generated sessions with canonical problem IDs

*To implement in Phase 4 (Python backend).*

**Goal:** fetch the whole session's problems up front, give every problem a stable ID, and use the attempt data to find which problems and calculation types users struggle with most.

### Session batch
- On session start, one request fetches a batch of problems before the timer begins, so there is no latency during play.
- Size the batch to the session (about 2 × the length in seconds, since fast users can exceed 100 problems in 120 s), or fetch more when about 20 remain.
- If the request fails or is slow, fall back to the local generator using the same key scheme.
- Answers are shipped with the problems. That's acceptable for a practice app; the server re-checks answers on upload.

### Canonical problem IDs
- The ID must come from the problem's content, not be random, so the same problem always has the same ID across users and sessions. Examples: `mul:7x8`, `add:47+38`, `pct:15%of60`, or a hash of (operation, operands).
- Open question: are 7 × 8 and 8 × 7 the same problem? Store both an ordered key and a merged (commutative) key so the choice can be made during analysis.
- Don't pre-store every possible problem (4-digit × 4-digit alone is about 81M). Generate problems on the fly, compute their key, and create a stats row on first attempt.

### Attempt log
Record per attempt: problem key, user, answer typed, correct (yes/no), response time in ms, position in the session, timestamp, and why the problem was chosen (random or targeted). Upload all attempts in one request at session end; queue them while offline.
- Response time matters as much as correctness: a problem everyone solves slowly is still hard.
- Keep the wrong answer itself, because it shows the kind of mistake (47 + 38 = 75 is a forgotten carry; 7 × 8 = 54 is a recall error).

### Analytics
- Per-problem stats are meaningful only for small spaces such as the multiplication table (64 non-trivial problems). In large spaces most problems are seen too rarely.
- To answer "which types of calculation are hardest", tag every problem with features and aggregate by them: operation, digit counts, number of carries/borrows, crossing a ten/hundred, involving 6/7/8/9, result size.
- Adaptive selection biases the raw averages, because hard problems get shown more to weaker users. The "why chosen" field lets analysis correct for this.

### Suggested path
1. Before the backend exists: add canonical keys, feature tags and a per-attempt log to the client (`problems.ts` / `storage.ts`).
2. With the backend: upload attempts and aggregate stats in FastAPI and Supabase.
3. Later: move problem selection to the server to target each user's weak spots.

## Backlog

### Engagement (Phase 3)
- Daily streak: days in a row with at least one session, shown on the Start page. Uses the local calendar day; once synced, the server keeps the authoritative count.
- Daily goal (e.g. 3 sessions or 50 correct answers) with a progress ring (reuse `ProgressRing`).
- Daily login tracking.
- Achievements and badges (first 100 correct, 7-day streak, perfect session).

### Training
- Mistake review: practice the problems answered wrong, and show the slowest ones.
- Adaptive difficulty: adjust digit counts based on rolling accuracy and speed.
- Sprint mode (fixed number of problems) and endless mode (ends after 3 mistakes).
- More problem types: squares, decimals, fractions, multi-step expressions.

### General audience
- Short first-visit onboarding and gentler default difficulty.

### Tech debt
- Choose one styling approach: Tailwind or inline `style={{}}`, not both.
- `react-hooks/exhaustive-deps` warning in the `RangeSlider` in `src/routes/Settings.tsx`.
- The deploy workflow overwrites the custom `404.html` with `index.html`. It works, but one of the two SPA-fallback mechanisms is redundant.
