/**
 * Sudoku engine — hand-rolled generator, solver, and validator.
 *
 * Supports 4×4 (2×2 boxes), 6×6 (2×3 boxes), and 9×9 (3×3 boxes).
 */

export type Cell = number | null;
export type Board = Cell[][];

export type GridSize = 4 | 6 | 9;
export type Difficulty = "easy" | "medium" | "hard";

interface PuzzleResult {
  puzzle: Board;
  solution: Board;
}

/** Box dimensions for each grid size */
function getBoxDims(size: GridSize): [number, number] {
  switch (size) {
    case 4:
      return [2, 2];
    case 6:
      return [2, 3];
    case 9:
      return [3, 3];
  }
}

/** Create an empty board filled with nulls */
function emptyBoard(size: number): Board {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

/** Deep clone a board */
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Check if placing `num` at (row, col) is valid */
function isValid(board: Board, row: number, col: number, num: number): boolean {
  const size = board.length;

  // Check row
  for (let c = 0; c < size; c++) {
    if (board[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < size; r++) {
    if (board[r][col] === num) return false;
  }

  // Check box
  const [boxRows, boxCols] = getBoxDims(size as GridSize);
  const boxStartRow = Math.floor(row / boxRows) * boxRows;
  const boxStartCol = Math.floor(col / boxCols) * boxCols;

  for (let r = boxStartRow; r < boxStartRow + boxRows; r++) {
    for (let c = boxStartCol; c < boxStartCol + boxCols; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

/** Shuffle an array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate a fully solved valid board using backtracking with randomization */
function generateSolved(size: GridSize): Board {
  const board = emptyBoard(size);

  function solve(pos: number): boolean {
    if (pos === size * size) return true;

    const row = Math.floor(pos / size);
    const col = pos % size;
    const nums = shuffle(Array.from({ length: size }, (_, i) => i + 1));

    for (const num of nums) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        if (solve(pos + 1)) return true;
        board[row][col] = null;
      }
    }

    return false;
  }

  solve(0);
  return board;
}

/** Count the number of solutions (up to `limit`) using backtracking */
function countSolutions(board: Board, limit: number = 2): number {
  const size = board.length;
  let count = 0;

  function solve(pos: number): void {
    if (count >= limit) return;

    // Find next empty cell starting from pos
    while (pos < size * size && board[Math.floor(pos / size)][pos % size] !== null) {
      pos++;
    }

    if (pos === size * size) {
      count++;
      return;
    }

    const row = Math.floor(pos / size);
    const col = pos % size;

    for (let num = 1; num <= size; num++) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        solve(pos + 1);
        board[row][col] = null;
        if (count >= limit) return;
      }
    }
  }

  solve(0);
  return count;
}

/** Target number of given cells for each size/difficulty */
function targetClues(size: GridSize, difficulty: Difficulty): number {
  const total = size * size;

  // Proportional clue percentages
  const percentages: Record<GridSize, Record<Difficulty, number>> = {
    4: { easy: 0.62, medium: 0.50, hard: 0.38 },
    6: { easy: 0.55, medium: 0.44, hard: 0.34 },
    9: { easy: 0.45, medium: 0.33, hard: 0.25 },
  };

  return Math.round(total * percentages[size][difficulty]);
}

/** Generate a Sudoku puzzle */
export function generate(size: GridSize, difficulty: Difficulty): PuzzleResult {
  const solution = generateSolved(size);
  const puzzle = cloneBoard(solution);
  const sizeNum = size;
  const totalCells = sizeNum * sizeNum;
  const target = targetClues(size, difficulty);
  const toRemove = totalCells - target;

  // Create list of all positions and shuffle
  const positions = shuffle(
    Array.from({ length: totalCells }, (_, i) => [Math.floor(i / sizeNum), i % sizeNum])
  );

  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= toRemove) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = null;

    // Check unique solvability
    const testBoard = cloneBoard(puzzle);
    if (countSolutions(testBoard, 2) === 1) {
      removed++;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return { puzzle, solution };
}

/** Validate a completed board */
export function validate(board: Board): boolean {
  const size = board.length;

  // Check all cells are filled
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) return false;
    }
  }

  // Check rows
  for (let r = 0; r < size; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < size; c++) {
      const val = board[r][c]!;
      if (val < 1 || val > size || seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < size; r++) {
      const val = board[r][c]!;
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check boxes
  const [boxRows, boxCols] = getBoxDims(size as GridSize);
  for (let boxR = 0; boxR < size / boxRows; boxR++) {
    for (let boxC = 0; boxC < size / boxCols; boxC++) {
      const seen = new Set<number>();
      for (let r = boxR * boxRows; r < (boxR + 1) * boxRows; r++) {
        for (let c = boxC * boxCols; c < (boxC + 1) * boxCols; c++) {
          const val = board[r][c]!;
          if (seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
  }

  return true;
}

/** Solve a board (returns solution or null if unsolvable) */
export function solve(board: Board): Board | null {
  const size = board.length;
  const result = cloneBoard(board);

  function solveInner(pos: number): boolean {
    while (pos < size * size && result[Math.floor(pos / size)][pos % size] !== null) {
      pos++;
    }

    if (pos === size * size) return true;

    const row = Math.floor(pos / size);
    const col = pos % size;

    for (let num = 1; num <= size; num++) {
      if (isValid(result, row, col, num)) {
        result[row][col] = num;
        if (solveInner(pos + 1)) return true;
        result[row][col] = null;
      }
    }

    return false;
  }

  return solveInner(0) ? result : null;
}
