import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadCalcudokuDifficulty,
  loadMinesweeperDifficulty,
  loadSudokuPreferences,
  loadWordleVariant,
  saveCalcudokuDifficulty,
  saveMinesweeperDifficulty,
  saveSudokuPreferences,
  saveWordleVariant,
} from "../gamePreferences";
import { STORAGE_KEYS } from "../storageKeys";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("game preferences", () => {
  beforeEach(() => vi.stubGlobal("window", { localStorage: createStorage() }));
  afterEach(() => vi.unstubAllGlobals());

  it("falls back to each game's default when nothing is stored", () => {
    expect(loadSudokuPreferences()).toEqual({ size: 9, difficulty: "medium" });
    expect(loadWordleVariant()).toBe(5);
    expect(loadMinesweeperDifficulty()).toBe("beginner");
    expect(loadCalcudokuDifficulty()).toBe("medium");
  });

  it("returns the settings the last game started with", () => {
    saveSudokuPreferences({ size: 6, difficulty: "hard" });
    saveWordleVariant(4);
    saveMinesweeperDifficulty("expert");
    saveCalcudokuDifficulty("hard");

    expect(loadSudokuPreferences()).toEqual({ size: 6, difficulty: "hard" });
    expect(loadWordleVariant()).toBe(4);
    expect(loadMinesweeperDifficulty()).toBe("expert");
    expect(loadCalcudokuDifficulty()).toBe("hard");
  });

  it("reads the values the old setup screens wrote", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.sudokuPreferences,
      JSON.stringify({ size: 4, difficulty: "easy" })
    );
    window.localStorage.setItem(STORAGE_KEYS.wordlePreferences, JSON.stringify({ variant: 6 }));
    window.localStorage.setItem(STORAGE_KEYS.minesweeperPreferences, "intermediate");

    expect(loadSudokuPreferences()).toEqual({ size: 4, difficulty: "easy" });
    expect(loadWordleVariant()).toBe(6);
    expect(loadMinesweeperDifficulty()).toBe("intermediate");
  });

  it("ignores stored values it does not recognise", () => {
    window.localStorage.setItem(
      STORAGE_KEYS.sudokuPreferences,
      JSON.stringify({ size: 8, difficulty: "medium" })
    );
    window.localStorage.setItem(STORAGE_KEYS.wordlePreferences, JSON.stringify({ variant: 7 }));
    window.localStorage.setItem(STORAGE_KEYS.minesweeperPreferences, "impossible");
    window.localStorage.setItem(STORAGE_KEYS.calcudokuPreferences, "extreme");

    expect(loadSudokuPreferences()).toEqual({ size: 9, difficulty: "medium" });
    expect(loadWordleVariant()).toBe(5);
    expect(loadMinesweeperDifficulty()).toBe("beginner");
    expect(loadCalcudokuDifficulty()).toBe("medium");
  });
});
