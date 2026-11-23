import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCEPTED_DENSITY,
  applyStroke,
  type CellMark,
  countSolutions,
  createEmptyMarks,
  deriveClues,
  EMPTY,
  FILLED,
  fillRatio,
  generatePuzzle,
  isSolved,
  type Knowledge,
  lineClue,
  type Marks,
  NONOGRAM_SIZES,
  type NonogramSize,
  puzzleFromSolution,
  type Solution,
  satisfiedClues,
  setMark,
  solveByLines,
  solveLine,
  startStroke,
  strokeCells,
  UNKNOWN,
} from "../nonogram";
import {
  decodeSolution,
  encodeSolution,
  isPersistedNonogramSession,
  type PersistedNonogramSession,
} from "../nonogramSession";
import { createSeededRandom } from "../random";
import { loadStoredJSON, saveStoredJSON } from "../storage";
import { STORAGE_KEYS } from "../storageKeys";

const grid = (rows: string[]): Solution => rows.map((row) => [...row].map((c) => c === "#"));
const line = (cells: string): Knowledge[] =>
  [...cells].map((c) => (c === "#" ? FILLED : c === "." ? EMPTY : UNKNOWN));
const show = (cells: Knowledge[] | null) =>
  cells?.map((c) => (c === FILLED ? "#" : c === EMPTY ? "." : "?")).join("") ?? null;

/** Marks that fill exactly the solution's cells. */
const solvedMarks = (solution: Solution): Marks =>
  solution.map((row) => row.map((filled): CellMark => (filled ? "filled" : "empty")));

// A heart: line logic solves it from the clues alone.
const HEART = grid([".#.#.", "#####", "#####", ".###.", "..#.."]);

describe("clues", () => {
  it("lists the runs of filled cells in order", () => {
    expect(lineClue([true, true, false, true, false, false, true, true, true])).toEqual([2, 1, 3]);
    expect(lineClue([false, true, true, true, true])).toEqual([4]);
    expect(lineClue([true, true, true])).toEqual([3]);
  });

  it("gives an empty line no runs", () => {
    expect(lineClue([false, false, false])).toEqual([]);
  });

  it("derives row and column clues from a picture", () => {
    expect(deriveClues(HEART)).toEqual({
      rowClues: [[1, 1], [5], [5], [3], [1]],
      colClues: [[2], [4], [4], [4], [2]],
    });
  });
});

describe("line solver", () => {
  it("marks the overlap every placement shares", () => {
    expect(show(solveLine([4], line("?????")))).toBe("?###?");
    expect(show(solveLine([3, 1], line("?????")))).toBe("###.#");
    expect(show(solveLine([2], line("?????")))).toBe("?????");
  });

  it("uses what is already known", () => {
    expect(show(solveLine([2], line("#????")))).toBe("##...");
    expect(show(solveLine([1, 1], line("??.??")))).toBe("??.??");
    expect(show(solveLine([3], line("?.???")))).toBe("..###");
  });

  it("empties a line with no runs and fills a full one", () => {
    expect(show(solveLine([], line("???")))).toBe("...");
    expect(show(solveLine([3], line("???")))).toBe("###");
  });

  it("reports a line no placement fits", () => {
    expect(solveLine([3], line("?.?.?"))).toBeNull();
    expect(solveLine([1], line("#.#"))).toBeNull();
    expect(solveLine([], line("..#"))).toBeNull();
  });

  it("solves a line-logic puzzle without guessing", () => {
    const { rowClues, colClues } = deriveClues(HEART);
    const result = solveByLines(rowClues, colClues);
    expect(result.status).toBe("solved");
    if (result.status === "solved") {
      expect(result.grid.map((row) => row.map((c) => c === FILLED))).toEqual(HEART);
    }
  });

  it("gets stuck on a puzzle that needs a guess", () => {
    // Two diagonals share the same clues, so line logic cannot choose.
    const { rowClues, colClues } = deriveClues(grid(["#....", ".#...", "..#..", "...#.", "....#"]));
    expect(solveByLines(rowClues, colClues).status).toBe("stuck");
    expect(countSolutions(rowClues, colClues)).toBe(2);
  });

  it("counts one solution for a line-solvable puzzle", () => {
    const { rowClues, colClues } = deriveClues(HEART);
    expect(countSolutions(rowClues, colClues)).toBe(1);
  });

  it("counts no solution for clues that cannot all hold", () => {
    expect(countSolutions([[2], []], [[2], []])).toBe(0);
  });
});

describe("generator", () => {
  it("gives the same puzzle for the same seed", () => {
    expect(generatePuzzle(10, createSeededRandom(7))).toEqual(
      generatePuzzle(10, createSeededRandom(7))
    );
    expect(generatePuzzle(10, createSeededRandom(7))).not.toEqual(
      generatePuzzle(10, createSeededRandom(8))
    );
  });

  describe.each(NONOGRAM_SIZES)("%i×%i", (size: NonogramSize) => {
    const puzzles = Array.from({ length: 25 }, (_, seed) =>
      generatePuzzle(size, createSeededRandom(seed * 101 + size))
    );

    it("builds a square grid whose clues come from its picture", () => {
      for (const puzzle of puzzles) {
        expect(puzzle.size).toBe(size);
        expect(puzzle.solution).toHaveLength(size);
        for (const row of puzzle.solution) expect(row).toHaveLength(size);
        expect(deriveClues(puzzle.solution)).toEqual({
          rowClues: puzzle.rowClues,
          colClues: puzzle.colClues,
        });
      }
    });

    it("can be solved by line logic alone, back to its own picture", () => {
      for (const puzzle of puzzles) {
        const result = solveByLines(puzzle.rowClues, puzzle.colClues);
        expect(result.status).toBe("solved");
        if (result.status === "solved") {
          expect(result.grid.map((row) => row.map((c) => c === FILLED))).toEqual(puzzle.solution);
        }
      }
    });

    it("has exactly one solution", () => {
      for (const puzzle of puzzles) {
        expect(countSolutions(puzzle.rowClues, puzzle.colClues)).toBe(1);
      }
    });

    it("keeps a reasonable fill and no blank lines", () => {
      for (const puzzle of puzzles) {
        const ratio = fillRatio(puzzle.solution);
        expect(ratio).toBeGreaterThanOrEqual(ACCEPTED_DENSITY.min);
        expect(ratio).toBeLessThanOrEqual(ACCEPTED_DENSITY.max);
        expect(puzzle.rowClues.every((clue) => clue.length > 0)).toBe(true);
        expect(puzzle.colClues.every((clue) => clue.length > 0)).toBe(true);
      }
    });
  });

  it("generates a 15×15 puzzle well under a second", () => {
    const random = createSeededRandom(2026);
    const times: number[] = [];
    for (let i = 0; i < 50; i++) {
      const start = performance.now();
      generatePuzzle(15, random);
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    // A desktop runs this in a few milliseconds; the bound leaves room for a slow phone or CI.
    expect(times[times.length - 1]).toBeLessThan(100);
  });

  it("builds a puzzle from a given picture and refuses other sizes", () => {
    expect(puzzleFromSolution(HEART).rowClues).toEqual([[1, 1], [5], [5], [3], [1]]);
    expect(() => puzzleFromSolution(grid(["##", "#."]))).toThrow();
  });
});

describe("marks", () => {
  it("fills, crosses and clears one cell", () => {
    let marks = createEmptyMarks(5);
    marks = setMark(marks, 1, 2, "filled");
    marks = setMark(marks, 3, 0, "crossed");
    expect(marks[1][2]).toBe("filled");
    expect(marks[3][0]).toBe("crossed");
    marks = setMark(marks, 1, 2, "empty");
    expect(marks[1][2]).toBe("empty");
  });

  it("leaves the marks untouched when nothing changes", () => {
    const marks = createEmptyMarks(5);
    expect(setMark(marks, 0, 0, "empty")).toBe(marks);
    expect(setMark(marks, 9, 9, "filled")).toBe(marks);
  });

  it("keeps a drag to the row or column it mostly follows", () => {
    expect(strokeCells([2, 1], [3, 4])).toEqual([
      [2, 1],
      [2, 2],
      [2, 3],
      [2, 4],
    ]);
    expect(strokeCells([4, 2], [1, 3])).toEqual([
      [4, 2],
      [3, 2],
      [2, 2],
      [1, 2],
    ]);
    expect(strokeCells([0, 0], [0, 0])).toEqual([[0, 0]]);
  });

  it("paints a dragged line without overwriting crosses", () => {
    let marks = setMark(createEmptyMarks(5), 0, 2, "crossed");
    const stroke = startStroke(marks, 0, 0, "filled");
    expect(stroke).toEqual({ mark: "filled", erase: false });
    marks = applyStroke(marks, [0, 0], [0, 4], stroke);
    expect(marks[0]).toEqual(["filled", "filled", "crossed", "filled", "filled"]);
  });

  it("erases along a drag that starts on a cell with the same mark", () => {
    let marks = applyStroke(createEmptyMarks(5), [0, 0], [0, 4], {
      mark: "filled",
      erase: false,
    });
    marks = setMark(marks, 0, 3, "crossed");
    const stroke = startStroke(marks, 0, 1, "filled");
    expect(stroke.erase).toBe(true);
    marks = applyStroke(marks, [0, 1], [0, 4], stroke);
    expect(marks[0]).toEqual(["filled", "empty", "empty", "crossed", "empty"]);
  });

  it("toggles a single cell with a tap", () => {
    let marks = createEmptyMarks(5);
    marks = applyStroke(marks, [2, 2], [2, 2], startStroke(marks, 2, 2, "crossed"));
    expect(marks[2][2]).toBe("crossed");
    marks = applyStroke(marks, [2, 2], [2, 2], startStroke(marks, 2, 2, "crossed"));
    expect(marks[2][2]).toBe("empty");
  });

  it("stops a drag at the edge of the board", () => {
    const marks = createEmptyMarks(5);
    const next = applyStroke(marks, [0, 3], [0, 9], startStroke(marks, 0, 3, "filled"));
    expect(next[0]).toEqual(["empty", "empty", "empty", "filled", "filled"]);
  });
});

describe("progress and winning", () => {
  const puzzle = puzzleFromSolution(HEART);

  it("is won once the filled cells match the picture", () => {
    expect(isSolved(puzzle, createEmptyMarks(5))).toBe(false);
    expect(isSolved(puzzle, solvedMarks(HEART))).toBe(true);
  });

  it("treats crosses as notes, not filled cells", () => {
    const marks = solvedMarks(HEART).map((row) =>
      row.map((mark): CellMark => (mark === "empty" ? "crossed" : mark))
    );
    expect(isSolved(puzzle, marks)).toBe(true);
  });

  it("allows mistakes and is won again once they are fixed", () => {
    let marks = setMark(solvedMarks(HEART), 0, 0, "filled");
    expect(isSolved(puzzle, marks)).toBe(false);
    marks = setMark(marks, 0, 0, "empty");
    expect(isSolved(puzzle, marks)).toBe(true);
  });

  it("says which clues the filled cells already match", () => {
    let marks = createEmptyMarks(5);
    marks = applyStroke(marks, [1, 0], [1, 4], { mark: "filled", erase: false });
    marks = setMark(marks, 4, 2, "filled");
    const { rows, cols } = satisfiedClues(puzzle, marks);
    expect(rows).toEqual([false, true, false, false, true]);
    expect(cols).toEqual([false, false, false, false, false]);
    expect(satisfiedClues(puzzle, solvedMarks(HEART))).toEqual({
      rows: [true, true, true, true, true],
      cols: [true, true, true, true, true],
    });
  });

  it("wins every generated puzzle when its picture is filled in", () => {
    for (const size of NONOGRAM_SIZES) {
      const generated = generatePuzzle(size, createSeededRandom(size));
      expect(isSolved(generated, solvedMarks(generated.solution))).toBe(true);
    }
  });
});

describe("saved game", () => {
  function createStorage() {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
  }

  beforeEach(() => vi.stubGlobal("window", { localStorage: createStorage() }));
  afterEach(() => vi.unstubAllGlobals());

  const puzzle = generatePuzzle(10, createSeededRandom(3));
  const session: PersistedNonogramSession = {
    status: "playing",
    newBest: false,
    timerSeconds: 83,
    size: 10,
    solution: encodeSolution(puzzle.solution),
    marks: setMark(setMark(createEmptyMarks(10), 0, 0, "filled"), 9, 9, "crossed"),
    mode: "cross",
    selectedCell: [4, 7],
    hasStartedPlaying: true,
  };

  it("survives a save and reload", () => {
    saveStoredJSON(STORAGE_KEYS.nonogramSession, session);
    const loaded = loadStoredJSON(STORAGE_KEYS.nonogramSession, isPersistedNonogramSession);
    expect(loaded).toEqual(session);
    expect(puzzleFromSolution(decodeSolution(loaded?.solution ?? []))).toEqual(puzzle);
  });

  it("keeps a won game", () => {
    expect(isPersistedNonogramSession({ ...session, status: "won", newBest: true })).toBe(true);
  });

  it.each([
    ["a lost game", { status: "lost" }],
    ["a missing header", { timerSeconds: undefined }],
    ["an unknown size", { size: 8 }],
    ["a short solution", { solution: session.solution.slice(1) }],
    ["a solution with other characters", { solution: ["01x", ...session.solution.slice(1)] }],
    [
      "an unknown mark",
      { marks: [["dot", ...session.marks[0].slice(1)], ...session.marks.slice(1)] },
    ],
    ["marks of the wrong size", { marks: createEmptyMarks(5) }],
    ["no start flag", { hasStartedPlaying: "yes" }],
    ["an unknown mode", { mode: "erase" }],
    ["a selected cell off the board", { selectedCell: [10, 0] }],
  ])("rejects %s", (_, change) => {
    expect(isPersistedNonogramSession({ ...session, ...change })).toBe(false);
  });
});
