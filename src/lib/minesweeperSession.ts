import type { Board, CellData, Difficulty } from "./minesweeper";
import { isRecord, isTuple2 } from "./storage";

export interface PersistedMinesweeperSession {
  phase: "playing";
  difficulty: Difficulty;
  board: Board;
  rows: number;
  cols: number;
  mineCount: number;
  timerSeconds: number;
  selectedCell: [number, number] | null;
  digMode: boolean;
  hasStartedPlaying: boolean;
  boardGenerated: boolean;
}

function isCellState(value: unknown): value is CellData["state"] {
  return value === "hidden" || value === "revealed" || value === "flagged";
}

function isMinesweeperCell(value: unknown): value is CellData {
  return (
    isRecord(value) &&
    isCellState(value.state) &&
    typeof value.value === "number" &&
    typeof value.isMine === "boolean"
  );
}

function isBoard(value: unknown, rows: number, cols: number): value is Board {
  return (
    Array.isArray(value) &&
    value.length === rows &&
    value.every((row) => Array.isArray(row) && row.length === cols && row.every(isMinesweeperCell))
  );
}

export function isPersistedMinesweeperSession(
  value: unknown
): value is PersistedMinesweeperSession {
  if (!isRecord(value)) return false;
  if (value.phase !== "playing") return false;
  if (
    value.difficulty !== "beginner" &&
    value.difficulty !== "intermediate" &&
    value.difficulty !== "expert"
  ) {
    return false;
  }
  if (
    typeof value.rows !== "number" ||
    typeof value.cols !== "number" ||
    typeof value.mineCount !== "number"
  ) {
    return false;
  }

  return (
    isBoard(value.board, value.rows, value.cols) &&
    typeof value.timerSeconds === "number" &&
    (value.selectedCell === null || isTuple2(value.selectedCell)) &&
    typeof value.digMode === "boolean" &&
    typeof value.hasStartedPlaying === "boolean" &&
    typeof value.boardGenerated === "boolean"
  );
}
