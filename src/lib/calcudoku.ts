/**
 * Calcudoku engine: puzzle generation, a uniqueness-checking solver, and the board rules.
 *
 * A puzzle is an N×N grid that must hold 1–N once in every row and column. The grid is split
 * into cages, each with an operation and a target the cage's digits must reach. Digits may
 * repeat inside a cage as long as no row or column repeats. Single-cell cages are givens.
 *
 *   easy    4×4   small cages, mostly + and −
 *   medium  5×5   cages up to four cells, every operation
 *   hard    6×6   larger cages, mostly × and ÷, at most one given
 */

import { pickWeighted, type Random, randomInt, shuffle } from "./random";

export type GridSize = 4 | 5 | 6;
export type Difficulty = "easy" | "medium" | "hard";
export type Operation = "given" | "add" | "subtract" | "multiply" | "divide";

export type Cell = number | null;
export type Grid = Cell[][];
/** Each cell's pencil notes, sorted ascending. */
export type Notes = number[][][];

export interface Cage {
  cells: [number, number][];
  operation: Operation;
  target: number;
}

export interface CalcudokuPuzzle {
  size: GridSize;
  cages: Cage[];
  solution: number[][];
}

export interface CalcudokuBoard {
  values: Grid;
  notes: Notes;
}

export type CageStatus = "incomplete" | "satisfied" | "violated";

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

export const SIZE_FOR_DIFFICULTY: Record<Difficulty, GridSize> = {
  easy: 4,
  medium: 5,
  hard: 6,
};

interface DifficultySettings {
  /** How likely a new cage is to aim for each size. Cages can end smaller when boxed in. */
  cageSizes: readonly (readonly [number, number])[];
  /** Most single-cell cages a puzzle may have; extra ones merge into a neighbour. */
  maxGivens: number;
  /** Operation weights for two-cell cages. Division is skipped when it does not divide evenly. */
  pair: readonly (readonly [Operation, number])[];
  /** Operation weights for cages of three or more cells. */
  group: readonly (readonly [Operation, number])[];
}

const SETTINGS: Record<Difficulty, DifficultySettings> = {
  easy: {
    cageSizes: [
      [1, 1],
      [2, 6],
      [3, 2],
    ],
    maxGivens: 3,
    pair: [
      ["add", 4],
      ["subtract", 4],
      ["multiply", 1],
      ["divide", 1],
    ],
    group: [
      ["add", 3],
      ["multiply", 1],
    ],
  },
  medium: {
    cageSizes: [
      [1, 1],
      [2, 5],
      [3, 4],
      [4, 1],
    ],
    maxGivens: 2,
    pair: [
      ["add", 2],
      ["subtract", 3],
      ["multiply", 2],
      ["divide", 3],
    ],
    group: [
      ["add", 1],
      ["multiply", 1],
    ],
  },
  hard: {
    cageSizes: [
      [1, 0.5],
      [2, 4],
      [3, 4],
      [4, 2],
    ],
    maxGivens: 1,
    pair: [
      ["add", 1],
      ["subtract", 3],
      ["multiply", 2],
      ["divide", 4],
    ],
    group: [
      ["add", 2],
      ["multiply", 3],
    ],
  },
};

const OPERATION_SYMBOLS: Record<Operation, string> = {
  given: "",
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

/** The label printed in a cage's corner: "12+", "2÷", or "3" for a given. */
export function cageLabel(cage: Cage): string {
  return `${cage.target}${OPERATION_SYMBOLS[cage.operation]}`;
}

// ── Arithmetic ──────────────────────────────────────────────────────────────

/** True when the digits, in any order, reach the cage's target with its operation. */
export function evaluateCage(operation: Operation, target: number, digits: number[]): boolean {
  switch (operation) {
    case "given":
      return digits.length === 1 && digits[0] === target;
    case "add":
      return digits.reduce((sum, d) => sum + d, 0) === target;
    case "multiply":
      return digits.reduce((product, d) => product * d, 1) === target;
    case "subtract":
      return digits.length === 2 && Math.abs(digits[0] - digits[1]) === target;
    case "divide": {
      if (digits.length !== 2) return false;
      const high = Math.max(digits[0], digits[1]);
      const low = Math.min(digits[0], digits[1]);
      return high % low === 0 && high / low === target;
    }
  }
}

/** Satisfied or violated once every cell in the cage holds a digit; incomplete until then. */
export function getCageStatus(cage: Cage, values: Grid): CageStatus {
  const digits: number[] = [];
  for (const [row, col] of cage.cells) {
    const value = values[row]?.[col];
    if (value === null || value === undefined) return "incomplete";
    digits.push(value);
  }
  return evaluateCage(cage.operation, cage.target, digits) ? "satisfied" : "violated";
}

export function getCageStatuses(puzzle: CalcudokuPuzzle, values: Grid): CageStatus[] {
  return puzzle.cages.map((cage) => getCageStatus(cage, values));
}

/** Each cell's cage index, for drawing cage borders and finding a cell's cage. */
export function getCageIndexGrid(puzzle: CalcudokuPuzzle): number[][] {
  const grid = Array.from({ length: puzzle.size }, () => Array<number>(puzzle.size).fill(-1));
  puzzle.cages.forEach((cage, index) => {
    for (const [row, col] of cage.cells) grid[row][col] = index;
  });
  return grid;
}

// ── Latin square ────────────────────────────────────────────────────────────

/** A random N×N grid with 1–N once in every row and column. */
export function generateLatinSquare(size: GridSize, random: Random): number[][] {
  const grid = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const rowUsed = Array<number>(size).fill(0);
  const colUsed = Array<number>(size).fill(0);

  function fill(index: number): boolean {
    if (index === size * size) return true;
    const row = Math.floor(index / size);
    const col = index % size;
    const digits = shuffle(
      Array.from({ length: size }, (_, i) => i + 1),
      random
    );
    for (const digit of digits) {
      const bit = 1 << digit;
      if (rowUsed[row] & bit || colUsed[col] & bit) continue;
      grid[row][col] = digit;
      rowUsed[row] |= bit;
      colUsed[col] |= bit;
      if (fill(index + 1)) return true;
      rowUsed[row] &= ~bit;
      colUsed[col] &= ~bit;
    }
    grid[row][col] = 0;
    return false;
  }

  fill(0);
  return grid;
}

export function isLatinSquare(grid: number[][], size: number): boolean {
  if (grid.length !== size) return false;
  for (let i = 0; i < size; i++) {
    if (grid[i].length !== size) return false;
    const rowSeen = new Set<number>();
    const colSeen = new Set<number>();
    for (let j = 0; j < size; j++) {
      const across = grid[i][j];
      const down = grid[j][i];
      if (!Number.isInteger(across) || across < 1 || across > size) return false;
      rowSeen.add(across);
      colSeen.add(down);
    }
    if (rowSeen.size !== size || colSeen.size !== size) return false;
  }
  return true;
}

// ── Cages ───────────────────────────────────────────────────────────────────

const STEPS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function neighbours(index: number, size: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const result: number[] = [];
  for (const [dr, dc] of STEPS) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < size && c >= 0 && c < size) result.push(r * size + c);
  }
  return result;
}

/** Splits the grid into connected cages of cell indices. */
function partitionCells(size: number, settings: DifficultySettings, random: Random): number[][] {
  const owner = Array<number>(size * size).fill(-1);
  const cages: number[][] = [];

  for (const start of shuffle(
    Array.from({ length: size * size }, (_, i) => i),
    random
  )) {
    if (owner[start] !== -1) continue;
    const id = cages.length;
    const cage = [start];
    owner[start] = id;
    const goal = pickWeighted(settings.cageSizes, random);

    while (cage.length < goal) {
      const frontier = [
        ...new Set(cage.flatMap((cell) => neighbours(cell, size).filter((n) => owner[n] === -1))),
      ];
      if (frontier.length === 0) break;
      const next = frontier[randomInt(random, frontier.length)];
      owner[next] = id;
      cage.push(next);
    }
    cages.push(cage);
  }

  // Too many givens make the puzzle trivial: fold the extras into their smallest neighbour.
  let singles = cages.filter((cage) => cage.length === 1);
  while (singles.length > settings.maxGivens) {
    const single = singles[randomInt(random, singles.length)];
    const id = owner[single[0]];
    const choices = [...new Set(neighbours(single[0], size).map((n) => owner[n]))];
    const smallest = Math.min(...choices.map((c) => cages[c].length));
    const candidates = choices.filter((c) => cages[c].length === smallest);
    const into = candidates[randomInt(random, candidates.length)];
    cages[into].push(single[0]);
    owner[single[0]] = into;
    cages[id] = [];
    singles = cages.filter((cage) => cage.length === 1);
  }

  return cages.filter((cage) => cage.length > 0).map((cage) => cage.sort((a, b) => a - b));
}

function chooseOperation(
  digits: number[],
  settings: DifficultySettings,
  random: Random
): [Operation, number] {
  if (digits.length === 1) return ["given", digits[0]];

  if (digits.length === 2) {
    const high = Math.max(digits[0], digits[1]);
    const low = Math.min(digits[0], digits[1]);
    const options = settings.pair.filter(([op]) => op !== "divide" || high % low === 0);
    const operation = pickWeighted(options, random);
    if (operation === "subtract") return [operation, high - low];
    if (operation === "divide") return [operation, high / low];
    if (operation === "multiply") return [operation, high * low];
    return [operation, high + low];
  }

  const operation = pickWeighted(settings.group, random);
  return operation === "multiply"
    ? [operation, digits.reduce((product, d) => product * d, 1)]
    : [operation, digits.reduce((sum, d) => sum + d, 0)];
}

// ── Solver ──────────────────────────────────────────────────────────────────

/**
 * Every digit assignment that meets the cage's arithmetic and does not repeat a digit in a row
 * or column inside the cage. Each assignment lists digits in the order of `cage.cells`.
 */
export function cageAssignments(cage: Cage, size: number): number[][] {
  const { cells, operation, target } = cage;
  const results: number[][] = [];
  const current: number[] = [];

  function extend(position: number) {
    if (position === cells.length) {
      if (evaluateCage(operation, target, current)) results.push([...current]);
      return;
    }
    const remaining = cells.length - position - 1;
    const [row, col] = cells[position];
    for (let digit = 1; digit <= size; digit++) {
      let clash = false;
      for (let i = 0; i < position; i++) {
        const [r, c] = cells[i];
        if (current[i] === digit && (r === row || c === col)) {
          clash = true;
          break;
        }
      }
      if (clash) continue;
      if (operation === "add") {
        const sum = current.reduce((s, d) => s + d, 0) + digit;
        if (sum + remaining > target || sum + remaining * size < target) continue;
      } else if (operation === "multiply") {
        const product = current.reduce((p, d) => p * d, 1) * digit;
        if (target % product !== 0) continue;
      }
      current.push(digit);
      extend(position + 1);
      current.pop();
    }
  }

  extend(0);
  return results;
}

/**
 * Finds up to `limit` solutions. Searches cage by cage, always filling the cage with the fewest
 * assignments that still fit the digits already placed.
 */
export function findSolutions(
  puzzle: Pick<CalcudokuPuzzle, "size" | "cages">,
  limit = 2
): number[][][] {
  const { size, cages } = puzzle;
  const domains = cages.map((cage) => cageAssignments(cage, size));
  const rowUsed = Array<number>(size).fill(0);
  const colUsed = Array<number>(size).fill(0);
  const grid = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const filled = Array<boolean>(cages.length).fill(false);
  const solutions: number[][][] = [];

  const fits = (cage: Cage, digits: number[]) =>
    cage.cells.every(([row, col], i) => {
      const bit = 1 << digits[i];
      return !(rowUsed[row] & bit) && !(colUsed[col] & bit);
    });

  const place = (cage: Cage, digits: number[], on: boolean) => {
    cage.cells.forEach(([row, col], i) => {
      const bit = 1 << digits[i];
      rowUsed[row] ^= bit;
      colUsed[col] ^= bit;
      grid[row][col] = on ? digits[i] : 0;
    });
  };

  function search() {
    if (solutions.length >= limit) return;

    let best = -1;
    let bestOptions: number[][] = [];
    for (let i = 0; i < cages.length; i++) {
      if (filled[i]) continue;
      const options = domains[i].filter((digits) => fits(cages[i], digits));
      if (best === -1 || options.length < bestOptions.length) {
        best = i;
        bestOptions = options;
        if (options.length <= 1) break;
      }
    }

    if (best === -1) {
      solutions.push(grid.map((row) => [...row]));
      return;
    }

    filled[best] = true;
    for (const digits of bestOptions) {
      place(cages[best], digits, true);
      search();
      place(cages[best], digits, false);
      if (solutions.length >= limit) break;
    }
    filled[best] = false;
  }

  search();
  return solutions;
}

export function hasUniqueSolution(puzzle: Pick<CalcudokuPuzzle, "size" | "cages">): boolean {
  return findSolutions(puzzle, 2).length === 1;
}

// ── Generator ───────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 500;

/** One candidate puzzle, unique or not. */
export function generateCandidate(difficulty: Difficulty, random: Random): CalcudokuPuzzle {
  const size = SIZE_FOR_DIFFICULTY[difficulty];
  const settings = SETTINGS[difficulty];
  const solution = generateLatinSquare(size, random);
  const cages = partitionCells(size, settings, random).map((indices): Cage => {
    const cells = indices.map((i): [number, number] => [Math.floor(i / size), i % size]);
    const [operation, target] = chooseOperation(
      cells.map(([row, col]) => solution[row][col]),
      settings,
      random
    );
    return { cells, operation, target };
  });
  return { size, cages, solution };
}

/** A puzzle with exactly one solution. Keeps drawing candidates until one is unique. */
export function generate(difficulty: Difficulty, random: Random = Math.random): CalcudokuPuzzle {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const puzzle = generateCandidate(difficulty, random);
    if (hasUniqueSolution(puzzle)) return puzzle;
  }
  throw new Error(`No unique ${difficulty} Calcudoku after ${MAX_ATTEMPTS} attempts`);
}

// ── Board ───────────────────────────────────────────────────────────────────

export function isGivenCell(puzzle: CalcudokuPuzzle, row: number, col: number): boolean {
  return puzzle.cages.some(
    (cage) => cage.operation === "given" && cage.cells[0][0] === row && cage.cells[0][1] === col
  );
}

/** A fresh board: givens filled in, every other cell empty, no notes. */
export function createBoard(puzzle: CalcudokuPuzzle): CalcudokuBoard {
  const values: Grid = Array.from({ length: puzzle.size }, () =>
    Array<Cell>(puzzle.size).fill(null)
  );
  for (const cage of puzzle.cages) {
    if (cage.operation === "given") values[cage.cells[0][0]][cage.cells[0][1]] = cage.target;
  }
  const notes: Notes = Array.from({ length: puzzle.size }, () =>
    Array.from({ length: puzzle.size }, () => [])
  );
  return { values, notes };
}

function cloneBoard(board: CalcudokuBoard): CalcudokuBoard {
  return {
    values: board.values.map((row) => [...row]),
    notes: board.notes.map((row) => row.map((cell) => [...cell])),
  };
}

function isEditable(puzzle: CalcudokuPuzzle, row: number, col: number, value: Cell): boolean {
  const inGrid = row >= 0 && row < puzzle.size && col >= 0 && col < puzzle.size;
  const validValue =
    value === null || (Number.isInteger(value) && value >= 1 && value <= puzzle.size);
  return inGrid && validValue && !isGivenCell(puzzle, row, col);
}

/**
 * Writes a digit, or clears the cell with null. A digit replaces the cell's notes. Any digit is
 * allowed, even a wrong one: mistakes show as conflicts, never end the game. Givens stay put.
 */
export function setCellValue(
  puzzle: CalcudokuPuzzle,
  board: CalcudokuBoard,
  row: number,
  col: number,
  value: Cell
): CalcudokuBoard {
  if (!isEditable(puzzle, row, col, value)) return board;
  const next = cloneBoard(board);
  next.values[row][col] = value;
  if (value !== null) next.notes[row][col] = [];
  return next;
}

/** Adds the note if absent, removes it if present. Cells holding a digit take no notes. */
export function toggleNote(
  puzzle: CalcudokuPuzzle,
  board: CalcudokuBoard,
  row: number,
  col: number,
  digit: number
): CalcudokuBoard {
  if (!isEditable(puzzle, row, col, digit) || board.values[row][col] !== null) return board;
  const next = cloneBoard(board);
  const notes = next.notes[row][col];
  next.notes[row][col] = notes.includes(digit)
    ? notes.filter((note) => note !== digit)
    : [...notes, digit].sort((a, b) => a - b);
  return next;
}

/** Empties the cell: its digit and its notes. */
export function clearCell(
  puzzle: CalcudokuPuzzle,
  board: CalcudokuBoard,
  row: number,
  col: number
): CalcudokuBoard {
  if (!isEditable(puzzle, row, col, null)) return board;
  const next = cloneBoard(board);
  next.values[row][col] = null;
  next.notes[row][col] = [];
  return next;
}

/** "row,col" keys of every cell whose digit repeats in its row or column. */
export function getConflictingCells(values: Grid): Set<string> {
  const conflicted = new Set<string>();
  const size = values.length;

  for (let i = 0; i < size; i++) {
    const inRow = new Map<number, number[]>();
    const inCol = new Map<number, number[]>();
    for (let j = 0; j < size; j++) {
      const across = values[i][j];
      const down = values[j][i];
      if (across !== null) inRow.set(across, [...(inRow.get(across) ?? []), j]);
      if (down !== null) inCol.set(down, [...(inCol.get(down) ?? []), j]);
    }
    for (const cols of inRow.values()) {
      if (cols.length > 1) for (const col of cols) conflicted.add(`${i},${col}`);
    }
    for (const rows of inCol.values()) {
      if (rows.length > 1) for (const row of rows) conflicted.add(`${row},${i}`);
    }
  }

  return conflicted;
}

/** Won when every cell is filled, no row or column repeats, and every cage is satisfied. */
export function isSolved(puzzle: CalcudokuPuzzle, values: Grid): boolean {
  if (values.length !== puzzle.size) return false;
  if (values.some((row) => row.length !== puzzle.size || row.some((cell) => cell === null))) {
    return false;
  }
  return (
    isLatinSquare(values as number[][], puzzle.size) &&
    puzzle.cages.every((cage) => getCageStatus(cage, values) === "satisfied")
  );
}
