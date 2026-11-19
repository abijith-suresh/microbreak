/**
 * game2048 — Pure logic for the 2048 tile-sliding puzzle.
 *
 * The grid is a 4×4 matrix of numbers where 0 represents an empty cell.
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

// ── Tile ids ────────────────────────────────────────────────────────────────────

let _nextTileId = 1;

export function resetTileIdCounter() {
  _nextTileId = 1;
}

export function nextTileId(): number {
  return _nextTileId++;
}

export function seedTileIdCounter(nextId: number) {
  _nextTileId = Math.max(1, Math.floor(nextId));
}

// ── Stable-ID move ───────────────────────────────────────────────────────────

/**
 * Map (direction, lineIndex, position) → (row, col) in the grid.
 * position=0 is the leading edge in the slide direction (where tiles pile up).
 */
function lineCoords(dir: Direction, lineIdx: number, pos: number): [number, number] {
  switch (dir) {
    case "left":
      return [lineIdx, pos];
    case "right":
      return [lineIdx, 3 - pos];
    case "up":
      return [pos, lineIdx];
    case "down":
      return [3 - pos, lineIdx];
  }
}

/** Build a Grid from a flat tile list. */
export function buildGridFromTiles(tiles: Tile[]): Grid {
  const g = createEmptyGrid();
  for (const t of tiles) g[t.row][t.col] = t.value;
  return g;
}

/**
 * Apply a move while preserving stable tile IDs so the same DOM element
 * persists across renders and CSS `transition: transform` can animate the slide.
 *
 * The tile at the lower position in the slide direction survives a merge
 * (keeps its id, value doubles, isMerging=true).  The consumed tile is dropped
 * from the result list.  A new tile is spawned after a successful move.
 */
export function moveWithTiles(currentTiles: Tile[], dir: Direction): MoveResult {
  const posMap = new Map<string, Tile>();
  for (const t of currentTiles) posMap.set(`${t.row},${t.col}`, t);

  const resultTiles: Tile[] = [];
  let totalScore = 0;
  let moved = false;

  for (let lineIdx = 0; lineIdx < 4; lineIdx++) {
    // Tiles in this line ordered from leading edge (pos 0) to trailing edge
    const lineTiles: Tile[] = [];
    for (let pos = 0; pos < 4; pos++) {
      const [r, c] = lineCoords(dir, lineIdx, pos);
      const t = posMap.get(`${r},${c}`);
      if (t) lineTiles.push(t);
    }

    let targetPos = 0;
    let i = 0;
    while (i < lineTiles.length) {
      const [newR, newC] = lineCoords(dir, lineIdx, targetPos);
      const canMerge = i + 1 < lineTiles.length && lineTiles[i].value === lineTiles[i + 1].value;

      if (canMerge) {
        const mergedValue = lineTiles[i].value * 2;
        totalScore += mergedValue;
        if (lineTiles[i].row !== newR || lineTiles[i].col !== newC) moved = true;
        if (lineTiles[i + 1].row !== newR || lineTiles[i + 1].col !== newC) moved = true;
        resultTiles.push({
          id: lineTiles[i].id,
          value: mergedValue,
          row: newR,
          col: newC,
          isNew: false,
          isMerging: true,
        });
        i += 2;
      } else {
        if (lineTiles[i].row !== newR || lineTiles[i].col !== newC) moved = true;
        resultTiles.push({
          id: lineTiles[i].id,
          value: lineTiles[i].value,
          row: newR,
          col: newC,
          isNew: false,
          isMerging: false,
        });
        i++;
      }
      targetPos++;
    }
  }

  if (!moved) {
    return { grid: buildGridFromTiles(currentTiles), tiles: currentTiles, score: 0, moved: false };
  }

  const newGrid = buildGridFromTiles(resultTiles);
  const spawnResult = spawnTile(newGrid, nextTileId());
  if (spawnResult) {
    return {
      grid: spawnResult.grid,
      tiles: [...resultTiles, spawnResult.tile],
      score: totalScore,
      moved: true,
    };
  }
  return { grid: newGrid, tiles: resultTiles, score: totalScore, moved: true };
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
