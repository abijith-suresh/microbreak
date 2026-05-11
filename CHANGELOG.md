<!-- Entries below this line were manually maintained prior to automated release management -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.12](https://github.com/abijith-suresh/microbreak/compare/v0.0.11...v0.0.12) (2026-05-11)


### Features

* create GameLayout component to eliminate duplicated layout shell ([#92](https://github.com/abijith-suresh/microbreak/issues/92)) ([87e22f1](https://github.com/abijith-suresh/microbreak/commit/87e22f1a9f54c42302b827edfd55b1a56068e6bf))
* extract shared PressableButton component for game page buttons ([#90](https://github.com/abijith-suresh/microbreak/issues/90)) ([e4300b1](https://github.com/abijith-suresh/microbreak/commit/e4300b1a37b3fbf8b2a90ccc05811f19cc52aa51))
* **ui:** extract shared BackLink component for game navigation ([#89](https://github.com/abijith-suresh/microbreak/issues/89)) ([ada3a36](https://github.com/abijith-suresh/microbreak/commit/ada3a369b1ebc6fbd0026f5b9f08889211f0c002))
* unify result screens into single ResultScreen ([#91](https://github.com/abijith-suresh/microbreak/issues/91)) ([aca4bac](https://github.com/abijith-suresh/microbreak/commit/aca4bac55a4b22677d3aff81a98c5df9bb0511c8))


### Bug Fixes

* **2048:** add back-to-games button on the start screen ([#68](https://github.com/abijith-suresh/microbreak/issues/68)) ([b030f4b](https://github.com/abijith-suresh/microbreak/commit/b030f4ba7fb9d2d8c8529d633be1d251b0e0fe7c))

## [0.0.11](https://github.com/abijith-suresh/microbreak/compare/v0.0.10...v0.0.11) (2026-05-08)


### Features

* **2048:** make the board responsive ([#60](https://github.com/abijith-suresh/microbreak/issues/60)) ([411433d](https://github.com/abijith-suresh/microbreak/commit/411433d6378414c62b09b53dee6040de7b7da687))
* **a11y:** add motion, focus, and live updates ([#62](https://github.com/abijith-suresh/microbreak/issues/62)) ([c17fea4](https://github.com/abijith-suresh/microbreak/commit/c17fea483d38e3bd7a0c1c270ec9073713208970))
* **catalog:** enrich the home game metadata ([#67](https://github.com/abijith-suresh/microbreak/issues/67)) ([0262fd7](https://github.com/abijith-suresh/microbreak/commit/0262fd7e964d7f1176a3f31e5d6557c2ad18281b))
* **games:** separate restart from setup ([#59](https://github.com/abijith-suresh/microbreak/issues/59)) ([99d23aa](https://github.com/abijith-suresh/microbreak/commit/99d23aaec461e2f179f9d432584733ef4e973b5d))
* **minesweeper:** add direct flagging gestures ([#63](https://github.com/abijith-suresh/microbreak/issues/63)) ([e488ff1](https://github.com/abijith-suresh/microbreak/commit/e488ff153c3ce4b7a2b575aab6d4fc2e728cff39))
* **sudoku:** fit the number pad on narrow screens ([#61](https://github.com/abijith-suresh/microbreak/issues/61)) ([48e8e74](https://github.com/abijith-suresh/microbreak/commit/48e8e74bf10700bcf4f367717ccf05b9ad5d998b))
* **wordle:** curate the 4 and 6 letter answer pools ([#64](https://github.com/abijith-suresh/microbreak/issues/64)) ([a0051c0](https://github.com/abijith-suresh/microbreak/commit/a0051c01d1da97a1aad8f7b1d475a8e9c7bcb611))
* **wordle:** persist in-progress sessions ([#65](https://github.com/abijith-suresh/microbreak/issues/65)) ([4c9d602](https://github.com/abijith-suresh/microbreak/commit/4c9d60254eda53e2316341fdae3daebd8035952b))


### Bug Fixes

* **minesweeper:** preserve replay preset mode ([#57](https://github.com/abijith-suresh/microbreak/issues/57)) ([cdf2327](https://github.com/abijith-suresh/microbreak/commit/cdf2327284df54659eeac1ae341b339a190c6a6d))

## [0.0.10](https://github.com/abijith-suresh/microbreak/compare/v0.0.9...v0.0.10) (2026-05-02)


### Bug Fixes

* **landing:** order coming-soon last, expand Wordle preview ([#17](https://github.com/abijith-suresh/microbreak/issues/17)) ([189327f](https://github.com/abijith-suresh/microbreak/commit/189327f7e45cd43bc29909ff9bdeb6a2ed645275))
* **minesweeper:** use smaller board presets on mobile ([#19](https://github.com/abijith-suresh/microbreak/issues/19)) ([234cc51](https://github.com/abijith-suresh/microbreak/commit/234cc51c60d6198a043e4def93ce09429bcc979c))

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
