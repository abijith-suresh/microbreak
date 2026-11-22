import { isSaveHeader, type SaveHeader } from "./gameSave";
import { type CellMark, isNonogramSize, type Marks, type NonogramSize } from "./nonogram";
import { isCellInGrid, isRecord } from "./storage";

/**
 * A saved Nonograms game. The clues are not stored: they come from the solution. A nonogram
 * cannot be lost, so a save is only ever "playing" or "won".
 */
export interface PersistedNonogramSession extends SaveHeader {
  status: "playing" | "won";
  size: NonogramSize;
  /** The picture, one string per row: "1" filled, "0" empty. */
  solution: string[];
  marks: Marks;
  /** What a tap or drag marks. */
  mode: "fill" | "cross";
  selectedCell: [number, number] | null;
  hasStartedPlaying: boolean;
}

function isCellMark(value: unknown): value is CellMark {
  return value === "empty" || value === "filled" || value === "crossed";
}

function isSolutionRows(value: unknown, size: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length === size &&
    value.every((row) => typeof row === "string" && row.length === size && /^[01]+$/.test(row))
  );
}

function isMarks(value: unknown, size: number): value is Marks {
  return (
    Array.isArray(value) &&
    value.length === size &&
    value.every((row) => Array.isArray(row) && row.length === size && row.every(isCellMark))
  );
}

export function isPersistedNonogramSession(value: unknown): value is PersistedNonogramSession {
  if (!isRecord(value)) return false;
  if (!isSaveHeader(value) || value.status === "lost") return false;
  if (!isNonogramSize(value.size)) return false;

  return (
    isSolutionRows(value.solution, value.size) &&
    isMarks(value.marks, value.size) &&
    (value.mode === "fill" || value.mode === "cross") &&
    (value.selectedCell === null || isCellInGrid(value.selectedCell, value.size, value.size)) &&
    typeof value.hasStartedPlaying === "boolean"
  );
}

export function encodeSolution(solution: readonly (readonly boolean[])[]): string[] {
  return solution.map((row) => row.map((filled) => (filled ? "1" : "0")).join(""));
}

export function decodeSolution(rows: readonly string[]): boolean[][] {
  return rows.map((row) => [...row].map((cell) => cell === "1"));
}
