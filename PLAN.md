# PLAN.md

## Goal

Bring Minesweeper's animation polish up to parity with Sudoku: unified landing-page
preview speeds, a cell-by-cell board entrance when the game starts, and a satisfying
pre-result animation before the completion screen appears (win wave + lose blast).

## Approach

Three isolated changes, each building on existing patterns already proven in the
Sudoku implementation:

1. **Landing preview parity** — adjust `MiniMinesweeperGrid` in `GameGrid.tsx` to
   match Sudoku's 3-cells-per-120 ms batching rhythm and use the same dramatic
   `scale(0.3 → 1)` / `opacity(0 → 0.9)` values.

2. **Board entrance animation** — mirror `SudokuBoard`'s `entering` signal pattern
   in `MinesweeperBoard`, stagger each cell's `cellReveal` keyframe by manhattan
   distance from centre, with a board-size-aware step so all three difficulty sizes
   finish in ~750–850 ms.

3. **Pre-result animation** — add `completing` / `completionOrigin` signals to
   `minesweeperGame.ts`, delay `setGameResult` by ~800 ms, and animate cells in
   `MinesweeperCell` using the existing `completionWave` keyframe for wins and a new
   `mineBlast` keyframe (error-red shockwave from the triggered mine) for losses.

No new dependencies. All animations are CSS keyframes. Follows the exact same
SolidJS signal + timeout architecture already used in `sudokuGame.ts` /
`SudokuBoard` / `SudokuCell`.

## Steps

### Step 1 — Fix landing page preview speed in `GameGrid.tsx`

**File:** `src/components/GameGrid.tsx`

Inside `MiniMinesweeperGrid`:

- Change `setInterval` delay from `150` → `120` ms (matches Sudoku).
- Change batch logic from 1 cell per tick to 3 cells per tick (matches Sudoku).
- Change revealed-cell style from `scale(0.9)` → `scale(1)` and `opacity: 0.9` to
  `scale(0.3)` → `scale(1)` and `opacity: 0` → `opacity: 0.9` (same range as Sudoku).
- Change hidden-cell style: `opacity: 0` (was `0.4`) so unrevealed cells are invisible
  until animated in — gives the same "materialising" effect Sudoku has.

### Step 2 — Add `mineBlast` keyframe to global CSS

**File:** `src/styles/global.css`

Add a new keyframe after `groupSweep`:

```css
@keyframes mineBlast {
  0% {
    background-color: transparent;
    transform: scale(1);
  }
  20% {
    background-color: color-mix(in srgb, var(--color-error) 40%, transparent);
    transform: scale(1.05);
  }
  65% {
    background-color: color-mix(in srgb, var(--color-error) 15%, transparent);
    transform: scale(1);
  }
  100% {
    background-color: transparent;
    transform: scale(1);
  }
}
```

### Step 3 — Add `completing` / `completionOrigin` state to `minesweeperGame.ts`

**File:** `src/lib/minesweeperGame.ts`

- Add signals: `completing`, `completionOrigin`, `pendingResult`.
- Add `completionTimer` ref (like `groupSweepTimer` in sudokuGame).
- Replace the direct `setGameResult(...)` calls in `handleCellClick` with a new
  internal helper `triggerCompletion(result, originRow, originCol)`:
  1. Performs all board state updates (reveal all mines, wrong flags etc.) — unchanged.
  2. Sets `setCompletionOrigin([originRow, originCol])`.
  3. Sets `setCompleting(true)`.
  4. After 800 ms: sets `setGameResult(result)` and `setCompleting(false)`.
- Update `resetProgress` to clear `completing`, `completionOrigin`, and cancel
  any pending `completionTimer`.
- Export `completing` and `completionOrigin` from the composable return object.

### Step 4 — Wire `completing` / `completionOrigin` into `MinesweeperApp.tsx`

**File:** `src/components/MinesweeperApp.tsx`

- Pass `completing={game.completing()}`, `completionOrigin={game.completionOrigin()}`,
  and `completionResult={game.gameResult() ?? (game.completing() ? 'pending' : null)}`
  to `<MinesweeperBoard>`.

  Actually simpler: pass `isCompleting={game.completing()}`,
  `completionOrigin={game.completionOrigin()}`, and derive win/lose inside the board
  from the existing `triggeredMine` prop (if `triggeredMine !== null` the game is lost).

### Step 5 — Add board entrance animation to `MinesweeperBoard.tsx`

**File:** `src/components/MinesweeperBoard.tsx`

Mirror `SudokuBoard`'s `entering` pattern:

- Add `isCompleting`, `completionOrigin` to the `Props` interface.
- Add internal `entering` signal:
  ```ts
  const [entering, setEntering] = createSignal(true);
  onMount(() => {
    const maxDist = Math.floor(rows() / 2) + Math.floor(cols() / 2);
    const step = Math.round(250 / maxDist);
    const timer = setTimeout(() => setEntering(false), maxDist * step + 520);
    onCleanup(() => clearTimeout(timer));
  });
  ```
- Compute per-cell `entranceDelay`:
  ```ts
  const centerRow = (rows() - 1) / 2;
  const centerCol = (cols() - 1) / 2;
  const step = Math.round(250 / (Math.floor(rows() / 2) + Math.floor(cols() / 2)));
  const entranceDelay = Math.round((Math.abs(row - centerRow) + Math.abs(col - centerCol)) * step);
  ```
- Compute per-cell `completingDelay`:
  ```ts
  const origin = props.completionOrigin;
  const completingDelay =
    props.isCompleting && origin ? (Math.abs(row - origin[0]) + Math.abs(col - origin[1])) * 35 : 0;
  ```
- Pass all three — `entering()`, `entranceDelay`, `isCompleting`, `completingDelay`,
  `isLoss` (= `props.triggeredMine !== null`) — down to `<MinesweeperCell>`.

### Step 6 — Animate `MinesweeperCell.tsx` for all three states

**File:** `src/components/MinesweeperCell.tsx`

Add props:

```ts
entering: boolean;
entranceDelay: number;
isCompleting: boolean;
completingDelay: number;
isLoss: boolean; // true when game ended as a loss
```

Add a `combinedStyle()` computed value (mirrors `SudokuCell.combinedStyle()`):

```ts
const combinedStyle = () => {
  // 1. Entrance — highest priority
  if (props.entering) {
    return {
      animation: `cellReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${props.entranceDelay}ms both`,
      transform: "",
    };
  }

  // 2. Pre-result animation
  if (props.isCompleting) {
    const keyframe = props.isLoss ? "mineBlast" : "completionWave";
    return {
      animation: `${keyframe} 0.5s ease-out ${props.completingDelay}ms forwards`,
      transform: "",
    };
  }

  // 3. Normal state — press feedback
  return {
    animation: "",
    transform: pressing() && props.state !== "revealed" && !props.gameOver ? "scale(0.93)" : "",
  };
};
```

Apply `combinedStyle()` to the button's `style` prop and suppress hover/press
feedback while `props.entering || props.isCompleting`.

## Current Step

_(blank — build not yet started)_
