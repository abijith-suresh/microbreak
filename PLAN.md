# PLAN.md

## Goal

Implement a fully playable Minesweeper game in Microbreak, following the same architectural patterns and visual language as the existing Sudoku game — Astro page, SolidJS reactive components, pure logic engine, and the warm flat-minimal aesthetic.

## Approach

Mirror the Sudoku architecture exactly: pure engine (`minesweeper.ts`), SolidJS state composable (`minesweeperGame.ts`), and a set of UI components (`MinesweeperApp`, `MinesweeperSetup`, `MinesweeperBoard`, `MinesweeperCell`). First click is always safe and opens at least a small area. Three classic difficulty presets. Toggle-based dig/flag mode for mobile compatibility. Flat minimal visual style with standard minesweeper number colors. Timer + mine counter in the top bar. Simple loss reveal (no cascade animation for v1). Home page card updated with mini animated grid preview.

### Key Decisions

- **First click safety**: Mine positions are generated after the first click, guaranteeing the clicked cell and its neighbors are mine-free (creates an opening)
- **Presets only**: Beginner (9×9, 10 mines), Intermediate (16×16, 40 mines), Expert (30×16, 99 mines) — no custom option
- **Flag mode**: Toggle button between dig/flag modes (no long-press, no chord click)
- **Visual style**: Flat & minimal matching Sudoku. Unrevealed = `bg-surface`, revealed = `bg-bg`, standard number colors adapted for light/dark themes
- **Loss state**: All mines revealed instantly, triggered mine in red, wrong flags marked with ✕
- **Home card**: Mini animated grid preview matching Sudoku's card treatment

## Steps

### 1. Game Engine (`src/lib/minesweeper.ts`)

Pure TypeScript — no framework dependencies. Types, board generation, reveal logic, win/loss detection.

- Define types: `CellState` (hidden / revealed / flagged), `CellValue` (mine or 0–8), `Board`, `Difficulty`, `GameState`, `CellPosition`
- `createBoard(rows, cols, mineCount, safeRow, safeCol)` — generate a board with mines placed randomly, avoiding the safe cell and its 8 neighbors. Compute adjacent mine counts for all cells
- `revealCell(board, row, col)` — reveal a cell; if value is 0, flood-fill to reveal all connected 0-value cells and their numbered neighbors. Return new board state
- `toggleFlag(board, row, col)` — toggle flag on a hidden cell
- `checkWin(board)` — win when all non-mine cells are revealed
- `getWrongFlags(board)` — return positions of flags placed on non-mine cells (for loss display)
- `getNeighbors(row, col, rows, cols)` — return valid neighbor positions (handles edges/corners)
- No I/O, no side effects — pure functions that take and return data

### 2. Engine Tests (`src/lib/__tests__/minesweeper.test.ts`)

Vitest tests covering:

- Board generation respects dimensions and mine count
- Safe zone has no mines around first-click cell
- Adjacent counts are correct
- Flood fill reveals connected empty region
- Flag toggle works correctly
- Win detection when all non-mine cells revealed
- Wrong flag identification on loss
- Edge cases: corner cells, single-cell boards

### 3. Game State Composable (`src/lib/minesweeperGame.ts`)

SolidJS composable following `sudokuGame.ts` patterns:

- Signals: `phase` (setup/playing), `difficulty`, `rows`, `cols`, `mineCount`, `board`, `timerSeconds`, `gameResult` (null/won/lost), `triggeredMine` position, `digMode` (true=dig, false=flag)
- Timer management: start on first click, pause on tab hide, stop on game end (same as Sudoku)
- Actions: `startGame(difficulty)`, `restart()`, `playAgain()`, `handleCellClick(row, col)` (delegates to reveal or flag based on `digMode`), `toggleMode()`
- `mineCounter` derived signal: total mines - flags placed
- Derived: `boardReady`, `isWon`, `isLost`
- Keyboard event listeners for arrow navigation, space/enter to reveal, F to toggle flag mode

### 4. Setup Screen (`src/components/MinesweeperSetup.tsx`)

Matches `SudokuSetup.tsx` layout:

- Back link to "/" with chevron icon
- "Minesweeper" heading in Instrument Serif italic
- Three difficulty cards in a 3-column grid:
  - **Beginner**: 9×9 · 10 mines · "~30s"
  - **Intermediate**: 16×16 · 40 mines · "~2 min"
  - **Expert**: 30×16 · 99 mines · "~5 min"
- "Start Game" accent button
- Exit animation before handing off to playing phase
- ThemeToggle in top bar
- Same press-feedback patterns (pointer events, scale transforms)

### 5. Board Component (`src/components/MinesweeperBoard.tsx`)

Matches `SudokuBoard.tsx` architecture:

- CSS Grid with `grid-template-columns: repeat(cols, auto)`
- `<For>` over stable cell index array for fine-grained reactivity
- Per-cell reactive getters for: value, state (hidden/revealed/flagged), isMine, isTriggered, isWrongFlag
- Cell size adapts to difficulty (larger for Beginner, smaller for Expert)
- Keyboard navigation: arrow keys move selection, space/enter to reveal, F to flag
- Box-boundary borders not needed (minesweeper has no box regions), but outer border + thin inner grid lines
- Entrance animation: cells cascade in center-outward (reuse `cellReveal` keyframe)

### 6. Cell Component (`src/components/MinesweeperCell.tsx`)

Matches `SudokuCell.tsx` patterns:

- Visual states:
  - **Hidden**: `bg-surface`, flat, cursor pointer
  - **Flagged**: `bg-surface` with flag icon (🚩 or SVG), accent highlight
  - **Revealed (0)**: `bg-bg`, empty
  - **Revealed (1–8)**: `bg-bg`, number with standard color (1=blue, 2=green, 3=red, 4=darkblue, 5=darkred, 6=teal, 7=dark, 8=gray) — colors defined as CSS variables for theme adaptation
  - **Mine (loss)**: `bg-bg` with mine icon, triggered mine gets error-red background
  - **Wrong flag (loss)**: flag icon with ✕ overlay in error color
- Press feedback: scale(0.93) on pointer down
- Hover: subtle `bg-surface-hover` on hidden cells
- Selected cell highlight: thin accent border or `bg-selected`

### 7. Top Bar & Mode Toggle

Rendered inside `MinesweeperApp.tsx` during playing phase:

- Left: Back button ("New Game" → returns to setup)
- Center: Mine counter (💣 icon + count) · Difficulty label · Timer
- Right: ThemeToggle
- Below top bar: Dig/Flag mode toggle button
  - Two-segment button: 🪓 Dig | 🚩 Flag
  - Active segment gets accent highlight + slightly elevated
  - Or: single toggle button that shows current mode, tap to switch
  - My recommendation: two-segment for clarity

### 8. Completion & Game Over Screens

**Win** — reuse `CompletionScreen.tsx` pattern:

- Same checkmark SVG animation
- "Cleared" heading (instead of "Solved")
- Time display, difficulty label
- "Play Again" + "Back to Games" buttons

**Loss** — new minimal overlay:

- Mine icon instead of checkmark
- "Game Over" heading
- "Play Again" + "Back to Games" buttons
- Same fade-in animation pattern

### 9. Page Route (`src/pages/minesweeper.astro`)

Minimal Astro page, identical pattern to `sudoku.astro`:

- Import BaseLayout + MinesweeperApp
- Title: "Minesweeper — Microbreak"
- `<MinesweeperApp client:load />`

### 10. CSS Additions (`src/styles/global.css`)

- Number color CSS variables (both light/dark themes):
  - `--color-ms-1` through `--color-ms-8`
- Minesweeper-specific keyframes if needed (likely reuse existing: `cellReveal`, `fadeIn`, `scaleIn`, `completionWave`)
- `.minesweeper-cell` base class (similar to `.sudoku-cell`)
- Flag and mine icon sizing

### 11. Home Page Update (`src/components/GameGrid.tsx`)

- Mark Minesweeper as `active: true`, add `href: "/minesweeper"`
- Create `MiniMinesweeperGrid` component:
  - Small grid (8×8 or so) with cells randomly toggling between hidden/revealed/flagged states
  - Cycle continuously with staggered timing
  - Same card treatment as Sudoku: green dot, hover effects, "Click to play →"

### 12. File Structure Summary

```
src/
├── lib/
│   ├── minesweeper.ts           # Pure engine
│   ├── minesweeperGame.ts       # SolidJS state composable
│   └── __tests__/
│       └── minesweeper.test.ts  # Engine tests
├── components/
│   ├── MinesweeperApp.tsx       # Orchestrator
│   ├── MinesweeperSetup.tsx     # Difficulty selection
│   ├── MinesweeperBoard.tsx     # Grid rendering
│   ├── MinesweeperCell.tsx      # Individual cell
│   └── GameGrid.tsx             # Updated (active + mini preview)
├── pages/
│   └── minesweeper.astro        # Route page
└── styles/
    └── global.css               # Updated (minesweeper tokens + animations)
```

## Current Step

[Leave blank until build begins — agent updates this during build]
