/**
 * The settings each game last started with. A game opens straight onto a board at these
 * settings when there is no saved game to resume. The keys and shapes are the ones the old
 * setup screens wrote, so existing players keep their choice.
 */

import type { Difficulty as CalcudokuDifficulty } from "./calcudoku";
import type { Difficulty as MinesweeperDifficulty } from "./minesweeper";
import {
  isRecord,
  loadStoredJSON,
  loadStoredString,
  saveStoredJSON,
  saveStoredString,
} from "./storage";
import { STORAGE_KEYS } from "./storageKeys";
import type { GridSize, Difficulty as SudokuDifficulty } from "./sudoku";
import type { Variant } from "./wordle";

export interface SudokuPreferences {
  size: GridSize;
  difficulty: SudokuDifficulty;
}

const SUDOKU_DEFAULTS: SudokuPreferences = { size: 9, difficulty: "medium" };

function isSudokuPreferences(value: unknown): value is SudokuPreferences {
  return (
    isRecord(value) &&
    (value.size === 4 || value.size === 6 || value.size === 9) &&
    (value.difficulty === "easy" || value.difficulty === "medium" || value.difficulty === "hard")
  );
}

export function loadSudokuPreferences(): SudokuPreferences {
  return loadStoredJSON(STORAGE_KEYS.sudokuPreferences, isSudokuPreferences) ?? SUDOKU_DEFAULTS;
}

export function saveSudokuPreferences(preferences: SudokuPreferences) {
  saveStoredJSON(STORAGE_KEYS.sudokuPreferences, preferences);
}

function isWordlePreferences(value: unknown): value is { variant: Variant } {
  return isRecord(value) && (value.variant === 4 || value.variant === 5 || value.variant === 6);
}

export function loadWordleVariant(): Variant {
  return loadStoredJSON(STORAGE_KEYS.wordlePreferences, isWordlePreferences)?.variant ?? 5;
}

export function saveWordleVariant(variant: Variant) {
  saveStoredJSON(STORAGE_KEYS.wordlePreferences, { variant });
}

const MINESWEEPER_DIFFICULTIES = ["beginner", "intermediate", "expert"] as const;

export function loadMinesweeperDifficulty(): MinesweeperDifficulty {
  return loadStoredString(
    STORAGE_KEYS.minesweeperPreferences,
    MINESWEEPER_DIFFICULTIES,
    "beginner"
  );
}

export function saveMinesweeperDifficulty(difficulty: MinesweeperDifficulty) {
  saveStoredString(STORAGE_KEYS.minesweeperPreferences, difficulty);
}

const CALCUDOKU_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export function loadCalcudokuDifficulty(): CalcudokuDifficulty {
  return loadStoredString(STORAGE_KEYS.calcudokuPreferences, CALCUDOKU_DIFFICULTIES, "medium");
}

export function saveCalcudokuDifficulty(difficulty: CalcudokuDifficulty) {
  saveStoredString(STORAGE_KEYS.calcudokuPreferences, difficulty);
}
