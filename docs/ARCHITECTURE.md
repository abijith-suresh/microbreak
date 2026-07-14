# ARCHITECTURE — Technical Truth

## Stack

| Layer      | Technology                                 |
| ---------- | ------------------------------------------ |
| Framework  | Astro 6 (static output)                    |
| UI islands | SolidJS                                    |
| Styling    | Tailwind CSS v4 (Vite plugin, not PostCSS) |
| Language   | TypeScript (strict mode)                   |
| Runtime    | Bun (package manager, scripts)             |
| Testing    | Vitest                                     |
| Linting    | ESLint + Prettier                          |
| Git hooks  | Husky + lint-staged + commitlint           |
| CI         | GitHub Actions                             |
| Deployment | Vercel (static)                            |

## Output

`output: "static"` in `astro.config.mjs`. The entire site is pre-rendered HTML
with SolidJS islands hydrated on the client. There is no server-side runtime.

## Directory Structure

```
src/
├── components/         SolidJS components (*.tsx) and Astro components (*.astro)
│   ├── Game2048App.tsx        2048 game shell
│   ├── Game2048Board.tsx     2048 grid
│   ├── Game2048Tile.tsx      2048 tile (slide animation)
│   ├── Game2048WinOverlay.tsx 2048 win celebration
│   ├── GameGrid.tsx           Home page game card grid
│   ├── GameScreen.tsx         Shared game screen layout shell
│   ├── MinesweeperApp.tsx     Minesweeper game shell
│   ├── MinesweeperBoard.tsx   Minesweeper grid
│   ├── MinesweeperCell.tsx    Minesweeper cell
│   ├── MinesweeperSetup.tsx   Minesweeper difficulty picker
│   ├── NumberPad.tsx          Sudoku digit input
│   ├── PageFooter.astro       Site footer component
│   ├── PageHeader.astro       Site header + theme toggle
│   ├── SudokuApp.tsx          Sudoku game shell
│   ├── SudokuBoard.tsx        Sudoku grid
│   ├── SudokuCell.tsx         Sudoku cell
│   ├── SudokuSetup.tsx        Sudoku size/difficulty picker
│   ├── ThemeToggle.tsx        Light/dark toggle (SolidJS island)
│   ├── WordleApp.tsx          Wordle game shell
│   ├── WordleBoard.tsx        Wordle row grid
│   ├── WordleKeyboard.tsx     Wordle on-screen keyboard
│   ├── WordleRow.tsx          Wordle guess row
│   ├── WordleSetup.tsx        Wordle variant picker
│   ├── WordleTile.tsx         Wordle letter tile (flip animation)
│   ├── previews/              Home page mini game previews
│   └── ui/                    Shared UI primitives
│       ├── BackLink.tsx       Back navigation link
│       ├── Button.tsx         Button component (shadcn/ui pattern)
│       └── ResultScreen.tsx   Unified win/loss result screen
├── data/               Static data and types
│   ├── games.ts               Game catalog definitions
│   ├── previewGrids.ts        Home page preview configurations
│   ├── wordleSolutionPools.ts Curated answer pools for 4/6-letter variants
│   └── words-{4,5,6}.json     Word lists (solutions + valid guesses)
├── layouts/
│   └── BaseLayout.astro       Root HTML shell (fonts, meta, theme init, SEO)
├── lib/                Pure logic and game engines
│   ├── __tests__/             Vitest test files
│   ├── elapsedTimer.ts        Timer composable for SolidJS
│   ├── game2048.ts            2048 engine (grid, merge, move, win/loss)
│   ├── game2048Game.ts        2048 SolidJS composable (state, persistence)
│   ├── game2048Session.ts     2048 session type validator
│   ├── icons.tsx              Local SolidJS icon wrappers
│   ├── minesweeper.ts         Minesweeper engine (board gen, reveal, flag, win/loss)
│   ├── minesweeperGame.ts     Minesweeper SolidJS composable
│   ├── minesweeperSession.ts  Minesweeper session type validator
│   ├── storage.ts             Type-safe localStorage abstraction
│   ├── storageKeys.ts         Centralized storage key constants
│   ├── sudoku.ts              Sudoku engine (generate, solve, validate, MRV search)
│   ├── sudoku.worker.ts       Web Worker for puzzle generation
│   ├── sudokuGame.ts          Sudoku SolidJS composable
│   ├── sudokuGenerator.ts     Worker dispatcher with sync fallback
│   ├── sudokuSession.ts       Sudoku session type validator
│   ├── wordle.ts              Wordle engine (guess compute, validation, answer pick)
│   ├── wordleGame.ts          Wordle SolidJS composable
│   ├── wordlePersistence.ts   Recent answer tracker (avoids repeats)
│   ├── wordleSession.ts       Wordle session type validator
│   └── wordleWordList.ts      Word list builder (curated pools + guess lists)
├── pages/              Astro page routes (file-based routing)
│   ├── index.astro            Home page
│   ├── about.astro            About/philosophy page
│   ├── 404.astro              Custom 404 page
│   ├── sudoku.astro           Sudoku page
│   ├── wordle.astro           Wordle page
│   ├── minesweeper.astro      Minesweeper page
│   └── 2048.astro             2048 page
└── styles/
    └── global.css             Fonts, Tailwind, design tokens, animations, light/dark themes

public/
├── favicon.svg
├── og-image.svg
└── fonts/                     Self-hosted WOFF2 fonts
```

## Game Architecture Pattern

Every game follows the same layered architecture:

```
Page (.astro) → App (shell) → Setup / Board / Result (UI)
                    ↑
              Composable (signals + actions + persistence)
                    ↑
              Engine (pure logic, no framework)
```

1. **Pure engine** (`lib/<game>.ts`) — Framework-agnostic TypeScript. Board
   generation, validation, move logic, win/loss detection. No side effects.
   Unit tested with Vitest.

2. **SolidJS composable** (`lib/<game>Game.ts`) — Reactive state management.
   Signals for game phase, board state, timer, configuration. Actions wrapping
   engine functions. Persistence layer with `createEffect` to auto-save to
   localStorage. Keyboard handlers on mount. Visibility API for timer
   pause/resume.

3. **Session validator** (`lib/<game>Session.ts`) — Type predicate for
   validating deserialized localStorage data. Ensures only valid sessions are
   restored.

4. **App component** (`components/<Game>App.tsx`) — Layout shell composing
   Setup, Board/UI, and ResultScreen. Uses `GameScreen` for the shared layout
   structure.

5. **Astro page** (`pages/<game>.astro`) — Minimal wrapper setting page meta
   and loading the App component with `client:load`.

## State and Persistence

All state is client-side only. LocalStorage keys are centralized in
`storageKeys.ts` and versioned (e.g., `sudokuSession:v1`).

Persistence follows the same pattern across all games:

- A `createEffect` watches reactive game state and serializes to localStorage
- On mount, the composable attempts to restore from localStorage using the
  session validator
- Invalid or corrupted sessions are silently discarded

## Styling

Tailwind CSS v4 with the Vite plugin (not PostCSS). Theming is done via CSS
custom properties:

- `@theme` block defines static tokens (fonts, keyframe names)
- `@theme inline` block defines CSS variable aliases (color tokens)
- `:root` / `[data-theme="light"]` defines the warm paper-like palette
- `[data-theme="dark"]` defines the deep charcoal palette
- Theme init script in `BaseLayout` reads localStorage or system preference
  before first paint to prevent flash
- `tw-animate-css` provides animation utilities

## Quality Gate

`bun run verify` runs sequentially:

1. `astro check` — TypeScript type-checking
2. `biome lint .` — Linting
3. `biome format .` — Format validation
4. `vitest run` — Unit tests
5. `astro build` — Production build

Git hooks enforce this:

- `pre-commit`: lint-staged (ESLint + Prettier on staged files)
- `commit-msg`: commitlint (Conventional Commits)
- `pre-push`: full verify

## CI/CD

- PRs to `main` run the full quality gate
- PR titles are validated for Conventional Commits format
- Merges to `main` trigger release-please which creates release PRs with
  changelog entries and version bumps
