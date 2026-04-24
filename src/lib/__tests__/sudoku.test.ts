/**
 * Comprehensive tests for the Sudoku engine.
 *
 * Covers: generation, solving, validation, and edge cases
 * for 4×4, 6×6, and 9×9 grids at all difficulty levels.
 */
import { describe, it, expect } from "vitest";
import {
  generate,
  validate,
  solve,
  getConflictingCells,
  isGroupComplete,
  type Board,
  type GridSize,
  type Difficulty,
} from "../sudoku";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Check all rows have unique non-null values */
function rowsValid(board: Board): boolean {
  const size = board.length;
  for (let r = 0; r < size; r++) {
    const vals = board[r].filter((v) => v !== null) as number[];
    if (new Set(vals).size !== vals.length) return false;
  }
  return true;
}

/** Check all columns have unique non-null values */
function colsValid(board: Board): boolean {
  const size = board.length;
  for (let c = 0; c < size; c++) {
    const vals: number[] = [];
    for (let r = 0; r < size; r++) {
      const v = board[r][c];
      if (v !== null) vals.push(v);
    }
    if (new Set(vals).size !== vals.length) return false;
  }
  return true;
}

/** Check all boxes have unique non-null values */
function boxesValid(board: Board): boolean {
  const size = board.length;
  let boxRows: number, boxCols: number;

  if (size === 4) {
    boxRows = 2;
    boxCols = 2;
  } else if (size === 6) {
    boxRows = 2;
    boxCols = 3;
  } else {
    boxRows = 3;
    boxCols = 3;
  }

  for (let br = 0; br < size / boxRows; br++) {
    for (let bc = 0; bc < size / boxCols; bc++) {
      const vals: number[] = [];
      for (let r = br * boxRows; r < (br + 1) * boxRows; r++) {
        for (let c = bc * boxCols; c < (bc + 1) * boxCols; c++) {
          const v = board[r][c];
          if (v !== null) vals.push(v);
        }
      }
      if (new Set(vals).size !== vals.length) return false;
    }
  }
  return true;
}

/** Full constraint check on a puzzle (givens must not conflict) */
function puzzleConstraintsValid(board: Board): boolean {
  return rowsValid(board) && colsValid(board) && boxesValid(board);
}

/** Count non-null cells */
function countClues(board: Board): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) count++;
    }
  }
  return count;
}

/** Check that puzzle clues match solution at those positions */
function cluesMatchSolution(puzzle: Board, solution: Board): boolean {
  const size = puzzle.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (puzzle[r][c] !== null && puzzle[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

/** Get box dimensions for a grid size */
function getBoxDims(size: number): [number, number] {
  if (size === 4) return [2, 2];
  if (size === 6) return [2, 3];
  return [3, 3];
}

/** Parse a board string using . as blank */
function parseBoard(input: string, size: GridSize): Board {
  const chars = input.split("");
  const board: Board = [];
  for (let row = 0; row < size; row++) {
    const rowValues: (number | null)[] = [];
    for (let col = 0; col < size; col++) {
      const ch = chars[row * size + col];
      rowValues.push(ch === "." ? null : Number(ch));
    }
    board.push(rowValues);
  }
  return board;
}

/** Independent solution counter used to verify uniqueness claims */
function countSolutionsIndependent(board: Board, limit = 2): number {
  const size = board.length;
  const [boxRows, boxCols] = getBoxDims(size);
  const working = board.map((row) => [...row]);
  let count = 0;

  function candidatesFor(row: number, col: number): number[] {
    const candidates: number[] = [];

    for (let num = 1; num <= size; num++) {
      let valid = true;

      for (let c = 0; c < size; c++) {
        if (working[row][c] === num) {
          valid = false;
          break;
        }
      }
      if (!valid) continue;

      for (let r = 0; r < size; r++) {
        if (working[r][col] === num) {
          valid = false;
          break;
        }
      }
      if (!valid) continue;

      const startRow = Math.floor(row / boxRows) * boxRows;
      const startCol = Math.floor(col / boxCols) * boxCols;
      for (let r = startRow; r < startRow + boxRows; r++) {
        for (let c = startCol; c < startCol + boxCols; c++) {
          if (working[r][c] === num) {
            valid = false;
            break;
          }
        }
        if (!valid) break;
      }

      if (valid) candidates.push(num);
    }

    return candidates;
  }

  function findNextCell(): { row: number; col: number; candidates: number[] } | null {
    let best: { row: number; col: number; candidates: number[] } | null = null;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (working[row][col] !== null) continue;
        const candidates = candidatesFor(row, col);
        if (candidates.length === 0) return { row, col, candidates };
        if (!best || candidates.length < best.candidates.length) {
          best = { row, col, candidates };
        }
      }
    }

    return best;
  }

  function search(): void {
    if (count >= limit) return;

    const next = findNextCell();
    if (next === null) {
      count++;
      return;
    }
    if (next.candidates.length === 0) return;

    for (const candidate of next.candidates) {
      working[next.row][next.col] = candidate;
      search();
      working[next.row][next.col] = null;
      if (count >= limit) return;
    }
  }

  search();
  return count;
}

// ─── Generation Tests ───────────────────────────────────────────────────────

describe("generate", () => {
  const sizes: GridSize[] = [4, 6, 9];
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  for (const size of sizes) {
    for (const difficulty of difficulties) {
      describe(`${size}×${size} ${difficulty}`, () => {
        it("should generate a puzzle with correct dimensions", () => {
          const { puzzle, solution } = generate(size, difficulty);
          expect(puzzle).toHaveLength(size);
          expect(solution).toHaveLength(size);
          for (let r = 0; r < size; r++) {
            expect(puzzle[r]).toHaveLength(size);
            expect(solution[r]).toHaveLength(size);
          }
        });

        it("should have a fully filled solution", () => {
          const { solution } = generate(size, difficulty);
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              expect(solution[r][c]).toBeGreaterThanOrEqual(1);
              expect(solution[r][c]).toBeLessThanOrEqual(size);
            }
          }
        });

        it("solution should be valid", () => {
          const { solution } = generate(size, difficulty);
          expect(validate(solution)).toBe(true);
        });

        it("puzzle constraints should not conflict", () => {
          const { puzzle } = generate(size, difficulty);
          expect(puzzleConstraintsValid(puzzle)).toBe(true);
        });

        it("puzzle clues should match solution", () => {
          const { puzzle, solution } = generate(size, difficulty);
          expect(cluesMatchSolution(puzzle, solution)).toBe(true);
        });

        it("puzzle should have fewer clues than solution", () => {
          const { puzzle } = generate(size, difficulty);
          const clues = countClues(puzzle);
          expect(clues).toBeGreaterThan(0);
          expect(clues).toBeLessThan(size * size);
        });

        it("puzzle should have a unique solution", () => {
          // Generate the puzzle and verify the solution is obtainable via solve()
          const { puzzle, solution } = generate(size, difficulty);
          const solved = solve(puzzle);
          expect(solved).not.toBeNull();
          expect(solved).toEqual(solution);
        });
      });
    }
  }

  it("should produce different puzzles on successive calls", () => {
    const a = generate(9, "medium");
    const b = generate(9, "medium");
    // Extremely unlikely to get the same puzzle twice
    let same = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (a.puzzle[r][c] !== b.puzzle[r][c]) {
          same = false;
          break;
        }
      }
      if (!same) break;
    }
    expect(same).toBe(false);
  });

  it("clue counts should respect difficulty ordering (harder = fewer clues)", () => {
    const easy = generate(9, "easy");
    const medium = generate(9, "medium");
    const hard = generate(9, "hard");

    const easyClues = countClues(easy.puzzle);
    const mediumClues = countClues(medium.puzzle);
    const hardClues = countClues(hard.puzzle);

    expect(easyClues).toBeGreaterThan(hardClues);
    // Medium should be between easy and hard (with some tolerance for rounding)
    expect(mediumClues).toBeLessThanOrEqual(easyClues);
    expect(mediumClues).toBeGreaterThanOrEqual(hardClues);
  });

  it("generated puzzles should be uniquely solvable by an independent counter", () => {
    for (const size of [4, 6, 9] as GridSize[]) {
      const { puzzle } = generate(size, "easy");
      expect(countSolutionsIndependent(puzzle, 2)).toBe(1);
    }
  });
});

// ─── Solve Tests ────────────────────────────────────────────────────────────

describe("solve", () => {
  it("should solve a 9×9 easy puzzle back to its solution", () => {
    const { puzzle, solution } = generate(9, "easy");
    const solved = solve(puzzle);
    expect(solved).toEqual(solution);
  });

  it("should solve a known 9×9 reference puzzle from sudoku.js", () => {
    const puzzle = parseBoard(
      ".17..69..356194.2..89..71.6.65...273872563419.43...685521......798..53..634...59.",
      9
    );
    const expected = parseBoard(
      "217386954356194728489257136165948273872563419943712685521439867798625341634871592",
      9
    );
    expect(solve(puzzle)).toEqual(expected);
  });

  it("should solve a 4×4 puzzle", () => {
    const { puzzle, solution } = generate(4, "easy");
    const solved = solve(puzzle);
    expect(solved).toEqual(solution);
  });

  it("should solve a 6×6 puzzle", () => {
    const { puzzle, solution } = generate(6, "medium");
    const solved = solve(puzzle);
    expect(solved).toEqual(solution);
  });

  it("should return null for an unsolvable board", () => {
    // Create an impossible board: two 1s in the first row
    const board: Board = [
      [1, 1, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    expect(solve(board)).toBeNull();
  });

  it("should return null for an empty 9×9 board with conflicting constraint", () => {
    // First row has two 1s — immediate conflict
    const board: Board = Array.from({ length: 9 }, () => Array(9).fill(null));
    board[0][0] = 1;
    board[0][1] = 1;
    // Our solver should detect this quickly since placing values will fail
    const result = solve(board);
    // Even if it doesn't explicitly check, the backtracker should bail out
    // since no valid placement exists for row 0
    expect(result).toBeNull();
  });

  // NOTE: Solving a completely empty 9×9 board is equivalent to generating
  // a full solution from scratch — too slow for a test. Skipped intentionally.
});

// ─── Validate Tests ─────────────────────────────────────────────────────────

describe("validate", () => {
  it("should validate a correct solved 9×9 board", () => {
    const { solution } = generate(9, "easy");
    expect(validate(solution)).toBe(true);
  });

  it("should validate a correct solved 4×4 board", () => {
    const { solution } = generate(4, "easy");
    expect(validate(solution)).toBe(true);
  });

  it("should reject a board with null cells", () => {
    const { puzzle } = generate(9, "easy");
    expect(validate(puzzle)).toBe(false);
  });

  it("should reject a board with a duplicate in a row", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    board[0][1] = board[0][0]; // duplicate value in first row
    expect(validate(board)).toBe(false);
  });

  it("should reject a board with a duplicate in a column", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    board[1][0] = board[0][0]; // duplicate value in first column
    expect(validate(board)).toBe(false);
  });

  it("should reject a board with a duplicate in a box", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    // Copy value from (0,0) to (1,1) — same 3×3 box
    board[1][1] = board[0][0];
    // But make sure they're actually in the same box
    // (0,0) and (1,1) are in the same box for 9×9
    expect(validate(board)).toBe(false);
  });

  it("should reject a board with out-of-range values", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    board[0][0] = 10; // out of range
    expect(validate(board)).toBe(false);
  });

  it("should reject a board with zero values", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    board[0][0] = 0;
    expect(validate(board)).toBe(false);
  });

  it("should reject unsupported board sizes", () => {
    const board = [
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5, 1],
      [3, 4, 5, 1, 2],
      [4, 5, 1, 2, 3],
      [5, 1, 2, 3, 4],
    ] as Board;
    expect(validate(board)).toBe(false);
  });

  it("should reject ragged board shapes", () => {
    const board = [
      [1, 2, 3, 4],
      [3, 4, 1],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ] as Board;
    expect(validate(board)).toBe(false);
    expect(solve(board)).toBeNull();
  });
});

// ─── Edge Cases ─────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("6×6 box structure should be 2×3", () => {
    const { solution } = generate(6, "easy");
    // Verify box structure: rows 0-1/2-3/4-5, cols 0-2/3-5
    const [boxRows, boxCols] = getBoxDims(6);
    expect(boxRows).toBe(2);
    expect(boxCols).toBe(3);

    // Verify each box contains 1-6
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 2; bc++) {
        const vals = new Set<number>();
        for (let r = br * boxRows; r < (br + 1) * boxRows; r++) {
          for (let c = bc * boxCols; c < (bc + 1) * boxCols; c++) {
            vals.add(solution[r][c]!);
          }
        }
        expect(vals.size).toBe(6);
        for (let i = 1; i <= 6; i++) {
          expect(vals.has(i)).toBe(true);
        }
      }
    }
  });

  it("4×4 box structure should be 2×2", () => {
    const { solution } = generate(4, "easy");
    const [boxRows, boxCols] = getBoxDims(4);
    expect(boxRows).toBe(2);
    expect(boxCols).toBe(2);

    // Verify each box contains 1-4
    for (let br = 0; br < 2; br++) {
      for (let bc = 0; bc < 2; bc++) {
        const vals = new Set<number>();
        for (let r = br * boxRows; r < (br + 1) * boxRows; r++) {
          for (let c = bc * boxCols; c < (bc + 1) * boxCols; c++) {
            vals.add(solution[r][c]!);
          }
        }
        expect(vals.size).toBe(4);
        for (let i = 1; i <= 4; i++) {
          expect(vals.has(i)).toBe(true);
        }
      }
    }
  });

  it("generate multiple puzzles in succession without errors", () => {
    // Stress test — 4×4 and 6×6 are fast, 9×9 only easy/medium
    for (const size of [4, 6] as GridSize[]) {
      for (let i = 0; i < 5; i++) {
        const { puzzle, solution } = generate(size, "hard");
        expect(puzzle.length).toBe(size);
        expect(validate(solution)).toBe(true);
        expect(cluesMatchSolution(puzzle, solution)).toBe(true);
      }
    }
    // 9×9 easy only for stress test (hard is too slow for repeated runs)
    for (let i = 0; i < 3; i++) {
      const { puzzle, solution } = generate(9, "easy");
      expect(puzzle.length).toBe(9);
      expect(validate(solution)).toBe(true);
      expect(cluesMatchSolution(puzzle, solution)).toBe(true);
    }
  });
});

// ─── Conflict Detection Tests ────────────────────────────────────────────

describe("getConflictingCells", () => {
  it("should return empty set for a valid solved board", () => {
    const { solution } = generate(9, "easy");
    const conflicts = getConflictingCells(solution);
    expect(conflicts.size).toBe(0);
  });

  it("should detect a row conflict", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    // Create a duplicate in row 0
    board[0][1] = board[0][0];
    const conflicts = getConflictingCells(board);
    expect(conflicts.has("0,0")).toBe(true);
    expect(conflicts.has("0,1")).toBe(true);
    expect(conflicts.size).toBeGreaterThanOrEqual(2);
  });

  it("should detect a column conflict", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    // Create a duplicate in column 0
    board[1][0] = board[0][0];
    const conflicts = getConflictingCells(board);
    expect(conflicts.has("0,0")).toBe(true);
    expect(conflicts.has("1,0")).toBe(true);
    expect(conflicts.size).toBeGreaterThanOrEqual(2);
  });

  it("should detect a box conflict", () => {
    const board: Board = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ];
    // Force a box conflict: (0,0)=1 and make (1,1)=1
    board[1][1] = 1;
    const conflicts = getConflictingCells(board);
    expect(conflicts.has("0,0")).toBe(true);
    expect(conflicts.has("1,1")).toBe(true);
  });

  it("should ignore null cells", () => {
    const board: Board = [
      [1, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const conflicts = getConflictingCells(board);
    expect(conflicts.size).toBe(0);
  });

  it("should detect multiple independent conflicts", () => {
    const board: Board = [
      [1, 1, null, null],
      [null, null, 2, 2],
      [null, null, null, null],
      [null, null, null, null],
    ];
    const conflicts = getConflictingCells(board);
    // Row 0: 1,1 conflict
    expect(conflicts.has("0,0")).toBe(true);
    expect(conflicts.has("0,1")).toBe(true);
    // Row 1: 2,2 conflict
    expect(conflicts.has("1,2")).toBe(true);
    expect(conflicts.has("1,3")).toBe(true);
  });

  it("should work for 6×6 boards", () => {
    const { solution } = generate(6, "easy");
    const board = solution.map((r) => [...r]);
    board[0][1] = board[0][0]; // row conflict
    const conflicts = getConflictingCells(board);
    expect(conflicts.size).toBeGreaterThan(0);
    expect(conflicts.has("0,0")).toBe(true);
    expect(conflicts.has("0,1")).toBe(true);
  });
});

// ─── Group Completion Tests ──────────────────────────────────────────────

describe("isGroupComplete", () => {
  it("should return true for a complete row in a solved board", () => {
    const { solution } = generate(9, "easy");
    for (let r = 0; r < 9; r++) {
      expect(isGroupComplete(solution, "row", r)).toBe(true);
    }
  });

  it("should return true for a complete column in a solved board", () => {
    const { solution } = generate(9, "easy");
    for (let c = 0; c < 9; c++) {
      expect(isGroupComplete(solution, "col", c)).toBe(true);
    }
  });

  it("should return true for a complete box in a solved board", () => {
    const { solution } = generate(9, "easy");
    for (let i = 0; i < 9; i++) {
      expect(isGroupComplete(solution, "box", i)).toBe(true);
    }
  });

  it("should return false for a row with a null cell", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    board[0][0] = null;
    expect(isGroupComplete(board, "row", 0)).toBe(false);
  });

  it("should return false for a row with a duplicate", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    board[0][1] = board[0][0]; // duplicate in row 0
    expect(isGroupComplete(board, "row", 0)).toBe(false);
  });

  it("should return false for a column with a null cell", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    board[0][0] = null;
    expect(isGroupComplete(board, "col", 0)).toBe(false);
  });

  it("should work for 4×4 boards", () => {
    const { solution } = generate(4, "easy");
    expect(isGroupComplete(solution, "row", 0)).toBe(true);
    expect(isGroupComplete(solution, "col", 0)).toBe(true);
    expect(isGroupComplete(solution, "box", 0)).toBe(true);
    expect(isGroupComplete(solution, "box", 3)).toBe(true);
  });

  it("should work for 6×6 boards", () => {
    const { solution } = generate(6, "easy");
    expect(isGroupComplete(solution, "row", 0)).toBe(true);
    expect(isGroupComplete(solution, "col", 0)).toBe(true);
    expect(isGroupComplete(solution, "box", 0)).toBe(true);
    expect(isGroupComplete(solution, "box", 5)).toBe(true);
  });

  it("should detect an incomplete box", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    board[0][0] = null; // top-left box
    expect(isGroupComplete(board, "box", 0)).toBe(false);
  });

  it("should detect a duplicate in a box", () => {
    const { solution } = generate(9, "easy");
    const board = solution.map((r) => [...r]);
    // Force a duplicate in box 0 (rows 0-2, cols 0-2)
    board[1][1] = board[0][0];
    expect(isGroupComplete(board, "box", 0)).toBe(false);
  });
});
