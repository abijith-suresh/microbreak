<!-- Entries below this line were manually maintained prior to automated release management -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.8] - 2026-04-26

### Added

- Fully playable 2048 game with slide, merge, and spawn tile animations.
- Classic win behaviour: reaching 2048 shows a celebration overlay with a "Keep Playing" option.
- Current score and best score (persisted to localStorage) in the game header.
- Touch swipe support for mobile play.
- Mini 2048 grid preview animation on the landing page.
- CSS keyframes for tile appear, merge pop, and score float animations.
- Tile colour tokens for both light and dark themes.

### Changed

- Activated 2048 card on the landing page (previously "Coming Soon").

## [0.0.7] - 2026-04-26

### Added

- Minesweeper: centre-out board entrance animation and pre-result animations (win ripple and loss blast).
- CSS keyframe for mine blast and updated landing preview animation cadence to match Sudoku.

### Changed

- Minesweeper game flow: delayed result reveal to allow pre-result animations (completing/completionOrigin signals and triggerCompletion API).
- Mini Minesweeper preview: unified speed and scale with Sudoku (batchSize=3, interval=120ms, scale 0.3→1, opacity 0→0.9).

## [0.0.6] - 2026-04-26

### Added

- Minesweeper: complete game with setup screen, board UI, dig/flag toggle, and result screen.
- Pure Minesweeper engine (board generation, reveal, flood-fill, win/loss detection) with unit tests.
- SolidJS game state composable following the sudokuGame.ts architecture.

## [0.0.5] - 2026-04-24

### Added

- Sudoku: animation polish — staggered board entrance, skeleton loading, setup exit transition, and press feedback.
- Conflict detection with per-cell error highlighting and group-completion sweep animation.
- Sudoku game state extracted into a SolidJS composable (sudokuGame.ts) for clean separation of logic and UI.
- Runtime theme token aliases and polished global theme CSS for light/dark mode consistency.

### Fixed

- Completion sweep animation restart prevention via correct For cell rendering.
- Press feedback using pointer events for iOS Safari compatibility.
- Reactive phase transitions using Show instead of conditional rendering.

## [0.0.4] - 2026-04-24

### Added

- Sudoku engine refactor using MRV search with reference-backed regression tests.
- Public open-source project metadata, MIT licensing, and Bun-based Vercel deployment configuration.
- Stronger repo validation with Astro check.

### Fixed

- Sudoku loading state transitions so a started game reliably reaches a fully rendered board.

## [0.0.3] - 2026-04-24

### Added

- Sudoku setup screen with grid size and difficulty selection.
- Error highlighting and value matching on the board.
- Comprehensive Sudoku engine tests with Vitest.

### Fixed

- Theme toggle simplified to 2-state light/dark with system default.

## [0.0.2] - 2026-04-24

### Added

- First complete Microbreak implementation with a playable Sudoku experience and supporting design system.
- Bun-first quality scripts and OSS project metadata.

## [0.0.1] - 2026-04-24

### Added

- Initial Astro project scaffold.
- CI, PR title checks, Dependabot, Husky hooks, linting, formatting, and changelog.
- Vercel deployment configuration.

[unreleased]: https://github.com/abijith-suresh/microbreak/compare/v0.0.8...HEAD
[0.0.8]: https://github.com/abijith-suresh/microbreak/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/abijith-suresh/microbreak/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/abijith-suresh/microbreak/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/abijith-suresh/microbreak/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/abijith-suresh/microbreak/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/abijith-suresh/microbreak/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/abijith-suresh/microbreak/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/abijith-suresh/microbreak/releases/tag/v0.0.1
