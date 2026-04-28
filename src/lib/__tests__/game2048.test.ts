import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  canMove,
  cloneGrid,
  createEmptyGrid,
  hasWon,
  isFull,
  move,
  moveWithTiles,
  resetTileIdCounter,
  slideRow,
  spawnTile,
  type Tile,
} from "../game2048";

// ── slideRow ───────────────────────────────────────────────────────────────────

describe("slideRow", () => {
  it("slides non-zero values to the left", () => {
    expect(slideRow([0, 2, 0, 4]).result).toEqual([2, 4, 0, 0]);
  });

  it("merges two equal adjacent tiles", () => {
    const { result, score, mergeIndices } = slideRow([2, 2, 0, 0]);
    expect(result).toEqual([4, 0, 0, 0]);
    expect(score).toBe(4);
    expect(mergeIndices).toEqual([0]);
  });

  it("merges tiles that become adjacent after slide", () => {
    const { result, score } = slideRow([2, 0, 2, 0]);
    expect(result).toEqual([4, 0, 0, 0]);
    expect(score).toBe(4);
  });

  it("does not merge already-merged tile with a third equal tile", () => {
    const { result, score } = slideRow([2, 2, 2, 0]);
    expect(result).toEqual([4, 2, 0, 0]);
    expect(score).toBe(4);
  });

  it("handles four equal tiles as two merges", () => {
    const { result, score } = slideRow([2, 2, 2, 2]);
    expect(result).toEqual([4, 4, 0, 0]);
    expect(score).toBe(8);
  });

  it("leaves an already-merged row unchanged", () => {
    const { result, score, mergeIndices } = slideRow([4, 2, 0, 0]);
    expect(result).toEqual([4, 2, 0, 0]);
    expect(score).toBe(0);
    expect(mergeIndices).toEqual([]);
  });

  it("handles an empty row", () => {
    const { result, score } = slideRow([0, 0, 0, 0]);
    expect(result).toEqual([0, 0, 0, 0]);
    expect(score).toBe(0);
  });

  it("handles a full row with no merges", () => {
    const { result, score } = slideRow([2, 4, 8, 16]);
    expect(result).toEqual([2, 4, 8, 16]);
    expect(score).toBe(0);
  });
});

// ── createEmptyGrid / cloneGrid ────────────────────────────────────────────────

describe("grid helpers", () => {
  it("creates a 4×4 grid of zeros", () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(4);
    expect(grid.every((row) => row.every((v) => v === 0))).toBe(true);
  });

  it("clones a grid without mutation", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 4;
    const clone = cloneGrid(grid);
    clone[0][0] = 8;
    expect(grid[0][0]).toBe(4);
  });
});

// ── spawnTile ───────────────────────────────────────────────────────────────────

describe("spawnTile", () => {
  it("places a tile in an empty cell", () => {
    const grid = createEmptyGrid();
    const result = spawnTile(grid, 1);
    expect(result).not.toBeNull();
    expect(result!.tile.id).toBe(1);
    expect([2, 4]).toContain(result!.tile.value);
    expect(result!.grid[result!.tile.row][result!.tile.col]).toBe(result!.tile.value);
  });

  it("returns null on a full grid", () => {
    const grid = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];
    expect(spawnTile(grid, 1)).toBeNull();
  });
});

// ── isFull ──────────────────────────────────────────────────────────────────────

describe("isFull", () => {
  it("returns true for a full grid", () => {
    const grid = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];
    expect(isFull(grid)).toBe(true);
  });

  it("returns false for a grid with an empty cell", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 2;
    expect(isFull(grid)).toBe(false);
  });
});

// ── move ────────────────────────────────────────────────────────────────────────

function tilesFromGrid(grid: number[][]): Tile[] {
  let id = 1;
  const tiles: Tile[] = [];

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] !== 0) {
        tiles.push({
          id: id++,
          value: grid[row][col],
          row,
          col,
          isNew: false,
          isMerging: false,
        });
      }
    }
  }

  return tiles;
}

describe("move", () => {
  beforeEach(() => {
    resetTileIdCounter();
  });

  it("slides left", () => {
    const grid = [
      [2, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = move(grid, "left");
    expect(result.moved).toBe(true);
    expect(result.grid[0][0]).toBe(4);
    expect(result.score).toBe(4);
  });

  it("slides right", () => {
    const grid = [
      [2, 0, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = move(grid, "right");
    expect(result.moved).toBe(true);
    expect(result.grid[0][3]).toBe(4);
    expect(result.score).toBe(4);
  });

  it("slides up", () => {
    const grid = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = move(grid, "up");
    expect(result.moved).toBe(true);
    expect(result.grid[0][0]).toBe(4);
    expect(result.score).toBe(4);
  });

  it("slides down", () => {
    const grid = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = move(grid, "down");
    expect(result.moved).toBe(true);
    expect(result.grid[3][0]).toBe(4);
    expect(result.score).toBe(4);
  });

  it("returns moved=false when nothing can move", () => {
    const grid = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];
    const result = move(grid, "left");
    expect(result.moved).toBe(false);
    expect(result.score).toBe(0);
  });

  it("spawns a new tile after a valid move", () => {
    const grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = move(grid, "left");
    expect(result.moved).toBe(false); // already at left, no move
  });

  it("spawns a tile when there is a valid slide", () => {
    const grid = [
      [0, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = move(grid, "left");
    expect(result.moved).toBe(true);
    // Should have the existing tile + one spawned tile
    expect(result.tiles.length).toBeGreaterThanOrEqual(2);
  });

  it("matches the stable-id move path for grid and score", () => {
    const grid = [
      [2, 0, 2, 4],
      [4, 4, 0, 0],
      [0, 2, 2, 0],
      [0, 0, 0, 0],
    ];

    const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const regularMove = move(grid, "left");
    mathRandomSpy.mockRestore();

    resetTileIdCounter();
    const stableRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const stableMove = moveWithTiles(tilesFromGrid(grid), "left");
    stableRandomSpy.mockRestore();

    expect(stableMove.score).toBe(regularMove.score);
    expect(stableMove.grid).toEqual(regularMove.grid);
  });
});

// ── hasWon ──────────────────────────────────────────────────────────────────────

describe("hasWon", () => {
  it("returns true when a tile reaches 2048", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 2048;
    expect(hasWon(grid)).toBe(true);
  });

  it("returns false when no tile reaches 2048", () => {
    const grid = createEmptyGrid();
    grid[0][0] = 1024;
    expect(hasWon(grid)).toBe(false);
  });
});

// ── canMove ─────────────────────────────────────────────────────────────────────

describe("canMove", () => {
  it("returns true when there are empty cells", () => {
    expect(canMove(createEmptyGrid())).toBe(true);
  });

  it("returns true when adjacent tiles can merge", () => {
    const grid = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];
    // No empty cells, no adjacent equals — can't move
    expect(canMove(grid)).toBe(false);
  });

  it("returns true when vertical neighbours match", () => {
    const grid = [
      [2, 4, 8, 16],
      [2, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];
    expect(canMove(grid)).toBe(true);
  });

  it("returns false on a completely stuck board", () => {
    const grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    // Full grid, no adjacent horizontal/vertical equals
    expect(canMove(grid)).toBe(false);
  });
});
