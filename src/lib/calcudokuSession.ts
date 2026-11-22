import {
  type CalcudokuPuzzle,
  type Cell,
  type Difficulty,
  evaluateCage,
  isLatinSquare,
  type Notes,
  type Operation,
  SIZE_FOR_DIFFICULTY,
} from "./calcudoku";
import { isSaveHeader, type SaveHeader } from "./gameSave";
import { isCellInGrid, isRecord } from "./storage";

/** Mistakes never end a game, so a save is only ever playing or won. */
export interface PersistedCalcudokuSession extends SaveHeader {
  status: "playing" | "won";
  difficulty: Difficulty;
  puzzle: CalcudokuPuzzle;
  values: Cell[][];
  notes: Notes;
  selectedCell: [number, number] | null;
  notesMode: boolean;
  hasStartedFilling: boolean;
}

const OPERATIONS: readonly Operation[] = ["given", "add", "subtract", "multiply", "divide"];

function isDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function isDigit(value: unknown, size: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= size;
}

function isSquare<T>(value: unknown, size: number, isItem: (item: unknown) => item is T) {
  return (
    Array.isArray(value) &&
    value.length === size &&
    value.every((row) => Array.isArray(row) && row.length === size && row.every(isItem))
  );
}

function hasCellCount(operation: Operation, count: number): boolean {
  if (operation === "given") return count === 1;
  if (operation === "subtract" || operation === "divide") return count === 2;
  return count >= 2;
}

/** The cages cover every cell exactly once, and the stored solution meets every cage. */
function isPuzzle(value: unknown, size: number): value is CalcudokuPuzzle {
  if (!isRecord(value) || value.size !== size || !Array.isArray(value.cages)) return false;
  if (!isSquare(value.solution, size, (d): d is number => isDigit(d, size))) return false;
  const solution = value.solution as number[][];
  if (!isLatinSquare(solution, size)) return false;

  const covered = new Set<string>();
  for (const cage of value.cages) {
    if (!isRecord(cage) || !Array.isArray(cage.cells)) return false;
    const operation = cage.operation as Operation;
    if (!OPERATIONS.includes(operation) || !hasCellCount(operation, cage.cells.length)) {
      return false;
    }
    if (!Number.isInteger(cage.target) || (cage.target as number) < 1) return false;
    for (const cell of cage.cells) {
      if (!isCellInGrid(cell, size, size)) return false;
      const key = `${cell[0]},${cell[1]}`;
      if (covered.has(key)) return false;
      covered.add(key);
    }
    const digits = (cage.cells as [number, number][]).map(([row, col]) => solution[row][col]);
    if (!evaluateCage(operation, cage.target as number, digits)) return false;
  }
  return covered.size === size * size;
}

export function isPersistedCalcudokuSession(value: unknown): value is PersistedCalcudokuSession {
  if (!isRecord(value) || !isSaveHeader(value)) return false;
  if (value.status === "lost" || !isDifficulty(value.difficulty)) return false;
  const size = SIZE_FOR_DIFFICULTY[value.difficulty];

  return (
    isPuzzle(value.puzzle, size) &&
    isSquare(value.values, size, (cell): cell is Cell => cell === null || isDigit(cell, size)) &&
    isSquare(
      value.notes,
      size,
      (notes): notes is number[] =>
        Array.isArray(notes) && notes.every((note) => isDigit(note, size))
    ) &&
    (value.selectedCell === null || isCellInGrid(value.selectedCell, size, size)) &&
    typeof value.notesMode === "boolean" &&
    typeof value.hasStartedFilling === "boolean"
  );
}
