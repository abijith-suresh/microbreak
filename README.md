# Microbreak

Short, non-addictive puzzles for the gaps between builds.

Microbreak is a collection of quick, brain-stimulating games designed for the
in-between moments of software development — waiting for builds, test suites,
deployments, or package installs. Each game loads instantly, plays for a few
minutes, and ends cleanly. No accounts, no tracking, no engagement traps.

## Games

| Game                        | Category | Session |
| --------------------------- | -------- | ------- |
| [Sudoku](/sudoku)           | Logic    | 3–8 min |
| [Wordle](/wordle)           | Word     | 1–5 min |
| [Minesweeper](/minesweeper) | Logic    | 1–5 min |
| [2048](/2048)               | Arcade   | 2–6 min |

## Philosophy

- **No accounts.** Everything runs in your browser. Progress is local-only.
- **No tracking.** No analytics, no cookies, no data collection.
- **No dark patterns.** No streaks, notifications, leaderboards, or engagement
  traps.
- **Respects your time.** Games are short by design. Close the tab and you're
  done.

[About Microbreak →](/about)

## Architecture

| Layer       | Technology                                 |
| ----------- | ------------------------------------------ |
| Framework   | Astro (static output)                      |
| UI islands  | SolidJS                                    |
| Styling     | Tailwind CSS v4 (Vite plugin, not PostCSS) |
| Language    | TypeScript (strict mode)                   |
| Runtime     | Bun (package manager, scripts)             |
| Testing     | Vitest, Playwright (browser smoke tests)   |
| Linting     | Biome (lint + format)                      |
| CI / Deploy | GitHub Actions, Vercel (static)            |

`output: "static"` — the site is pre-rendered HTML with SolidJS islands
hydrated on the client. There is no server-side runtime.

Every game follows the same layered pattern:

```
Page (.astro) → App (shell) → Setup / Board / Result (UI)
                    ↑
              Composable (signals + actions + persistence)
                    ↑
              Engine (pure logic, no framework)
```

- **Engine** (`src/lib/<game>.ts`) — framework-agnostic board generation,
  validation, move logic, win/loss detection. Unit tested with Vitest.
- **Composable** (`src/lib/<game>Game.ts`) — SolidJS signals and actions with
  `createEffect` persistence to localStorage.
- **Session validator** (`src/lib/<game>Session.ts`) — type predicate guarding
  restored localStorage data; invalid sessions are discarded.
- **Page** (`src/pages/<game>.astro`) — minimal wrapper setting page meta and
  loading the App component with `client:load`.

All state is client-side. Storage keys are centralized in
`src/lib/storageKeys.ts` and versioned (e.g. `sudokuSession:v1`). Theming uses
Tailwind v4 CSS custom properties with light/dark palettes; a theme-init script
in `BaseLayout` prevents a flash before first paint.

`bun run verify` runs the full quality gate: type-check, lint, format check,
unit tests, and production build. Browser tests are separate. See
[CONTRIBUTING.md](/CONTRIBUTING.md) for setup, scripts, and the new-game
walkthrough, and `AGENTS.md` for agent orientation.

## License

MIT
