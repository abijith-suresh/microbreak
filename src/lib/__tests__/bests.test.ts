import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  describeBest,
  GAME_2048_VARIANT,
  getBest,
  minesweeperVariant,
  recordBest,
  sudokuVariant,
  wordleVariant,
} from "../bests";
import { STORAGE_KEYS } from "../storageKeys";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEYS.bests) ?? "null");
const store = (value: unknown) =>
  window.localStorage.setItem(STORAGE_KEYS.bests, JSON.stringify(value));

describe("personal bests", () => {
  beforeEach(() => vi.stubGlobal("window", { localStorage: createStorage() }));
  afterEach(() => vi.unstubAllGlobals());

  const medium9 = sudokuVariant(9, "medium");

  it("has no best before the first win", () => {
    expect(getBest("sudoku", medium9)).toBeNull();
  });

  it("counts the first win as a new best", () => {
    expect(recordBest("sudoku", medium9, { seconds: 300 })).toEqual({
      isNew: true,
      previous: null,
    });
    expect(getBest("sudoku", medium9)).toEqual({ seconds: 300 });
    expect(stored()).toEqual({
      version: 1,
      games: {
        sudoku: { "9x9-medium": { seconds: 300 } },
        minesweeper: {},
        wordle: {},
        "2048": {},
      },
    });
  });

  it("keeps the faster time and ignores slower or equal ones", () => {
    recordBest("minesweeper", minesweeperVariant("beginner", 9, 9), { seconds: 90 });
    const variant = minesweeperVariant("beginner", 9, 9);

    expect(recordBest("minesweeper", variant, { seconds: 120 })).toEqual({
      isNew: false,
      previous: { seconds: 90 },
    });
    expect(recordBest("minesweeper", variant, { seconds: 90 }).isNew).toBe(false);
    expect(getBest("minesweeper", variant)).toEqual({ seconds: 90 });

    expect(recordBest("minesweeper", variant, { seconds: 61 })).toEqual({
      isNew: true,
      previous: { seconds: 90 },
    });
    expect(getBest("minesweeper", variant)).toEqual({ seconds: 61 });
  });

  it("ranks Wordle by fewest guesses, then by the faster win", () => {
    const five = wordleVariant(5);
    recordBest("wordle", five, { guesses: 4, seconds: 60 });

    expect(recordBest("wordle", five, { guesses: 5, seconds: 10 }).isNew).toBe(false);
    expect(recordBest("wordle", five, { guesses: 4, seconds: 75 }).isNew).toBe(false);
    expect(recordBest("wordle", five, { guesses: 4, seconds: 45 }).isNew).toBe(true);
    expect(recordBest("wordle", five, { guesses: 3, seconds: 200 }).isNew).toBe(true);
    expect(getBest("wordle", five)).toEqual({ guesses: 3, seconds: 200 });
  });

  it("keeps a separate best for each variant", () => {
    recordBest("sudoku", medium9, { seconds: 300 });
    recordBest("sudoku", sudokuVariant(4, "easy"), { seconds: 40 });

    expect(getBest("sudoku", medium9)).toEqual({ seconds: 300 });
    expect(getBest("sudoku", sudokuVariant(4, "easy"))).toEqual({ seconds: 40 });
    expect(getBest("sudoku", sudokuVariant(9, "hard"))).toBeNull();
    expect(getBest("wordle", wordleVariant(6))).toBeNull();
  });

  it("keeps 2048's highest score", () => {
    recordBest("2048", GAME_2048_VARIANT, { score: 1024 });
    expect(recordBest("2048", GAME_2048_VARIANT, { score: 512 }).isNew).toBe(false);
    expect(recordBest("2048", GAME_2048_VARIANT, { score: 2048 })).toEqual({
      isNew: true,
      previous: { score: 1024 },
    });
    expect(getBest("2048", GAME_2048_VARIANT)).toEqual({ score: 2048 });
  });

  describe("corrupt data", () => {
    it.each([
      ["text that is not JSON", "{not json"],
      ["another version", JSON.stringify({ version: 2, games: { sudoku: {} } })],
      ["no games", JSON.stringify({ version: 1 })],
      ["a list", JSON.stringify([1, 2, 3])],
    ])("reads %s as no bests", (_, raw) => {
      window.localStorage.setItem(STORAGE_KEYS.bests, raw);
      expect(getBest("sudoku", medium9)).toBeNull();
      expect(recordBest("sudoku", medium9, { seconds: 300 }).isNew).toBe(true);
      expect(getBest("sudoku", medium9)).toEqual({ seconds: 300 });
    });

    it("drops bad entries and keeps the good ones", () => {
      store({
        version: 1,
        games: {
          sudoku: {
            "9x9-medium": { seconds: 300 },
            "4x4-easy": { seconds: -5 },
            "6x6-hard": { seconds: "fast" },
          },
          wordle: { "5": { guesses: 0, seconds: 10 }, "4": { guesses: 2.5, seconds: 10 } },
          minesweeper: "nope",
        },
      });

      expect(getBest("sudoku", medium9)).toEqual({ seconds: 300 });
      expect(getBest("sudoku", sudokuVariant(4, "easy"))).toBeNull();
      expect(getBest("sudoku", sudokuVariant(6, "hard"))).toBeNull();
      expect(getBest("wordle", wordleVariant(5))).toBeNull();
      expect(getBest("wordle", wordleVariant(4))).toBeNull();

      // The next write keeps only what was valid.
      recordBest("wordle", wordleVariant(5), { guesses: 3, seconds: 50 });
      expect(stored().games.sudoku).toEqual({ "9x9-medium": { seconds: 300 } });
      expect(stored().games.minesweeper).toEqual({});
    });
  });

  it("describes a best the way the result screen shows it", () => {
    expect(describeBest("sudoku", { seconds: 102 })).toBe("1m 42s");
    expect(describeBest("minesweeper", { seconds: 42 })).toBe("42s");
    expect(describeBest("wordle", { guesses: 1, seconds: 9 })).toBe("1 guess");
    expect(describeBest("wordle", { guesses: 3, seconds: 9 })).toBe("3 guesses");
    expect(describeBest("2048", { score: 20480 })).toBe("20,480");
  });
});
