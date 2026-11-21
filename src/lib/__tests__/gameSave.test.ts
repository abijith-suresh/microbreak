import { describe, expect, it } from "vitest";
import { isPersistedMinesweeperSession } from "../minesweeperSession";
import { isPersistedSudokuSession } from "../sudokuSession";
import { isPersistedWordleSession } from "../wordleSession";

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
