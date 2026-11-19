# Contributing

These notes apply to people and coding agents alike.

## Setup

You need Bun and Node 24. `mise.toml` pins both versions.

```bash
bun install
bun run dev
```

`bun install` also sets up the Git hooks. They lint staged files, check commit messages, and run
`bun run verify` before every push.

## Checks

```bash
bun run verify
```

This runs type-check, lint, format check, unit tests, and a production build. Run it before you
push.

If you change anything in the UI, also run the browser tests. Install the browsers once:

```bash
bunx playwright install --with-deps chromium firefox webkit
bun run test:e2e:build
```

CI runs `verify` and the browser tests in Chromium, Firefox, and WebKit on every pull request.

## Making a change

- Work on a branch and open a pull request. Nobody pushes to `main`.
- Keep each pull request to one concern. Leave unrelated refactors and formatting out.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commits and the pull
  request title. `commitlint.config.ts` has the rules.
- Pull requests are squash merged, so the title becomes the commit on `main`.
- Never edit `CHANGELOG.md`. release-please cuts releases from commit messages.

## Product rules

Read [AGENTS.md § The Project](AGENTS.md#the-project) before you propose a feature. A change
that needs accounts, a backend, tracking, or streaks will be turned down.

## Adding a game

Copy the shape of an existing game such as Minesweeper. Each game has a pure logic engine
(`src/lib/<game>.ts`) with unit tests, a session validator, a SolidJS state module
(`src/lib/<game>Game.ts`), components in `src/components/`, and a page in `src/pages/`. Then
register it in `src/data/games.ts` and `src/lib/storageKeys.ts`.
