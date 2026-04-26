/**
 * game2048 — Pure logic for the 2048 tile-sliding puzzle.
 *
 * The grid is a flat 4×4 matrix of numbers where 0 represents an empty cell.
 * All mutation-free: every function returns new data.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type Direction = "up" | "down" | "left" | "right";
export type Grid = number[][];

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerging: boolean;
}

export interface MoveResult {
  grid: Grid;
  tiles: Tile[];
  score: number;
  moved: boolean;
}

// ── Grid helpers ───────────────────────────────────────────────────────────────

export function createEmptyGrid(): Grid {
  return Array.from({ length: 4 }, () => Array(4).fill(0));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function getEmptyCells(grid: Grid): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

export function isFull(grid: Grid): boolean {
  return getEmptyCells(grid).length === 0;
}

// ── Spawn ──────────────────────────────────────────────────────────────────────

/**
 * Place a new tile (value 2 at 90%, value 4 at 10%) at a random empty cell.
 * Returns the updated grid and the new tile's position, or null if the grid is full.
 */
export function spawnTile(grid: Grid, tileId: number): { grid: Grid; tile: Tile } | null {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return null;

  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  const newGrid = cloneGrid(grid);
  newGrid[row][col] = value;

  return {
    grid: newGrid,
    tile: { id: tileId, value, row, col, isNew: true, isMerging: false },
  };
}

// ── Slide row (left) ───────────────────────────────────────────────────────────

/**
 * Slide and merge a single row to the left.
 * Returns the new row, score gained, and indices of merged positions.
 */
export function slideRow(row: number[]): {
  result: number[];
  score: number;
  mergeIndices: number[];
} {
  // Remove zeros (compact left)
  const filtered = row.filter((v) => v !== 0);
  const result: number[] = [];
  const mergeIndices: number[] = [];
  let score = 0;
  let i = 0;

  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      mergeIndices.push(result.length - 1);
      score += merged;
      i += 2;
    } else {
      result.push(filtered[i]);
      i++;
    }
  }

  // Pad with zeros
  while (result.length < 4) result.push(0);

  return { result, score, mergeIndices };
}

// ── Grid transformations ───────────────────────────────────────────────────────
//
// We normalise all directions to "slide left" by extracting rows from the grid
// in the appropriate order, sliding each one left, then writing them back.
// This avoids error-prone rotation math.

/** Extract 4 rows in the order needed for the given direction. */
function extractRows(grid: Grid, dir: Direction): number[][] {
  switch (dir) {
    case "left":
      return [grid[0].slice(), grid[1].slice(), grid[2].slice(), grid[3].slice()];
    case "right":
      return [
        grid[0].slice().reverse(),
        grid[1].slice().reverse(),
        grid[2].slice().reverse(),
        grid[3].slice().reverse(),
      ];
    case "up":
      // Column 0→3 become rows top→bottom
      return [
        [grid[0][0], grid[1][0], grid[2][0], grid[3][0]],
        [grid[0][1], grid[1][1], grid[2][1], grid[3][1]],
        [grid[0][2], grid[1][2], grid[2][2], grid[3][2]],
        [grid[0][3], grid[1][3], grid[2][3], grid[3][3]],
      ];
    case "down":
      // Column 0→3 reversed (bottom→top) become rows
      return [
        [grid[3][0], grid[2][0], grid[1][0], grid[0][0]],
        [grid[3][1], grid[2][1], grid[1][1], grid[0][1]],
        [grid[3][2], grid[2][2], grid[1][2], grid[0][2]],
        [grid[3][3], grid[2][3], grid[1][3], grid[0][3]],
      ];
  }
}

/** Write slid rows back into the grid, reversing the extraction transform. */
function writeRows(slid: number[][], dir: Direction): Grid {
  const grid = createEmptyGrid();
  switch (dir) {
    case "left":
      for (let r = 0; r < 4; r++) grid[r] = slid[r];
      break;
    case "right":
      for (let r = 0; r < 4; r++) grid[r] = slid[r].reverse();
      break;
    case "up":
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) grid[r][c] = slid[c][r];
      break;
    case "down":
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) grid[3 - r][c] = slid[c][r];
      break;
  }
  return grid;
}

// ── Move ───────────────────────────────────────────────────────────────────────

let _nextTileId = 1;

export function resetTileIdCounter() {
  _nextTileId = 1;
}

function nextTileId(): number {
  return _nextTileId++;
}

/**
 * Apply a move in the given direction. Returns the new grid state, a flat
 * list of all tiles (for rendering), the score gained, and whether anything moved.
 */
export function move(grid: Grid, dir: Direction): MoveResult {
  const rows = extractRows(grid, dir);

  let totalScore = 0;
  let moved = false;
  const slidRows: number[][] = [];
  const allMergePositions: [number, number][] = [];

  for (let r = 0; r < 4; r++) {
    const { result, score, mergeIndices } = slideRow(rows[r]);
    slidRows.push(result);
    totalScore += score;
    if (result.join() !== rows[r].join()) moved = true;
    for (const mi of mergeIndices) {
      allMergePositions.push([r, mi]);
    }
  }

  if (!moved) {
    return { grid, tiles: [], score: 0, moved: false };
  }

  const newGrid = writeRows(slidRows, dir);

  // Determine which cells in final grid are merge results.
  // We extract the merge positions back into grid coordinates by checking
  // what value each slid row has at the merge index, then finding that cell
  // in the final grid.
  const mergeSet = new Set<string>();
  for (const [rowIdx, colIdx] of allMergePositions) {
    // Map back through writeRows to find the actual grid position
    // Easier: just check which grid cells hold the merged values
    // For each extracted row at colIdx, find where writeRows puts it
    switch (dir) {
      case "left":
        mergeSet.add(`${rowIdx},${colIdx}`);
        break;
      case "right":
        mergeSet.add(`${rowIdx},${3 - colIdx}`);
        break;
      case "up":
        mergeSet.add(`${colIdx},${rowIdx}`);
        break;
      case "down":
        mergeSet.add(`${3 - colIdx},${rowIdx}`);
        break;
    }
  }

  // Build tile list from the new grid
  const tiles: Tile[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (newGrid[r][c] !== 0) {
        tiles.push({
          id: nextTileId(),
          value: newGrid[r][c],
          row: r,
          col: c,
          isNew: false,
          isMerging: mergeSet.has(`${r},${c}`),
        });
      }
    }
  }

  // Spawn a new tile
  const spawnResult = spawnTile(newGrid, nextTileId());
  if (spawnResult) {
    return {
      grid: spawnResult.grid,
      tiles: [...tiles, spawnResult.tile],
      score: totalScore,
      moved: true,
    };
  }

  return { grid: newGrid, tiles, score: totalScore, moved: true };
}

// ── Win / loss detection ───────────────────────────────────────────────────────

export function hasWon(grid: Grid): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] >= 2048) return true;
    }
  }
  return false;
}

export function canMove(grid: Grid): boolean {
  // Any empty cell means we can still move
  if (!isFull(grid)) return true;

  // Check for adjacent equal values
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c];
      if (c + 1 < 4 && grid[r][c + 1] === val) return true;
      if (r + 1 < 4 && grid[r + 1][c] === val) return true;
    }
  }
  return false;
}
