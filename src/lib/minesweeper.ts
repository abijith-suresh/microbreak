/**
 * Minesweeper engine — board generation, reveal logic, win/loss detection.
 *
 * Pure TypeScript with no framework dependencies. All functions are pure
 * (take data, return data, no side effects).
 *
 * First-click safety: the board is not generated until the first cell is
 * clicked. The clicked cell and its neighbors are guaranteed mine-free,
 * creating an opening on the very first move.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type CellState = "hidden" | "revealed" | "flagged";
export type CellValue = number; // 0–8 for adjacent mine count, -1 for mine
export type Difficulty = "beginner" | "intermediate" | "expert";

export interface CellData {
  state: CellState;
  value: CellValue;
  isMine: boolean;
}

export type Board = CellData[][];

export interface GameResult {
  board: Board;
  status: "playing" | "won" | "lost";
  /** Position of the mine the player clicked (only set on loss) */
  triggeredMine: [number, number] | null;
}

export interface DifficultyPreset {
  rows: number;
  cols: number;
  mines: number;
  label: string;
  description: string;
  time: string;
}

// ── Presets ────────────────────────────────────────────────────────────────────

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  beginner: {
    rows: 9,
    cols: 9,
    mines: 10,
    label: "9×9",
    description: "Getting started",
    time: "~30s",
  },
  intermediate: {
    rows: 16,
    cols: 16,
    mines: 40,
    label: "16×16",
    description: "A bit tricky",
    time: "~2 min",
  },
  expert: {
    rows: 16,
    cols: 30,
    mines: 99,
    label: "30×16",
    description: "Think hard",
    time: "~5 min",
  },
};

export const MOBILE_DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  beginner: {
    rows: 9,
    cols: 9,
    mines: 10,
    label: "9×9",
    description: "Getting started",
    time: "~30s",
  },
  intermediate: {
    rows: 12,
    cols: 12,
    mines: 20,
    label: "12×12",
    description: "A bit tricky",
    time: "~1 min",
  },
  expert: {
    rows: 16,
    cols: 10,
    mines: 30,
    label: "10×16",
    description: "Think hard",
    time: "~3 min",
  },
};

export function getDifficultyPreset(difficulty: Difficulty, isMobile: boolean): DifficultyPreset {
  return isMobile ? MOBILE_DIFFICULTY_PRESETS[difficulty] : DIFFICULTY_PRESETS[difficulty];
}

// ── Board creation ─────────────────────────────────────────────────────────────

/** Create an empty board (all cells hidden, no mines) */
export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      state: "hidden" as CellState,
      value: 0,
      isMine: false,
    }))
  );
}

/** Get valid neighbor positions for a cell */
export function getNeighbors(
  row: number,
  col: number,
  rows: number,
  cols: number
): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

/**
 * Generate a board with mines placed randomly, avoiding the safe zone around
 * the first-clicked cell. Computes adjacent mine counts for all cells.
 *
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @param mineCount - Number of mines to place
 * @param safeRow - Row of the first-clicked cell
 * @param safeCol - Col of the first-clicked cell
 */
export function generateBoard(
  rows: number,
  cols: number,
  mineCount: number,
  safeRow: number,
  safeCol: number
): Board {
  const board = createEmptyBoard(rows, cols);

  // Safe zone: the clicked cell and its neighbors
  const safeZone = new Set<string>();
  safeZone.add(`${safeRow},${safeCol}`);
  for (const [nr, nc] of getNeighbors(safeRow, safeCol, rows, cols)) {
    safeZone.add(`${nr},${nc}`);
  }

  // Build list of candidate positions (excluding safe zone)
  const candidates: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeZone.has(`${r},${c}`)) {
        candidates.push([r, c]);
      }
    }
  }

  // Clamp mine count if not enough non-safe cells
  const actualMines = Math.min(mineCount, candidates.length);

  // Shuffle and pick the first N candidates as mines (Fisher-Yates)
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (let i = 0; i < actualMines; i++) {
    const [r, c] = candidates[i];
    board[r][c].isMine = true;
  }

  // Compute adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) {
        board[r][c].value = -1;
        continue;
      }
      let count = 0;
      for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
        if (board[nr][nc].isMine) count++;
      }
      board[r][c].value = count;
    }
  }

  return board;
}

// ── Game actions ───────────────────────────────────────────────────────────────

/** Deep-clone a board */
function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

/**
 * Reveal a cell. If the cell has value 0, flood-fill to reveal all connected
 * 0-value cells and their numbered neighbors.
 *
 * Returns a new board (immutable update).
 */
export function revealCell(board: Board, row: number, col: number): Board {
  const newBoard = cloneBoard(board);
  const rows = newBoard.length;
  const cols = newBoard[0].length;

  // BFS flood fill
  const queue: [number, number][] = [[row, col]];
  const visited = new Set<string>();
  visited.add(`${row},${col}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const cell = newBoard[r][c];

    if (cell.state !== "hidden") continue;

    cell.state = "revealed";

    // If this is a mine, just reveal it (don't flood fill)
    if (cell.isMine) continue;

    // If value is 0, reveal all hidden neighbors and continue flood fill
    if (cell.value === 0) {
      for (const [nr, nc] of getNeighbors(r, c, rows, cols)) {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && newBoard[nr][nc].state === "hidden") {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
  }

  return newBoard;
}

/**
 * Toggle flag on a hidden cell. No-op if the cell is already revealed.
 * Returns a new board (immutable update).
 */
export function toggleFlag(board: Board, row: number, col: number): Board {
  const cell = board[row][col];
  if (cell.state === "revealed") return board;

  const newBoard = cloneBoard(board);
  newBoard[row][col].state = cell.state === "flagged" ? "hidden" : "flagged";
  return newBoard;
}

/**
 * Reveal all mines on the board (used on game loss).
 * Returns a new board with all mines revealed.
 */
export function revealAllMines(board: Board): Board {
  const newBoard = cloneBoard(board);
  for (const row of newBoard) {
    for (const cell of row) {
      if (cell.isMine && cell.state !== "flagged") {
        cell.state = "revealed";
      }
    }
  }
  return newBoard;
}

// ── Win / Loss detection ───────────────────────────────────────────────────────

/** Check if the player has won (all non-mine cells revealed) */
export function checkWin(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && cell.state !== "revealed") {
        return false;
      }
    }
  }
  return true;
}

/** Check if a cell is a mine (for loss detection on click) */
export function isMine(board: Board, row: number, col: number): boolean {
  return board[row][col].isMine;
}

/** Get positions of flags placed on non-mine cells (wrong flags shown on loss) */
export function getWrongFlags(board: Board): [number, number][] {
  const wrong: [number, number][] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const cell = board[r][c];
      if (cell.state === "flagged" && !cell.isMine) {
        wrong.push([r, c]);
      }
    }
  }
  return wrong;
}

/** Count the number of flags on the board */
export function countFlags(board: Board): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.state === "flagged") count++;
    }
  }
  return count;
}
