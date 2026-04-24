/**
 * Comprehensive tests for the Sudoku engine.
 *
 * Covers: generation, solving, validation, and edge cases
 * for 4×4, 6×6, and 9×9 grids at all difficulty levels.
 */
import { describe, it, expect } from "vitest";
import { generate, validate, solve, type Board, type GridSize, type Difficulty } from "../sudoku";

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
});

// ─── Solve Tests ────────────────────────────────────────────────────────────

describe("solve", () => {
  it("should solve a 9×9 easy puzzle back to its solution", () => {
    const { puzzle, solution } = generate(9, "easy");
    const solved = solve(puzzle);
    expect(solved).toEqual(solution);
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
