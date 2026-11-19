import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  canMove,
  cloneGrid,
  createEmptyGrid,
  hasWon,
  isFull,
  moveWithTiles,
  resetTileIdCounter,
  spawnTile,
  type Tile,
} from "../game2048";

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
    expect(result?.tile.id).toBe(1);
    expect([2, 4]).toContain(result?.tile.value);
    expect(result?.grid[result?.tile.row][result?.tile.col]).toBe(result?.tile.value);
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

// ── moveWithTiles ──────────────────────────────────────────────────────────────

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

/** Slide a single row left and return the row without the spawned tile. */
function slideLeft(row: number[]) {
  const grid = [row, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  const result = moveWithTiles(tilesFromGrid(grid), "left");
  const spawn = result.tiles.find((t) => t.isNew);
  const merged = result.tiles.filter((t) => t.isMerging && t.row === 0).map((t) => t.col);
  const out = [0, 0, 0, 0];
  for (const t of result.tiles) if (t.row === 0 && t !== spawn) out[t.col] = t.value;
  return { out, score: result.score, merged };
}

describe("moveWithTiles", () => {
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
    const result = moveWithTiles(tilesFromGrid(grid), "left");
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
    const result = moveWithTiles(tilesFromGrid(grid), "right");
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
    const result = moveWithTiles(tilesFromGrid(grid), "up");
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
    const result = moveWithTiles(tilesFromGrid(grid), "down");
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
    const tiles = tilesFromGrid(grid);
    const result = moveWithTiles(tiles, "left");
    expect(result.moved).toBe(false);
    expect(result.score).toBe(0);
    expect(result.tiles).toBe(tiles);
  });

  it("does not spawn a tile when the move changes nothing", () => {
    const grid = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = moveWithTiles(tilesFromGrid(grid), "left");
    expect(result.moved).toBe(false);
    expect(result.tiles).toHaveLength(1);
  });

  it("spawns a tile when there is a valid slide", () => {
    const grid = [
      [0, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const result = moveWithTiles(tilesFromGrid(grid), "left");
    expect(result.moved).toBe(true);
    expect(result.tiles).toHaveLength(2);
    expect(result.tiles.filter((t) => t.isNew)).toHaveLength(1);
  });

  it("keeps tile ids stable and drops the consumed tile on merge", () => {
    const tiles = tilesFromGrid([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const result = moveWithTiles(tiles, "left");
    const survivor = result.tiles.find((t) => t.id === tiles[0].id);
    expect(survivor).toMatchObject({ value: 4, row: 0, col: 0, isMerging: true });
    expect(result.tiles.some((t) => t.id === tiles[1].id)).toBe(false);
  });

  it("merges tiles that become adjacent after sliding", () => {
    const { out, score, merged } = slideLeft([2, 0, 2, 0]);
    expect(out).toEqual([4, 0, 0, 0]);
    expect(score).toBe(4);
    expect(merged).toEqual([0]);
  });

  it("does not merge an already-merged tile with a third equal tile", () => {
    const { out, score } = slideLeft([2, 2, 2, 0]);
    expect(out).toEqual([4, 2, 0, 0]);
    expect(score).toBe(4);
  });

  it("handles four equal tiles as two merges", () => {
    const { out, score } = slideLeft([2, 2, 2, 2]);
    expect(out).toEqual([4, 4, 0, 0]);
    expect(score).toBe(8);
  });

  it("leaves a settled row unchanged", () => {
    const { out, score, merged } = slideLeft([4, 2, 0, 0]);
    expect(out).toEqual([4, 2, 0, 0]);
    expect(score).toBe(0);
    expect(merged).toEqual([]);
  });

  it("produces the expected grid and score for a mixed board", () => {
    const grid = [
      [2, 0, 2, 4],
      [4, 4, 0, 0],
      [0, 2, 2, 0],
      [0, 0, 0, 0],
    ];
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const result = moveWithTiles(tilesFromGrid(grid), "left");
    randomSpy.mockRestore();

    expect(result.score).toBe(4 + 8 + 4);
    expect(result.grid).toEqual([
      [4, 4, 2, 0], // the spawned 2 lands in the first empty cell
      [8, 0, 0, 0],
      [4, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
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
