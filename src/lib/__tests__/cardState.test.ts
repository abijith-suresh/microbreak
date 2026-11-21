import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MinesweeperThumb,
  minesweeperCard,
  readCards,
  type SudokuThumb,
  sudokuCard,
  type WordleThumb,
  wordleCard,
} from "../cardState";
import { STORAGE_KEYS } from "../storageKeys";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

const put = (key: string, value: unknown) =>
  window.localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));

const bests = (games: Record<string, unknown>) =>
  put(STORAGE_KEYS.bests, {
    version: 1,
    games: { sudoku: {}, minesweeper: {}, wordle: {}, "2048": {}, ...games },
  });

const solution = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];
const puzzle = solution.map((row) => row.map((v, c) => (c % 2 === 0 ? v : null)));

const sudokuSave = {
  status: "playing",
  newBest: false,
  gridSize: 4,
  difficulty: "easy",
  puzzle,
  solution,
  userBoard: puzzle.map((row, r) => row.map((v, c) => v ?? (r === 0 && c === 1 ? 2 : null))),
  timerSeconds: 252,
  selectedCell: null,
  hasStartedFilling: true,
};

const cell = (state: string, value: number, isMine = false) => ({ state, value, isMine });
const minesweeperSave = (status: string, triggeredMine: [number, number] | null = null) => ({
  status,
  newBest: status === "won",
  difficulty: "beginner",
  // mine at (0,1); (1,1) is a revealed mine when lost
  board: [
    [cell("revealed", 1), cell("hidden", -1, true), cell("flagged", 1)],
    [
      cell("revealed", 1),
      cell(status === "lost" ? "revealed" : "hidden", -1, true),
      cell("hidden", 2),
    ],
  ],
  rows: 2,
  cols: 3,
  mineCount: 2,
  timerSeconds: 102,
  selectedCell: null,
  digMode: true,
  hasStartedPlaying: true,
  boardGenerated: true,
  triggeredMine,
});

describe("home cards", () => {
  beforeEach(() => vi.stubGlobal("window", { localStorage: createStorage() }));
  afterEach(() => vi.unstubAllGlobals());

  it("show a new game with an empty board when nothing is saved", () => {
    const [sudoku, wordle, minesweeper] = readCards();

    expect(sudoku).toMatchObject({ game: "sudoku", status: "new", settings: "9×9 · Medium" });
    expect(sudoku.time).toBeNull();
    expect(sudoku.best).toBeNull();
    const sudokuThumb = sudoku.thumb as SudokuThumb;
    expect(sudokuThumb.cells).toHaveLength(81);
    expect(sudokuThumb.cells.every((c) => c.value === null)).toBe(true);

    expect(wordle).toMatchObject({ status: "new", settings: "5 letters" });
    const rows = (wordle.thumb as WordleThumb).rows;
    expect(rows).toHaveLength(6);
    expect(rows.flat().every((t) => t.letter === "" && t.state === null)).toBe(true);

    expect(minesweeper).toMatchObject({ status: "new", settings: "Easy · 9×9" });
    expect((minesweeper.thumb as MinesweeperThumb).cells.every((c) => c.kind === "hidden")).toBe(
      true
    );
  });

  it("start a new card at the last settings used, with that setting's best", () => {
    put(STORAGE_KEYS.sudokuPreferences, { size: 6, difficulty: "hard" });
    put(STORAGE_KEYS.wordlePreferences, { variant: 4 });
    put(STORAGE_KEYS.minesweeperPreferences, "expert");
    bests({
      sudoku: { "6x6-hard": { seconds: 161 } },
      wordle: { "4": { guesses: 3, seconds: 50 } },
    });

    const sudoku = sudokuCard();
    expect(sudoku).toMatchObject({ status: "new", settings: "6×6 · Hard", best: "2m 41s" });
    expect((sudoku.thumb as SudokuThumb).cells).toHaveLength(36);

    const wordle = wordleCard();
    expect(wordle).toMatchObject({ settings: "4 letters", best: "3 guesses" });
    expect((wordle.thumb as WordleThumb).rows).toHaveLength(5);

    expect(minesweeperCard(false).settings).toBe("Hard · 30×16");
    expect(minesweeperCard(true).settings).toBe("Hard · 10×16");
  });

  it("show a Sudoku in progress as its saved board", () => {
    put(STORAGE_KEYS.sudokuSession, sudokuSave);
    bests({ sudoku: { "4x4-easy": { seconds: 408 } } });

    const card = sudokuCard();
    expect(card).toMatchObject({
      status: "playing",
      settings: "4×4 · Easy",
      time: "4:12",
      best: "6m 48s",
      newBest: false,
    });
    const cells = (card.thumb as SudokuThumb).cells;
    expect(cells[0]).toEqual({ value: 1, given: true });
    expect(cells[1]).toEqual({ value: 2, given: false });
    expect(cells[3]).toEqual({ value: null, given: false });
  });

  it("show a finished Sudoku as solved with its new best", () => {
    put(STORAGE_KEYS.sudokuSession, {
      ...sudokuSave,
      status: "won",
      newBest: true,
      userBoard: solution,
    });
    bests({ sudoku: { "4x4-easy": { seconds: 252 } } });

    expect(sudokuCard()).toMatchObject({ status: "won", best: "4m 12s", newBest: true });
  });

  it("show Wordle guesses but never the answer or the letters being typed", () => {
    put(STORAGE_KEYS.wordleSession, {
      status: "playing",
      newBest: false,
      variant: 5,
      answer: "crane",
      guesses: [{ word: "slate", states: ["absent", "absent", "correct", "absent", "correct"] }],
      currentInput: "bri",
      timerSeconds: 30,
      hasStartedPlaying: true,
    });

    const card = wordleCard();
    expect(card).toMatchObject({ status: "playing", time: "0:30" });
    const rows = (card.thumb as WordleThumb).rows;
    expect(rows[0].map((t) => t.letter).join("")).toBe("slate");
    expect(rows[0][2].state).toBe("correct");
    expect(rows[1].every((t) => t.letter === "")).toBe(true);
    expect(JSON.stringify(card)).not.toMatch(/crane|bri/);
  });

  it("keep hidden mines hidden on a Minesweeper in progress", () => {
    put(STORAGE_KEYS.minesweeperSession, minesweeperSave("playing"));

    const card = minesweeperCard();
    expect(card).toMatchObject({ status: "playing", settings: "Easy · 3×2", time: "1:42" });
    expect((card.thumb as MinesweeperThumb).cells).toEqual([
      { kind: "open", count: 1 },
      { kind: "hidden" },
      { kind: "flag" },
      { kind: "open", count: 1 },
      { kind: "hidden" },
      { kind: "hidden" },
    ]);
  });

  it("show a lost Minesweeper with the mine that ended it", () => {
    put(STORAGE_KEYS.minesweeperSession, minesweeperSave("lost", [1, 1]));

    const card = minesweeperCard();
    expect(card.status).toBe("lost");
    expect((card.thumb as MinesweeperThumb).cells[4]).toEqual({ kind: "mine", hit: true });
    expect((card.thumb as MinesweeperThumb).cells[1]).toEqual({ kind: "hidden" });
  });

  it("flag every mine on a won Minesweeper", () => {
    put(STORAGE_KEYS.minesweeperSession, minesweeperSave("won"));

    const cells = (minesweeperCard().thumb as MinesweeperThumb).cells;
    expect(cells[1]).toEqual({ kind: "flag" });
    expect(cells[4]).toEqual({ kind: "flag" });
    expect(cells[5]).toEqual({ kind: "hidden" });
  });

  it.each([
    ["text that is not JSON", "{oops"],
    ["a save of the wrong shape", { status: "playing", gridSize: 5 }],
    ["an unknown status", { ...sudokuSave, status: "paused" }],
  ])("fall back to an empty board for %s", (_, save) => {
    put(STORAGE_KEYS.sudokuSession, save);
    const card = sudokuCard();
    expect(card.status).toBe("new");
    expect((card.thumb as SudokuThumb).cells.every((c) => c.value === null)).toBe(true);
  });
});
