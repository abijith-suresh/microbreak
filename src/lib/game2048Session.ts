import type { Grid, Tile } from "./game2048";
import { isRecord } from "./storage";

export interface Persisted2048Session {
  phase: "playing";
  grid: Grid;
  tiles: Tile[];
  score: number;
  timerSeconds: number;
  hasShownWin: boolean;
  gameOver: boolean;
  hasWonOnce: boolean;
  hasStartedPlaying: boolean;
  nextTileId: number;
}

function isGrid(value: unknown): value is Grid {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every(
      (row) =>
        Array.isArray(row) && row.length === 4 && row.every((cell) => typeof cell === "number")
    )
  );
}

function isTile(value: unknown): value is Tile {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.value === "number" &&
    typeof value.row === "number" &&
    typeof value.col === "number" &&
    typeof value.isNew === "boolean" &&
    typeof value.isMerging === "boolean"
  );
}

export function isPersisted2048Session(value: unknown): value is Persisted2048Session {
  return (
    isRecord(value) &&
    value.phase === "playing" &&
    isGrid(value.grid) &&
    Array.isArray(value.tiles) &&
    value.tiles.every(isTile) &&
    typeof value.score === "number" &&
    typeof value.timerSeconds === "number" &&
    typeof value.hasShownWin === "boolean" &&
    typeof value.gameOver === "boolean" &&
    typeof value.hasWonOnce === "boolean" &&
    typeof value.hasStartedPlaying === "boolean" &&
    typeof value.nextTileId === "number"
  );
}

export function getNextTileIdSeed(tiles: Tile[]): number {
  return tiles.reduce((maxId, tile) => Math.max(maxId, tile.id), 0) + 1;
}
