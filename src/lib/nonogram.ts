/**
 * Nonogram engine: puzzle generator, line solver, clues, marks and win check.
 *
 * Every generated puzzle can be solved by line logic alone: looking at one row or column at a
 * time and marking only what its clue forces. A puzzle that line logic solves completely has
 * exactly one solution, so no guessing is ever needed.
 */

import { type Random, randomInt } from "./random";

export type NonogramSize = 5 | 10 | 15;

export const NONOGRAM_SIZES: readonly NonogramSize[] = [5, 10, 15];

/** How each size is offered in settings. */
export const NONOGRAM_SIZE_LABELS: Record<NonogramSize, string> = {
  5: "Easy",
  10: "Medium",
  15: "Hard",
};

export function isNonogramSize(value: unknown): value is NonogramSize {
  return value === 5 || value === 10 || value === 15;
}

/** The picture: true where a cell is filled. */
export type Solution = boolean[][];
export type Clue = number[];

export interface NonogramPuzzle {
  size: NonogramSize;
  solution: Solution;
  rowClues: Clue[];
  colClues: Clue[];
}

export type CellMark = "empty" | "filled" | "crossed";
export type Marks = CellMark[][];

// ── Clues ───────────────────────────────────────────────────────────────────

/** The run lengths of filled cells in a line. An empty line has no runs: []. */
export function lineClue(line: readonly boolean[]): Clue {
  const clue: Clue = [];
  let run = 0;
  for (const filled of line) {
    if (filled) {
      run++;
    } else if (run > 0) {
      clue.push(run);
      run = 0;
    }
  }
  if (run > 0) clue.push(run);
  return clue;
}

export function column<T>(grid: readonly (readonly T[])[], col: number): T[] {
  return grid.map((row) => row[col]);
}

export function deriveClues(solution: Solution): { rowClues: Clue[]; colClues: Clue[] } {
  const size = solution.length;
  return {
    rowClues: solution.map(lineClue),
    colClues: Array.from({ length: size }, (_, col) => lineClue(column(solution, col))),
  };
}

function sameClue(a: Clue, b: Clue): boolean {
  return a.length === b.length && a.every((run, i) => run === b[i]);
}

// ── Line solver ─────────────────────────────────────────────────────────────

/** What is known about a cell while solving. */
export const UNKNOWN = -1;
export const EMPTY = 0;
export const FILLED = 1;
export type Knowledge = typeof UNKNOWN | typeof EMPTY | typeof FILLED;

/**
 * Marks every cell of one line that its clue forces, given what is already known. Returns the
 * new knowledge, or null when no placement of the clue fits the line.
 */
export function solveLine(clue: Clue, line: readonly Knowledge[]): Knowledge[] | null {
  const n = line.length;
  const k = clue.length;

  const blockFits = (start: number, length: number) => {
    if (start + length > n) return false;
    for (let i = start; i < start + length; i++) if (line[i] === EMPTY) return false;
    return start + length === n || line[start + length] !== FILLED;
  };

  // fits[j][i]: runs j.. can be placed in cells i.., where cell i may start a run.
  const fits = Array.from({ length: k + 1 }, () => new Array<boolean>(n + 2).fill(false));
  fits[k][n] = true;
  fits[k][n + 1] = true;
  for (let i = n - 1; i >= 0; i--) fits[k][i] = line[i] !== FILLED && fits[k][i + 1];
  for (let j = k - 1; j >= 0; j--) {
    for (let i = n - 1; i >= 0; i--) {
      const skip = line[i] !== FILLED && fits[j][i + 1];
      const place = blockFits(i, clue[j]) && fits[j + 1][i + clue[j] + 1];
      fits[j][i] = skip || place;
    }
  }
  if (!fits[0][0]) return null;

  const canFill = new Array<boolean>(n).fill(false);
  const canEmpty = new Array<boolean>(n).fill(false);
  const reached = Array.from({ length: k + 1 }, () => new Array<boolean>(n + 2).fill(false));
  reached[0][0] = true;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= k; j++) {
      if (!reached[j][i]) continue;
      if (line[i] !== FILLED && fits[j][i + 1]) {
        canEmpty[i] = true;
        reached[j][i + 1] = true;
      }
      if (j < k && blockFits(i, clue[j]) && fits[j + 1][i + clue[j] + 1]) {
        const end = i + clue[j];
        for (let c = i; c < end; c++) canFill[c] = true;
        if (end < n) canEmpty[end] = true;
        reached[j + 1][Math.min(end + 1, n)] = true;
      }
    }
  }

  return line.map((_, i) => (canFill[i] ? (canEmpty[i] ? UNKNOWN : FILLED) : EMPTY));
}

export type LineSolveResult =
  | { status: "solved"; grid: Knowledge[][] }
  | { status: "stuck"; grid: Knowledge[][] }
  | { status: "contradiction" };

/**
 * Solves by line logic alone: repeats solveLine over rows and columns until nothing changes.
 * "stuck" means line logic cannot finish the grid; a guess would be needed.
 */
export function solveByLines(
  rowClues: readonly Clue[],
  colClues: readonly Clue[],
  start?: Knowledge[][]
): LineSolveResult {
  const rows = rowClues.length;
  const cols = colClues.length;
  const grid: Knowledge[][] =
    start?.map((row) => [...row]) ??
    Array.from({ length: rows }, () => new Array<Knowledge>(cols).fill(UNKNOWN));

  const dirtyRows = new Array<boolean>(rows).fill(true);
  const dirtyCols = new Array<boolean>(cols).fill(true);
  let changed = true;

  while (changed) {
    changed = false;
    for (let r = 0; r < rows; r++) {
      if (!dirtyRows[r]) continue;
      dirtyRows[r] = false;
      const next = solveLine(rowClues[r], grid[r]);
      if (!next) return { status: "contradiction" };
      for (let c = 0; c < cols; c++) {
        if (next[c] !== grid[r][c]) {
          grid[r][c] = next[c];
          dirtyCols[c] = true;
          changed = true;
        }
      }
    }
    for (let c = 0; c < cols; c++) {
      if (!dirtyCols[c]) continue;
      dirtyCols[c] = false;
      const next = solveLine(colClues[c], column(grid, c));
      if (!next) return { status: "contradiction" };
      for (let r = 0; r < rows; r++) {
        if (next[r] !== grid[r][c]) {
          grid[r][c] = next[r];
          dirtyRows[r] = true;
          changed = true;
        }
      }
    }
  }

  const solved = grid.every((row) => row.every((cell) => cell !== UNKNOWN));
  return { status: solved ? "solved" : "stuck", grid };
}

/**
 * Counts solutions up to `limit` by line logic plus guessing. Independent of the generator's
 * check, so tests can confirm a puzzle has exactly one solution.
 */
export function countSolutions(
  rowClues: readonly Clue[],
  colClues: readonly Clue[],
  limit = 2
): number {
  const search = (start?: Knowledge[][]): number => {
    const result = solveByLines(rowClues, colClues, start);
    if (result.status === "contradiction") return 0;
    if (result.status === "solved") return 1;

    const { grid } = result;
    const r = grid.findIndex((row) => row.includes(UNKNOWN));
    const c = grid[r].indexOf(UNKNOWN);
    let found = 0;
    for (const guess of [FILLED, EMPTY] as const) {
      const next = grid.map((row) => [...row]);
      next[r][c] = guess;
      found += search(next);
      if (found >= limit) break;
    }
    return found;
  };
  return Math.min(search(), limit);
}

// ── Generator ───────────────────────────────────────────────────────────────

/** Share of cells filled in a fresh picture. */
const FILL_DENSITY = { min: 0.5, max: 0.62 };
/** Share of cells a finished puzzle may have filled, after flips. */
export const ACCEPTED_DENSITY = { min: 0.45, max: 0.7 };
/** Cells flipped toward a line-solvable picture before starting over with a new one. */
const MAX_ADJUSTMENTS = 40;

function randomSolution(size: number, random: Random): Solution {
  const density = FILL_DENSITY.min + random() * (FILL_DENSITY.max - FILL_DENSITY.min);
  return Array.from({ length: size }, () => Array.from({ length: size }, () => random() < density));
}

function hasBlankLine(solution: Solution): boolean {
  const size = solution.length;
  return (
    solution.some((row) => row.every((cell) => !cell)) ||
    Array.from({ length: size }, (_, c) => c).some((c) => solution.every((row) => !row[c]))
  );
}

/**
 * A new puzzle with one solution that line logic alone can reach.
 *
 * Starts from a random picture. While line logic gets stuck, it flips one of the cells it could
 * not decide, which changes the clues, and tries again; after too many flips it starts over.
 */
export function generatePuzzle(size: NonogramSize, random: Random = Math.random): NonogramPuzzle {
  for (;;) {
    const solution = randomSolution(size, random);
    for (let attempt = 0; attempt <= MAX_ADJUSTMENTS; attempt++) {
      const { rowClues, colClues } = deriveClues(solution);
      const result = solveByLines(rowClues, colClues);
      if (result.status === "solved") {
        const density = fillRatio(solution);
        if (density < ACCEPTED_DENSITY.min || density > ACCEPTED_DENSITY.max) break;
        if (hasBlankLine(solution)) break;
        return { size, solution, rowClues, colClues };
      }
      if (result.status === "contradiction") break;

      const unknown: [number, number][] = [];
      result.grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell === UNKNOWN) unknown.push([r, c]);
        });
      });
      const [r, c] = unknown[randomInt(random, unknown.length)];
      solution[r][c] = !solution[r][c];
    }
  }
}

export function puzzleFromSolution(solution: Solution): NonogramPuzzle {
  const size = solution.length;
  if (!isNonogramSize(size) || solution.some((row) => row.length !== size)) {
    throw new Error(`Unsupported nonogram size: ${size}`);
  }
  return { size, solution, ...deriveClues(solution) };
}

export function fillRatio(solution: Solution): number {
  const cells = solution.flat();
  return cells.filter(Boolean).length / cells.length;
}

// ── Marks ───────────────────────────────────────────────────────────────────

export function createEmptyMarks(size: number): Marks {
  return Array.from({ length: size }, () => new Array<CellMark>(size).fill("empty"));
}

/** Sets one cell: fill, cross, or clear with "empty". */
export function setMark(marks: Marks, row: number, col: number, mark: CellMark): Marks {
  if (marks[row]?.[col] === undefined || marks[row][col] === mark) return marks;
  return marks.map((cells, r) =>
    r === row ? cells.map((cell, c) => (c === col ? mark : cell)) : cells
  );
}

/**
 * One tap or drag. A stroke that starts on a cell already holding its mark erases that mark;
 * otherwise it paints the mark on empty cells. Either way it never overwrites the other mark.
 */
export interface Stroke {
  mark: "filled" | "crossed";
  erase: boolean;
}

export function startStroke(marks: Marks, row: number, col: number, mark: Stroke["mark"]): Stroke {
  return { mark, erase: marks[row]?.[col] === mark };
}

/** The cells from `from` toward `to`, kept to the row or column the drag mostly follows. */
export function strokeCells(from: [number, number], to: [number, number]): [number, number][] {
  const [fromRow, fromCol] = from;
  const horizontal = Math.abs(to[1] - fromCol) >= Math.abs(to[0] - fromRow);
  const end = horizontal ? to[1] : to[0];
  const begin = horizontal ? fromCol : fromRow;
  const step = end >= begin ? 1 : -1;
  const cells: [number, number][] = [];
  for (let i = begin; i !== end + step; i += step) {
    cells.push(horizontal ? [fromRow, i] : [i, fromCol]);
  }
  return cells;
}

export function applyStroke(
  marks: Marks,
  from: [number, number],
  to: [number, number],
  stroke: Stroke
): Marks {
  const target: CellMark = stroke.erase ? stroke.mark : "empty";
  const result: CellMark = stroke.erase ? "empty" : stroke.mark;
  const next = marks.map((row) => [...row]);
  let changed = false;
  for (const [r, c] of strokeCells(from, to)) {
    if (next[r]?.[c] === target) {
      next[r][c] = result;
      changed = true;
    }
  }
  return changed ? next : marks;
}

// ── Progress ────────────────────────────────────────────────────────────────

function marksClue(line: readonly CellMark[]): Clue {
  return lineClue(line.map((mark) => mark === "filled"));
}

/** Which clues the filled cells currently match, so finished clues can be dimmed. */
export function satisfiedClues(
  puzzle: NonogramPuzzle,
  marks: Marks
): { rows: boolean[]; cols: boolean[] } {
  return {
    rows: puzzle.rowClues.map((clue, r) => sameClue(clue, marksClue(marks[r]))),
    cols: puzzle.colClues.map((clue, c) => sameClue(clue, marksClue(column(marks, c)))),
  };
}

/**
 * Won when every row and column clue is matched. Crosses are only notes; a cell counts as
 * filled or not. The solution is unique, so matching every clue means matching the picture.
 */
export function isSolved(puzzle: NonogramPuzzle, marks: Marks): boolean {
  const { rows, cols } = satisfiedClues(puzzle, marks);
  return rows.every(Boolean) && cols.every(Boolean);
}
