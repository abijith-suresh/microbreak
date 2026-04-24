/**
 * Sudoku engine — hand-rolled generator, solver, and validator.
 *
 * Supports 4×4 (2×2 boxes), 6×6 (2×3 boxes), and 9×9 (3×3 boxes).
 *
 * Implementation note:
 * - Uses a minimum-remaining-values (MRV) search heuristic, similar to the
 *   approach used by robust open-source Sudoku solvers, to reduce branching
 *   and make solving / uniqueness checks more reliable.
 */

export type Cell = number | null;
export type Board = Cell[][];

export type GridSize = 4 | 6 | 9;
export type Difficulty = "easy" | "medium" | "hard";

export interface CompletingGroup {
  type: "row" | "col" | "box";
  index: number;
  origin: [number, number];
}

interface PuzzleResult {
  puzzle: Board;
  solution: Board;
}

interface EmptyCellChoice {
  row: number;
  col: number;
  candidates: number[];
}

/** Supported grid sizes */
function isSupportedSize(size: number): size is GridSize {
  return size === 4 || size === 6 || size === 9;
}

/** Box dimensions for each grid size */
export function getBoxDims(size: GridSize): [number, number] {
  switch (size) {
    case 4:
      return [2, 2];
    case 6:
      return [2, 3];
    case 9:
      return [3, 3];
  }
}

/** Ensure the board shape is square and supported */
function hasValidShape(board: Board): boolean {
  const size = board.length;
  return isSupportedSize(size) && board.every((row) => row.length === size);
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
  if (!isSupportedSize(size)) return false;

  // Check row
  for (let c = 0; c < size; c++) {
    if (board[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < size; r++) {
    if (board[r][col] === num) return false;
  }

  // Check box
  const [boxRows, boxCols] = getBoxDims(size);
  const boxStartRow = Math.floor(row / boxRows) * boxRows;
  const boxStartCol = Math.floor(col / boxCols) * boxCols;

  for (let r = boxStartRow; r < boxStartRow + boxRows; r++) {
    for (let c = boxStartCol; c < boxStartCol + boxCols; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

/** Return all legal candidates for a cell */
function getCandidates(board: Board, row: number, col: number): number[] {
  const size = board.length;
  const candidates: number[] = [];

  for (let num = 1; num <= size; num++) {
    if (isValid(board, row, col, num)) {
      candidates.push(num);
    }
  }

  return candidates;
}

/**
 * Find the next empty cell with the fewest legal candidates (MRV heuristic).
 * Returns null when the board has no empty cells.
 */
function findBestEmptyCell(board: Board): EmptyCellChoice | null {
  const size = board.length;
  let best: EmptyCellChoice | null = null;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== null) continue;

      const candidates = getCandidates(board, row, col);
      if (candidates.length === 0) {
        return { row, col, candidates };
      }

      if (best === null || candidates.length < best.candidates.length) {
        best = { row, col, candidates };
        if (candidates.length === 1) return best;
      }
    }
  }

  return best;
}

/** Validate that the board's existing givens do not conflict */
function hasConflictingGivens(board: Board): boolean {
  const size = board.length;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = board[row][col];
      if (value === null) continue;

      board[row][col] = null;
      const valid = isValid(board, row, col, value);
      board[row][col] = value;

      if (!valid) return true;
    }
  }

  return false;
}

/** Shuffle an array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate a fully solved valid board using MRV-guided backtracking */
function generateSolved(size: GridSize): Board {
  const board = emptyBoard(size);

  function solveInner(): boolean {
    const choice = findBestEmptyCell(board);
    if (choice === null) return true;
    if (choice.candidates.length === 0) return false;

    for (const num of shuffle([...choice.candidates])) {
      board[choice.row][choice.col] = num;
      if (solveInner()) return true;
      board[choice.row][choice.col] = null;
    }

    return false;
  }

  if (!solveInner()) {
    throw new Error(`Failed to generate solved ${size}×${size} Sudoku board`);
  }

  return board;
}

/** Count the number of solutions (up to `limit`) using MRV-guided backtracking */
function countSolutions(board: Board, limit: number = 2): number {
  if (!hasValidShape(board) || hasConflictingGivens(board)) return 0;

  let count = 0;

  function solveInner(): void {
    if (count >= limit) return;

    const choice = findBestEmptyCell(board);
    if (choice === null) {
      count++;
      return;
    }
    if (choice.candidates.length === 0) return;

    for (const num of choice.candidates) {
      board[choice.row][choice.col] = num;
      solveInner();
      board[choice.row][choice.col] = null;
      if (count >= limit) return;
    }
  }

  solveInner();
  return count;
}

/** Target number of given cells for each size/difficulty */
function targetClues(size: GridSize, difficulty: Difficulty): number {
  const total = size * size;

  // Proportional clue percentages
  const percentages: Record<GridSize, Record<Difficulty, number>> = {
    4: { easy: 0.62, medium: 0.5, hard: 0.38 },
    6: { easy: 0.55, medium: 0.44, hard: 0.34 },
    9: { easy: 0.45, medium: 0.33, hard: 0.25 },
  };

  return Math.round(total * percentages[size][difficulty]);
}

/** Generate a Sudoku puzzle */
export function generate(size: GridSize, difficulty: Difficulty): PuzzleResult {
  const solution = generateSolved(size);
  const puzzle = cloneBoard(solution);
  const totalCells = size * size;
  const target = targetClues(size, difficulty);
  const toRemove = totalCells - target;

  const positions = shuffle(
    Array.from({ length: totalCells }, (_, i) => [Math.floor(i / size), i % size] as const)
  );

  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= toRemove) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = null;

    if (countSolutions(cloneBoard(puzzle), 2) === 1) {
      removed++;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return { puzzle, solution };
}

/**
 * Return a set of "row,col" keys for every cell involved in at least one
 * constraint conflict (row, column, or box duplicate).
 *
 * Only checks non-null cells. A cell is conflicted if its value appears
 * more than once in its row, column, or box.
 */
export function getConflictingCells(board: Board): Set<string> {
  const size = board.length;
  if (!isSupportedSize(size)) return new Set();

  const conflicted = new Set<string>();

  // Row conflicts
  for (let r = 0; r < size; r++) {
    const seen = new Map<number, number[]>();
    for (let c = 0; c < size; c++) {
      const v = board[r][c];
      if (v === null) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v)!.push(c);
    }
    for (const cols of seen.values()) {
      if (cols.length > 1) {
        for (const c of cols) conflicted.add(`${r},${c}`);
      }
    }
  }

  // Column conflicts
  for (let c = 0; c < size; c++) {
    const seen = new Map<number, number[]>();
    for (let r = 0; r < size; r++) {
      const v = board[r][c];
      if (v === null) continue;
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v)!.push(r);
    }
    for (const rows of seen.values()) {
      if (rows.length > 1) {
        for (const r of rows) conflicted.add(`${r},${c}`);
      }
    }
  }

  // Box conflicts
  const [boxRows, boxCols] = getBoxDims(size);
  const numBoxRows = size / boxRows;
  const numBoxCols = size / boxCols;

  for (let br = 0; br < numBoxRows; br++) {
    for (let bc = 0; bc < numBoxCols; bc++) {
      const seen = new Map<number, [number, number][]>();
      for (let r = br * boxRows; r < (br + 1) * boxRows; r++) {
        for (let c = bc * boxCols; c < (bc + 1) * boxCols; c++) {
          const v = board[r][c];
          if (v === null) continue;
          if (!seen.has(v)) seen.set(v, []);
          seen.get(v)!.push([r, c]);
        }
      }
      for (const cells of seen.values()) {
        if (cells.length > 1) {
          for (const [r, c] of cells) conflicted.add(`${r},${c}`);
        }
      }
    }
  }

  return conflicted;
}

/**
 * Check if a group (row, column, or box) is fully filled with no duplicates.
 */
export function isGroupComplete(board: Board, type: "row" | "col" | "box", index: number): boolean {
  const size = board.length;
  if (!isSupportedSize(size)) return false;

  const values: number[] = [];

  if (type === "row") {
    for (let c = 0; c < size; c++) {
      const v = board[index][c];
      if (v === null) return false;
      values.push(v);
    }
  } else if (type === "col") {
    for (let r = 0; r < size; r++) {
      const v = board[r][index];
      if (v === null) return false;
      values.push(v);
    }
  } else if (type === "box") {
    const [boxRows, boxCols] = getBoxDims(size);
    const br = Math.floor(index / (size / boxCols)) * boxRows;
    const bc = (index % (size / boxCols)) * boxCols;
    for (let r = br; r < br + boxRows; r++) {
      for (let c = bc; c < bc + boxCols; c++) {
        const v = board[r][c];
        if (v === null) return false;
        values.push(v);
      }
    }
  }

  // No duplicates means the set size equals the array length
  return new Set(values).size === values.length;
}

/** Validate a completed board */
export function validate(board: Board): boolean {
  if (!hasValidShape(board) || hasConflictingGivens(board)) return false;
  const size = board.length;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = board[row][col];
      if (value === null || value < 1 || value > size) return false;
    }
  }

  return true;
}

/**
 * Return every group (row, col, box) that was just completed by placing a
 * value at (triggerRow, triggerCol). Only groups that contain the trigger cell
 * and are now fully filled without duplicates are returned.
 */
export function getJustCompletedGroups(
  board: Board,
  triggerRow: number,
  triggerCol: number
): CompletingGroup[] {
  const size = board.length;
  if (!isSupportedSize(size)) return [];

  const result: CompletingGroup[] = [];

  if (isGroupComplete(board, "row", triggerRow)) {
    result.push({ type: "row", index: triggerRow, origin: [triggerRow, triggerCol] });
  }

  if (isGroupComplete(board, "col", triggerCol)) {
    result.push({ type: "col", index: triggerCol, origin: [triggerRow, triggerCol] });
  }

  const [boxRows, boxCols] = getBoxDims(size);
  const numBoxCols = size / boxCols;
  const boxIndex = Math.floor(triggerRow / boxRows) * numBoxCols + Math.floor(triggerCol / boxCols);

  if (isGroupComplete(board, "box", boxIndex)) {
    result.push({ type: "box", index: boxIndex, origin: [triggerRow, triggerCol] });
  }

  return result;
}

/** Solve a board (returns solution or null if unsolvable) */
export function solve(board: Board): Board | null {
  if (!hasValidShape(board)) return null;

  const result = cloneBoard(board);
  if (hasConflictingGivens(result)) return null;

  function solveInner(): boolean {
    const choice = findBestEmptyCell(result);
    if (choice === null) return true;
    if (choice.candidates.length === 0) return false;

    for (const num of choice.candidates) {
      result[choice.row][choice.col] = num;
      if (solveInner()) return true;
      result[choice.row][choice.col] = null;
    }

    return false;
  }

  return solveInner() ? result : null;
}
