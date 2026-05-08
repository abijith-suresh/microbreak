# Microbreak

Short, non-addictive puzzle games for build wait times.

Microbreak is a static Astro app with SolidJS islands and Tailwind CSS v4. The
current catalog includes Sudoku, Wordle, Minesweeper, and 2048, with more
small-session puzzle games planned behind the same shell.

## Stack

- Astro 6
- SolidJS
- Tailwind CSS v4
- TypeScript (strict)
- Bun
- Vitest
- ESLint + Prettier + Husky

## Features

- Static output (`output: "static"`)
- Four shipped puzzle games: Sudoku, Wordle, Minesweeper, and 2048
- Game-specific setup, persistence, and result flows built with SolidJS islands
- Curated home/catalog metadata for category, status, and expected session length
- Theme toggle that starts from system preference and then becomes manual
- Local font hosting
- Bun-first scripts and workflow

## Commands

```bash
bun install
bun run dev
bun run type-check
bun run lint
bun run format:check
bun run test
bun run build
bun run verify
```

## Project Structure

```text
src/
├── components/
│   ├── GameGrid.tsx
│   ├── Game2048App.tsx
│   ├── MinesweeperApp.tsx
│   ├── SudokuApp.tsx
│   ├── WordleApp.tsx
│   └── ...
├── data/
│   ├── games.ts
│   └── wordleSolutionPools.ts
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── game2048.ts
│   ├── minesweeper.ts
│   ├── sudoku.ts
│   ├── wordle.ts
│   └── __tests__/
├── pages/
│   ├── 2048.astro
│   ├── index.astro
│   ├── minesweeper.astro
│   ├── sudoku.astro
│   └── wordle.astro
└── styles/
    └── global.css
```

## Quality Gate

Before pushing changes:

```bash
bun run verify
```

This runs:

- Astro type-checking
- ESLint
- Prettier check
- Vitest
- Production build

## Git Hooks

Local hooks are managed with Husky:

- `pre-commit`: runs `lint-staged`
- `commit-msg`: validates Conventional Commits with `commitlint`
- `pre-push`: runs `bun run verify`

## License

MIT
