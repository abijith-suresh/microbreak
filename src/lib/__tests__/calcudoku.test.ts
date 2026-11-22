import { describe, expect, it } from "vitest";
import {
  type Cage,
  type CalcudokuPuzzle,
  cageAssignments,
  cageLabel,
  clearCell,
  createBoard,
  DIFFICULTIES,
  describeCage,
  describeCell,
  evaluateCage,
  findSolutions,
  type Grid,
  generate,
  generateLatinSquare,
  getCageIndexGrid,
  getCageStatus,
  getCageStatuses,
  getConflictingCells,
  hasUniqueSolution,
  isGivenCell,
  isLatinSquare,
  isSolved,
  SIZE_FOR_DIFFICULTY,
  setCellValue,
  toggleNote,
} from "../calcudoku";
import { createSeededRandom } from "../random";

const solution4 = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

const fixture: CalcudokuPuzzle = {
  size: 4,
  solution: solution4,
  cages: [
    {
      cells: [
        [0, 0],
        [1, 0],
      ],
      operation: "subtract",
      target: 2,
    },
    {
      cells: [
        [0, 1],
        [0, 2],
      ],
      operation: "multiply",
      target: 6,
    },
    { cells: [[0, 3]], operation: "given", target: 4 },
    {
      cells: [
        [1, 1],
        [1, 2],
      ],
      operation: "divide",
      target: 4,
    },
    {
      cells: [
        [1, 3],
        [2, 3],
      ],
      operation: "add",
      target: 5,
    },
    {
      cells: [
        [2, 0],
        [3, 0],
        [3, 1],
      ],
      operation: "add",
      target: 9,
    },
    {
      cells: [
        [2, 1],
        [2, 2],
      ],
      operation: "subtract",
      target: 3,
    },
    {
      cells: [
        [3, 2],
        [3, 3],
      ],
      operation: "divide",
      target: 2,
    },
  ],
};

const copy = (grid: Grid): Grid => grid.map((row) => [...row]);
const SEEDS = Array.from({ length: 25 }, (_, i) => i + 1);

describe("seeded randomness", () => {
  it("gives the same puzzle for the same seed and a different one for another", () => {
    const a = generate("hard", createSeededRandom(99));
    const b = generate("hard", createSeededRandom(99));
    const c = generate("hard", createSeededRandom(100));
    expect(a).toEqual(b);
    expect(c).not.toEqual(a);
  });
});

describe("Latin square", () => {
  it.each([4, 5, 6] as const)("has 1–%i once in every row and column", (size) => {
    for (const seed of SEEDS) {
      const grid = generateLatinSquare(size, createSeededRandom(seed));
      expect(isLatinSquare(grid, size)).toBe(true);
    }
  });

  it("rejects repeats, out-of-range digits and wrong shapes", () => {
    expect(isLatinSquare(solution4, 4)).toBe(true);
    expect(isLatinSquare([...solution4.slice(0, 3), solution4[2]], 4)).toBe(false);
    expect(isLatinSquare([[1, 2, 3, 5], ...solution4.slice(1)], 4)).toBe(false);
    expect(isLatinSquare(solution4.slice(0, 3), 4)).toBe(false);
    expect(isLatinSquare(solution4, 5)).toBe(false);
  });
});

describe("cage arithmetic", () => {
  it("checks every operation in any order", () => {
    expect(evaluateCage("add", 9, [2, 4, 3])).toBe(true);
    expect(evaluateCage("add", 9, [2, 4, 4])).toBe(false);
    expect(evaluateCage("multiply", 24, [4, 3, 2])).toBe(true);
    expect(evaluateCage("multiply", 24, [4, 3, 1])).toBe(false);
    expect(evaluateCage("subtract", 2, [1, 3])).toBe(true);
    expect(evaluateCage("subtract", 2, [3, 1])).toBe(true);
    expect(evaluateCage("subtract", 2, [3, 2])).toBe(false);
    expect(evaluateCage("divide", 2, [3, 6])).toBe(true);
    expect(evaluateCage("divide", 2, [6, 3])).toBe(true);
    expect(evaluateCage("given", 4, [4])).toBe(true);
    expect(evaluateCage("given", 4, [3])).toBe(false);
  });

  it("only divides evenly, and only takes two cells for − and ÷", () => {
    expect(evaluateCage("divide", 1, [3, 3])).toBe(true);
    expect(evaluateCage("divide", 1, [5, 4])).toBe(false);
    expect(evaluateCage("subtract", 1, [4, 3, 2])).toBe(false);
    expect(evaluateCage("divide", 2, [4, 2, 1])).toBe(false);
  });

  it("labels each cage the way the board prints it", () => {
    expect(fixture.cages.map(cageLabel)).toEqual(["2−", "6×", "4", "4÷", "5+", "9+", "3−", "2÷"]);
  });

  it("lists the assignments a cage allows, repeating digits only off a shared row or column", () => {
    expect(cageAssignments(fixture.cages[6], 4)).toEqual([
      [1, 4],
      [4, 1],
    ]);
    const corner: Cage = {
      cells: [
        [0, 0],
        [0, 1],
        [1, 1],
      ],
      operation: "add",
      target: 4,
    };
    const options = cageAssignments(corner, 4);
    expect(options).toContainEqual([1, 2, 1]);
    expect(options).not.toContainEqual([1, 1, 2]);
    expect(options).not.toContainEqual([2, 1, 1]);
    expect(options.every((digits) => evaluateCage("add", 4, digits))).toBe(true);
  });

  it("reports each cage as incomplete, satisfied or violated", () => {
    const values = createBoard(fixture).values;
    expect(getCageStatus(fixture.cages[0], values)).toBe("incomplete");
    expect(getCageStatus(fixture.cages[2], values)).toBe("satisfied");

    values[0][0] = 1;
    expect(getCageStatus(fixture.cages[0], values)).toBe("incomplete");
    values[1][0] = 3;
    expect(getCageStatus(fixture.cages[0], values)).toBe("satisfied");
    values[1][0] = 2;
    expect(getCageStatus(fixture.cages[0], values)).toBe("violated");

    expect(getCageStatuses(fixture, solution4).every((s) => s === "satisfied")).toBe(true);
  });

  it("maps every cell to its cage", () => {
    expect(getCageIndexGrid(fixture)).toEqual([
      [0, 1, 1, 2],
      [0, 3, 3, 4],
      [5, 6, 6, 4],
      [5, 5, 7, 7],
    ]);
  });
});

describe("solver", () => {
  it("finds the solution to a puzzle", () => {
    expect(findSolutions(fixture, 10)).toContainEqual(solution4);
  });

  it("spots a puzzle with more than one solution and stops at the limit", () => {
    const rowsOnly: CalcudokuPuzzle = {
      size: 4,
      solution: solution4,
      cages: solution4.map((_, row) => ({
        cells: [0, 1, 2, 3].map((col): [number, number] => [row, col]),
        operation: "add" as const,
        target: 10,
      })),
    };
    expect(hasUniqueSolution(rowsOnly)).toBe(false);
    expect(findSolutions(rowsOnly, 5)).toHaveLength(5);
    for (const grid of findSolutions(rowsOnly, 5)) expect(isLatinSquare(grid, 4)).toBe(true);
  });

  it("finds no solution when the cages contradict each other", () => {
    const broken = { ...fixture, cages: [...fixture.cages] };
    broken.cages[2] = { cells: [[0, 3]], operation: "given", target: 1 };
    expect(findSolutions(broken)).toEqual([]);
  });
});

describe("generator", () => {
  const MAX_GIVENS = { easy: 3, medium: 2, hard: 1 };

  describe.each(DIFFICULTIES)("%s", (difficulty) => {
    const size = SIZE_FOR_DIFFICULTY[difficulty];
    const puzzles = SEEDS.map((seed) => generate(difficulty, createSeededRandom(seed)));

    it(`builds ${size}×${size} grids over a valid Latin square`, () => {
      for (const puzzle of puzzles) {
        expect(puzzle.size).toBe(size);
        expect(isLatinSquare(puzzle.solution, size)).toBe(true);
      }
    });

    it("covers every cell with exactly one connected cage", () => {
      for (const puzzle of puzzles) {
        const index = getCageIndexGrid(puzzle);
        expect(index.flat().every((i) => i >= 0)).toBe(true);
        expect(puzzle.cages.reduce((n, cage) => n + cage.cells.length, 0)).toBe(size * size);

        for (const cage of puzzle.cages) {
          const keys = new Set(cage.cells.map(([r, c]) => `${r},${c}`));
          const reached = new Set([`${cage.cells[0][0]},${cage.cells[0][1]}`]);
          const queue = [cage.cells[0]];
          while (queue.length > 0) {
            const [r, c] = queue.pop() as [number, number];
            for (const key of [
              `${r - 1},${c}`,
              `${r + 1},${c}`,
              `${r},${c - 1}`,
              `${r},${c + 1}`,
            ]) {
              if (keys.has(key) && !reached.has(key)) {
                reached.add(key);
                queue.push(key.split(",").map(Number) as [number, number]);
              }
            }
          }
          expect(reached.size).toBe(keys.size);
        }
      }
    });

    it("gives each cage a fitting operation and a target its solution digits reach", () => {
      for (const puzzle of puzzles) {
        for (const cage of puzzle.cages) {
          const count = cage.cells.length;
          if (count === 1) expect(cage.operation).toBe("given");
          else expect(cage.operation).not.toBe("given");
          if (cage.operation === "subtract" || cage.operation === "divide") expect(count).toBe(2);
          expect(getCageStatus(cage, puzzle.solution)).toBe("satisfied");
        }
      }
    });

    it(`keeps givens to ${MAX_GIVENS[difficulty]} or fewer`, () => {
      for (const puzzle of puzzles) {
        const givens = puzzle.cages.filter((cage) => cage.operation === "given");
        expect(givens.length).toBeLessThanOrEqual(MAX_GIVENS[difficulty]);
      }
    });

    it("has exactly one solution, the stored one", () => {
      for (const puzzle of puzzles) {
        expect(findSolutions(puzzle, 2)).toEqual([puzzle.solution]);
      }
    });
  });

  it("makes harder levels lean on larger cages and fewer givens", () => {
    const stats = DIFFICULTIES.map((difficulty) => {
      const puzzles = SEEDS.map((seed) => generate(difficulty, createSeededRandom(seed)));
      const cages = puzzles.flatMap((puzzle) => puzzle.cages);
      return {
        meanCage: cages.reduce((n, cage) => n + cage.cells.length, 0) / cages.length,
        givens: cages.filter((cage) => cage.operation === "given").length / puzzles.length,
      };
    });
    expect(stats[0].meanCage).toBeLessThan(stats[1].meanCage);
    expect(stats[1].meanCage).toBeLessThan(stats[2].meanCage);
    expect(stats[0].givens).toBeGreaterThan(stats[2].givens);
  });
});

describe("board", () => {
  it("starts with the givens filled in and no notes", () => {
    const board = createBoard(fixture);
    expect(board.values).toEqual([
      [null, null, null, 4],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ]);
    expect(board.notes.flat().every((notes) => notes.length === 0)).toBe(true);
    expect(isGivenCell(fixture, 0, 3)).toBe(true);
    expect(isGivenCell(fixture, 0, 0)).toBe(false);
  });

  it("writes and clears digits without touching the old board", () => {
    const start = createBoard(fixture);
    const next = setCellValue(fixture, start, 1, 1, 4);
    expect(next.values[1][1]).toBe(4);
    expect(start.values[1][1]).toBeNull();
    expect(setCellValue(fixture, next, 1, 1, null).values[1][1]).toBeNull();
  });

  it("keeps givens fixed and ignores digits or cells off the board", () => {
    const board = createBoard(fixture);
    expect(setCellValue(fixture, board, 0, 3, 1)).toBe(board);
    expect(clearCell(fixture, board, 0, 3)).toBe(board);
    expect(toggleNote(fixture, board, 0, 3, 2)).toBe(board);
    expect(setCellValue(fixture, board, 0, 0, 5)).toBe(board);
    expect(setCellValue(fixture, board, 0, 0, 0)).toBe(board);
    expect(setCellValue(fixture, board, 4, 0, 1)).toBe(board);
    expect(toggleNote(fixture, board, 0, 0, 7)).toBe(board);
  });

  it("allows a wrong digit and shows it as a conflict, not a loss", () => {
    const board = setCellValue(fixture, createBoard(fixture), 0, 0, 4);
    expect(board.values[0][0]).toBe(4);
    expect(getConflictingCells(board.values)).toEqual(new Set(["0,0", "0,3"]));
    expect(isSolved(fixture, board.values)).toBe(false);
  });

  describe("notes", () => {
    it("toggles notes on and off and keeps them sorted", () => {
      let board = createBoard(fixture);
      board = toggleNote(fixture, board, 2, 2, 3);
      board = toggleNote(fixture, board, 2, 2, 1);
      board = toggleNote(fixture, board, 2, 2, 4);
      expect(board.notes[2][2]).toEqual([1, 3, 4]);
      board = toggleNote(fixture, board, 2, 2, 3);
      expect(board.notes[2][2]).toEqual([1, 4]);
    });

    it("drops a cell's notes when a digit goes in, and takes none while it holds one", () => {
      let board = toggleNote(fixture, createBoard(fixture), 2, 2, 1);
      board = setCellValue(fixture, board, 2, 2, 4);
      expect(board.notes[2][2]).toEqual([]);
      expect(toggleNote(fixture, board, 2, 2, 2)).toBe(board);
    });

    it("keeps notes when a digit is erased, and clearCell empties both", () => {
      let board = toggleNote(fixture, createBoard(fixture), 3, 3, 2);
      board = setCellValue(fixture, board, 3, 3, null);
      expect(board.notes[3][3]).toEqual([2]);
      board = setCellValue(fixture, board, 3, 3, 1);
      board = clearCell(fixture, board, 3, 3);
      expect(board.values[3][3]).toBeNull();
      expect(board.notes[3][3]).toEqual([]);
    });
  });

  describe("conflicts", () => {
    it("flags every cell that repeats a digit in its row or column", () => {
      const values: Grid = [
        [1, null, 1, null],
        [null, 2, null, null],
        [null, 2, null, 3],
        [null, null, null, 3],
      ];
      expect(getConflictingCells(values)).toEqual(
        new Set(["0,0", "0,2", "1,1", "2,1", "2,3", "3,3"])
      );
    });

    it("ignores empty cells and diagonal repeats", () => {
      expect(
        getConflictingCells([
          [1, null, null, null],
          [null, 1, null, null],
          [null, null, null, null],
          [null, null, null, null],
        ])
      ).toEqual(new Set());
      expect(getConflictingCells(solution4)).toEqual(new Set());
    });
  });

  describe("win", () => {
    it("is won only once every cell is filled and every rule holds", () => {
      expect(isSolved(fixture, solution4)).toBe(true);

      const missing = copy(solution4);
      missing[3][3] = null;
      expect(isSolved(fixture, missing)).toBe(false);

      // A Latin square that breaks a cage.
      const swapped = copy(solution4).map((row) => [row[1], row[0], row[2], row[3]]);
      expect(isLatinSquare(swapped as number[][], 4)).toBe(true);
      expect(isSolved(fixture, swapped)).toBe(false);
    });

    it("can be reached by playing the solution into a fresh board", () => {
      const puzzle = generate("medium", createSeededRandom(5));
      let board = createBoard(puzzle);
      puzzle.solution.forEach((row, r) => {
        row.forEach((digit, c) => {
          board = setCellValue(puzzle, board, r, c, digit);
        });
      });
      expect(isSolved(puzzle, board.values)).toBe(true);
    });
  });
});

describe("labels", () => {
  it("names a cage the way a screen reader says it", () => {
    expect(fixture.cages.map(describeCage)).toEqual([
      "cage 2 minus, 2 cells",
      "cage 6 times, 2 cells",
      "given 4",
      "cage 4 divided by, 2 cells",
      "cage 5 plus, 2 cells",
      "cage 9 plus, 3 cells",
      "cage 3 minus, 2 cells",
      "cage 2 divided by, 2 cells",
    ]);
  });

  it("describes a cell's place, cage and contents", () => {
    const base = {
      row: 2,
      col: 0,
      cage: fixture.cages[5],
      value: null,
      notes: [],
      conflict: false,
      cageStatus: "incomplete" as const,
    };
    expect(describeCell(base)).toBe("Row 3, column 1, cage 9 plus, 3 cells, empty");
    expect(describeCell({ ...base, notes: [1, 3, 4] })).toBe(
      "Row 3, column 1, cage 9 plus, 3 cells, empty, notes 1, 3 and 4"
    );
    expect(describeCell({ ...base, value: 2, notes: [1] })).toBe(
      "Row 3, column 1, cage 9 plus, 3 cells, 2"
    );
    expect(describeCell({ ...base, value: 4, conflict: true, cageStatus: "violated" })).toBe(
      "Row 3, column 1, cage 9 plus, 3 cells, 4, repeats in its row or column, cage not met"
    );
    expect(
      describeCell({
        ...base,
        row: 0,
        col: 3,
        cage: fixture.cages[2],
        value: 4,
        cageStatus: "satisfied",
      })
    ).toBe("Row 1, column 4, given 4");
  });
});
