# Microbreak

Short, non-addictive puzzle games for build wait times.

Microbreak is a static Astro app with SolidJS islands and Tailwind CSS v4. The
first shipped game is Sudoku, with support for 4×4, 6×6, and 9×9 boards.

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
- Client-side Sudoku flow with setup screen before play
- Hand-rolled Sudoku generator / solver / validator
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
│   ├── SudokuApp.tsx
│   ├── SudokuBoard.tsx
│   ├── SudokuSetup.tsx
│   └── ...
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── sudoku.ts
│   └── __tests__/
├── pages/
│   ├── index.astro
│   └── sudoku.astro
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
