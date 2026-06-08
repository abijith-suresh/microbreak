# CONTRIBUTING

## Prerequisites

- **Node.js 22.x** (required by `engines`)
- **Bun** (version in `.bun-version`)

Install dependencies:

```bash
bun install
```

## Development

Start the dev server:

```bash
bun run dev
```

Available scripts:

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `bun run dev`          | Start Astro dev server           |
| `bun run build`        | Production build to `dist/`      |
| `bun run preview`      | Preview production build locally |
| `bun run type-check`   | Run `astro check` (TypeScript)   |
| `bun run lint`         | Run ESLint                       |
| `bun run lint:fix`     | Auto-fix lint issues             |
| `bun run format`       | Run Prettier (write)             |
| `bun run format:check` | Check formatting                 |
| `bun run test`         | Run Vitest once                  |
| `bun run test:watch`   | Run Vitest in watch mode         |
| `bun run verify`       | Run full quality gate            |

## Quality Gate

Before pushing, run:

```bash
bun run verify
```

This executes type-checking, linting, format check, unit tests, and a
production build. The same command runs in CI on every PR.

Git hooks are managed by Husky:

- **pre-commit**: lint-staged runs ESLint + Prettier on staged files
- **commit-msg**: validates Conventional Commits format
- **pre-push**: runs the full verify script

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
type(optional-scope): subject
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`, `build`

Rules:

- Subject must be ≤ 72 characters
- Subject must not end with a period

Releases are automated via release-please based on commit messages. Before v1.0.0:

- `feat` commits bump the minor version
- `fix` commits bump the patch version

## Adding a New Game

Each game follows a consistent architecture. To add a new game:

1. **Engine** — Create `src/lib/<game>.ts` with pure logic (generation,
   validation, move handling, win/loss). No framework code.
2. **Tests** — Add `src/lib/__tests__/<game>.test.ts` with Vitest unit tests
   covering the engine.
3. **Session validator** — Create `src/lib/<game>Session.ts` with a type
   predicate for localStorage validation.
4. **Composable** — Create `src/lib/<game>Game.ts` using SolidJS signals and
   createEffect for reactive state + persistence. Follow the pattern of
   existing composables (`sudokuGame.ts`, `minesweeperGame.ts`, etc.).
5. **App component** — Create `src/components/<Game>App.tsx` composing Setup,
   Board/UI, and ResultScreen components.
6. **Sub-components** — Create setup, board, cell/tile, and any game-specific
   components in `src/components/`.
7. **Storage keys** — Add session/preference keys to
   `src/lib/storageKeys.ts`.
8. **Page** — Create `src/pages/<game>.astro` with meta tags and `client:load`.
9. **Catalog** — Add game entry to `src/data/games.ts`.
10. **Home preview** — Add preview component in
    `src/components/previews/` and configure in `src/data/previewGrids.ts`.

## Code Style

- TypeScript strict mode
- No unused variables (underscore prefix allowed)
- Prefer `const` over `let`
- Console statements restricted to `warn` and `error`
- Tailwind classes for styling; avoid inline styles
- SolidJS: use `Show`/`For` for conditional/iterative rendering
- No comments unless necessary for clarity

## Testing

Tests use Vitest. Engine logic must be tested. UI components are not currently
tested.

```bash
bun run test
```

Test files live in `src/lib/__tests__/` alongside the code they test.
