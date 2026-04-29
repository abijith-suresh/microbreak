import type { Board, Difficulty, GridSize } from "./sudoku";
import { isRecord, isTuple2 } from "./storage";

export interface PersistedSudokuSession {
  phase: "playing";
  gridSize: GridSize;
  difficulty: Difficulty;
  puzzle: Board;
  solution: Board;
  userBoard: Board;
  timerSeconds: number;
  selectedCell: [number, number] | null;
  hasStartedFilling: boolean;
}

function isSudokuCell(value: unknown): boolean {
  return value === null || typeof value === "number";
}

function isSudokuBoard(value: unknown, size: GridSize): value is Board {
  return (
    Array.isArray(value) &&
    value.length === size &&
    value.every((row) => Array.isArray(row) && row.length === size && row.every(isSudokuCell))
  );
}

export function isPersistedSudokuSession(value: unknown): value is PersistedSudokuSession {
  if (!isRecord(value)) return false;
  if (value.phase !== "playing") return false;
  if (value.gridSize !== 4 && value.gridSize !== 6 && value.gridSize !== 9) return false;
  if (value.difficulty !== "easy" && value.difficulty !== "medium" && value.difficulty !== "hard") {
    return false;
  }

  return (
    isSudokuBoard(value.puzzle, value.gridSize) &&
    isSudokuBoard(value.solution, value.gridSize) &&
    isSudokuBoard(value.userBoard, value.gridSize) &&
    typeof value.timerSeconds === "number" &&
    (value.selectedCell === null || isTuple2(value.selectedCell)) &&
    typeof value.hasStartedFilling === "boolean"
  );
}
