import { isSaveHeader, type SaveHeader } from "./gameSave";
import type { Board, CellData, Difficulty } from "./minesweeper";
import { isCellInGrid, isRecord } from "./storage";

export interface PersistedMinesweeperSession extends SaveHeader {
  difficulty: Difficulty;
  board: Board;
  rows: number;
  cols: number;
  mineCount: number;
  selectedCell: [number, number] | null;
  digMode: boolean;
  hasStartedPlaying: boolean;
  boardGenerated: boolean;
  /** The mine that ended a lost game. Missing from saves written before finished games were kept. */
  triggeredMine?: [number, number] | null;
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
  if (!isSaveHeader(value)) return false;
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
    (value.selectedCell === null || isCellInGrid(value.selectedCell, value.rows, value.cols)) &&
    typeof value.digMode === "boolean" &&
    typeof value.hasStartedPlaying === "boolean" &&
    typeof value.boardGenerated === "boolean" &&
    (value.triggeredMine === undefined ||
      value.triggeredMine === null ||
      isCellInGrid(value.triggeredMine, value.rows, value.cols))
  );
}
