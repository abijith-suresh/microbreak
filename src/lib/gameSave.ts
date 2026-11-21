/**
 * The part of a saved game every game shares, so any screen can tell from a save whether the
 * game is in progress or finished, how long it took, and whether it set a personal best.
 * Each game's save (sudokuSession.ts and the others) adds its own board to this header.
 */

export type SaveStatus = "playing" | "won" | "lost";

export interface SaveHeader {
  status: SaveStatus;
  timerSeconds: number;
  /** True when this game, once won, beat the stored personal best. */
  newBest: boolean;
}

export function isSaveStatus(value: unknown): value is SaveStatus {
  return value === "playing" || value === "won" || value === "lost";
}

export function isSaveHeader(value: Record<string, unknown>): boolean {
  return (
    isSaveStatus(value.status) &&
    typeof value.timerSeconds === "number" &&
    Number.isFinite(value.timerSeconds) &&
    value.timerSeconds >= 0 &&
    typeof value.newBest === "boolean"
  );
}
