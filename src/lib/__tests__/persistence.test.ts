import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getNextTileIdSeed, isPersisted2048Session } from "../game2048Session";
import { isPersistedMinesweeperSession } from "../minesweeperSession";
import {
  loadStoredJSON,
  loadStoredNumber,
  loadStoredString,
  removeStoredValue,
  saveStoredJSON,
  saveStoredNumber,
  saveStoredString,
} from "../storage";
import { isPersistedSudokuSession } from "../sudokuSession";
import { createEmptyRecentWordleAnswers, addRecentWordleAnswer } from "../wordlePersistence";
import { pickRandomSolution } from "../wordle";

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

describe("storage helpers", () => {
  const localStorageMock = new LocalStorageMock();

  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: localStorageMock });
    vi.stubGlobal("localStorage", localStorageMock);
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips JSON values", () => {
    saveStoredJSON("prefs", { variant: 5 });
    const loaded = loadStoredJSON(
      "prefs",
      (value): value is { variant: number } =>
        typeof value === "object" && value !== null && "variant" in value
    );
    expect(loaded).toEqual({ variant: 5 });
  });

  it("returns fallback values for invalid strings and numbers", () => {
    saveStoredString("difficulty", "expert");
    saveStoredNumber("score", 42);
    localStorageMock.setItem("broken-number", "nope");

    expect(loadStoredString("difficulty", ["beginner", "expert"] as const, "beginner")).toBe(
      "expert"
    );
    expect(loadStoredNumber("score", 0)).toBe(42);
    expect(loadStoredNumber("broken-number", 7)).toBe(7);
  });

  it("removes stored values", () => {
    saveStoredString("theme", "dark");
    removeStoredValue("theme");
    expect(loadStoredString("theme", ["light", "dark"] as const, "light")).toBe("light");
  });
});

describe("session validators", () => {
  it("accepts a valid 2048 session and derives the next tile id seed", () => {
    const session = {
      phase: "playing",
      grid: [
        [2, 0, 0, 0],
        [0, 4, 0, 0],
        [0, 0, 8, 0],
        [0, 0, 0, 16],
      ],
      tiles: [
        { id: 2, value: 2, row: 0, col: 0, isNew: false, isMerging: false },
        { id: 7, value: 4, row: 1, col: 1, isNew: false, isMerging: false },
      ],
      score: 32,
      timerSeconds: 12,
      hasShownWin: false,
      gameOver: false,
      hasWonOnce: false,
      hasStartedPlaying: true,
      nextTileId: 8,
    };

    expect(isPersisted2048Session(session)).toBe(true);
    expect(getNextTileIdSeed(session.tiles)).toBe(8);
  });

  it("accepts a valid sudoku session", () => {
    const session = {
      phase: "playing",
      gridSize: 4,
      difficulty: "easy",
      puzzle: [
        [1, null, null, 4],
        [null, 4, 1, null],
        [2, null, 4, null],
        [null, 3, null, 1],
      ],
      solution: [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 1, 4, 3],
        [4, 3, 2, 1],
      ],
      userBoard: [
        [1, 2, null, 4],
        [null, 4, 1, null],
        [2, null, 4, null],
        [null, 3, null, 1],
      ],
      timerSeconds: 25,
      selectedCell: [0, 1],
      hasStartedFilling: true,
    };

    expect(isPersistedSudokuSession(session)).toBe(true);
  });

  it("accepts a valid minesweeper session", () => {
    const session = {
      phase: "playing",
      difficulty: "beginner",
      board: [
        [
          { state: "revealed", value: 0, isMine: false },
          { state: "hidden", value: 1, isMine: false },
        ],
        [
          { state: "hidden", value: -1, isMine: true },
          { state: "flagged", value: 1, isMine: false },
        ],
      ],
      rows: 2,
      cols: 2,
      mineCount: 1,
      timerSeconds: 10,
      selectedCell: [0, 1],
      digMode: false,
      hasStartedPlaying: true,
      boardGenerated: true,
    };

    expect(isPersistedMinesweeperSession(session)).toBe(true);
  });
});

describe("wordle persistence helpers", () => {
  it("dedupes and caps recent answers", () => {
    let recent = createEmptyRecentWordleAnswers();
    for (const word of [
      "crane",
      "slate",
      "brick",
      "flint",
      "pride",
      "shone",
      "glove",
      "tread",
      "crane",
    ]) {
      recent = addRecentWordleAnswer(recent, 5, word);
    }

    expect(recent[5]).toHaveLength(8);
    expect(recent[5][recent[5].length - 1]).toBe("crane");
    expect(recent[5].filter((word) => word === "crane")).toHaveLength(1);
  });

  it("avoids recently used answers when alternatives exist", () => {
    const wordList = {
      solutions: ["crane", "slate", "flint"],
      guesses: ["crane", "slate", "flint"],
    };

    expect(pickRandomSolution(wordList, ["crane", "slate"])).toBe("flint");
  });
});
