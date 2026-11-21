import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadSave } from "../gameSave";
import { isPersistedMinesweeperSession } from "../minesweeperSession";
import { STORAGE_KEYS } from "../storageKeys";
import { isPersistedSudokuSession } from "../sudokuSession";
import { isPersistedWordleSession } from "../wordleSession";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

const solved4 = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

const sudoku = {
  status: "won",
  newBest: true,
  gridSize: 4,
  difficulty: "easy",
  puzzle: [
    [1, null, null, 4],
    [null, 4, 1, null],
    [2, null, 4, null],
    [null, 3, null, 1],
  ],
  solution: solved4,
  userBoard: solved4,
  timerSeconds: 41,
  selectedCell: [3, 3],
  hasStartedFilling: true,
};

const wordle = {
  status: "lost",
  newBest: false,
  variant: 4,
  answer: "mint",
  guesses: Array.from({ length: 5 }, () => ({
    word: "bard",
    states: ["absent", "absent", "absent", "absent"],
  })),
  currentInput: "",
  timerSeconds: 95,
  hasStartedPlaying: true,
};

const minesweeper = {
  status: "lost",
  newBest: false,
  difficulty: "beginner",
  board: [
    [
      { state: "revealed", value: 1, isMine: false },
      { state: "revealed", value: -1, isMine: true },
    ],
  ],
  rows: 1,
  cols: 2,
  mineCount: 1,
  timerSeconds: 7,
  selectedCell: null,
  digMode: true,
  hasStartedPlaying: true,
  boardGenerated: true,
  triggeredMine: [0, 1],
};

describe("finished saves", () => {
  it("accept a won or lost game for every game", () => {
    expect(isPersistedSudokuSession(sudoku)).toBe(true);
    expect(isPersistedWordleSession(wordle)).toBe(true);
    expect(isPersistedWordleSession({ ...wordle, status: "won", newBest: true })).toBe(true);
    expect(isPersistedMinesweeperSession(minesweeper)).toBe(true);
    expect(isPersistedMinesweeperSession({ ...minesweeper, status: "won" })).toBe(true);
  });

  it("reject an unknown status or a missing best flag", () => {
    expect(isPersistedSudokuSession({ ...sudoku, status: "done" })).toBe(false);
    expect(isPersistedWordleSession({ ...wordle, status: undefined })).toBe(false);
    const { newBest: _, ...noFlag } = minesweeper;
    expect(isPersistedMinesweeperSession(noFlag)).toBe(false);
  });

  it("reject a negative or missing time", () => {
    expect(isPersistedSudokuSession({ ...sudoku, timerSeconds: -1 })).toBe(false);
    expect(isPersistedWordleSession({ ...wordle, timerSeconds: "95" })).toBe(false);
  });

  it("reject a Minesweeper end mine outside the board", () => {
    expect(isPersistedMinesweeperSession({ ...minesweeper, triggeredMine: [3, 0] })).toBe(false);
    expect(isPersistedMinesweeperSession({ ...minesweeper, triggeredMine: null })).toBe(true);
  });
});

describe("loadSave", () => {
  beforeEach(() => vi.stubGlobal("window", { localStorage: createStorage() }));
  afterEach(() => vi.unstubAllGlobals());

  const put = (value: unknown) =>
    window.localStorage.setItem(STORAGE_KEYS.sudokuSession, JSON.stringify(value));

  it("returns a finished game as finished", () => {
    put(sudoku);
    expect(loadSave(STORAGE_KEYS.sudokuSession, isPersistedSudokuSession)).toMatchObject({
      status: "won",
      newBest: true,
      timerSeconds: 41,
    });
  });

  it("reads a save written before finished games were kept as a game in progress", () => {
    const { status: _s, newBest: _n, ...rest } = sudoku;
    put({ ...rest, phase: "playing" });
    expect(loadSave(STORAGE_KEYS.sudokuSession, isPersistedSudokuSession)).toMatchObject({
      status: "playing",
      newBest: false,
    });
  });

  it("returns nothing for a missing, corrupt or invalid save", () => {
    expect(loadSave(STORAGE_KEYS.sudokuSession, isPersistedSudokuSession)).toBeNull();
    window.localStorage.setItem(STORAGE_KEYS.sudokuSession, "{oops");
    expect(loadSave(STORAGE_KEYS.sudokuSession, isPersistedSudokuSession)).toBeNull();
    put({ ...sudoku, gridSize: 5 });
    expect(loadSave(STORAGE_KEYS.sudokuSession, isPersistedSudokuSession)).toBeNull();
  });
});
