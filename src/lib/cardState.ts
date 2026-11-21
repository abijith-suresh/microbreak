/**
 * What each home card shows, read from the game's save and its personal best.
 *
 * A card is "new" when there is no readable save, and then shows an empty board at the
 * settings the next game will use. Thumbnails never give away hidden information: no
 * unrevealed mines, no Wordle answer, no Sudoku solution.
 */

import { describeBest, getBest, minesweeperVariant, sudokuVariant, wordleVariant } from "./bests";
import { formatTimer } from "./elapsedTimer";
import {
  loadMinesweeperDifficulty,
  loadSudokuPreferences,
  loadWordleVariant,
} from "./gamePreferences";
import type { SaveStatus } from "./gameSave";
import {
  DIFFICULTY_PRESETS,
  getDifficultyPreset,
  type Difficulty as MinesweeperDifficulty,
  prefersMobilePresets,
} from "./minesweeper";
import { isPersistedMinesweeperSession } from "./minesweeperSession";
import { loadStoredJSON } from "./storage";
import { STORAGE_KEYS } from "./storageKeys";
import type { GridSize, Difficulty as SudokuDifficulty } from "./sudoku";
import { isPersistedSudokuSession } from "./sudokuSession";
import { getMaxGuesses, type LetterState, type Variant } from "./wordle";
import { isPersistedWordleSession } from "./wordleSession";

export type CardGame = "sudoku" | "wordle" | "minesweeper";
export type CardStatus = "new" | SaveStatus;

export interface SudokuThumb {
  kind: "sudoku";
  size: GridSize;
  /** Row by row; `given` cells came with the puzzle. */
  cells: { value: number | null; given: boolean }[];
}

export interface WordleThumb {
  kind: "wordle";
  length: Variant;
  /** One row per allowed guess; rows not yet guessed are empty. */
  rows: { letter: string; state: LetterState | null }[][];
}

export type MineCell =
  | { kind: "hidden" }
  | { kind: "flag" }
  | { kind: "mine"; hit: boolean }
  | { kind: "open"; count: number };

export interface MinesweeperThumb {
  kind: "minesweeper";
  rows: number;
  cols: number;
  cells: MineCell[];
}

export type Thumb = SudokuThumb | WordleThumb | MinesweeperThumb;

export interface CardState {
  game: CardGame;
  status: CardStatus;
  /** The game's settings, e.g. "9×9 · Medium". */
  settings: string;
  /** Clock for a started or finished game, e.g. "3:12". */
  time: string | null;
  /** The personal best at these settings, e.g. "2m 41s" or "3 guesses". */
  best: string | null;
  /** The finished game set that best. */
  newBest: boolean;
  thumb: Thumb;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Sudoku ────────────────────────────────────────────────────────────────────

function sudokuSettings(size: GridSize, difficulty: SudokuDifficulty) {
  return `${size}×${size} · ${capitalize(difficulty)}`;
}

function sudokuBest(size: GridSize, difficulty: SudokuDifficulty) {
  const best = getBest("sudoku", sudokuVariant(size, difficulty));
  return best ? describeBest("sudoku", best) : null;
}

export function sudokuCard(): CardState {
  const save = loadStoredJSON(STORAGE_KEYS.sudokuSession, isPersistedSudokuSession);
  if (!save) {
    const { size, difficulty } = loadSudokuPreferences();
    return {
      game: "sudoku",
      status: "new",
      settings: sudokuSettings(size, difficulty),
      time: null,
      best: sudokuBest(size, difficulty),
      newBest: false,
      thumb: emptySudoku(size),
    };
  }
  return {
    game: "sudoku",
    status: save.status,
    settings: sudokuSettings(save.gridSize, save.difficulty),
    time: formatTimer(save.timerSeconds),
    best: sudokuBest(save.gridSize, save.difficulty),
    newBest: save.newBest,
    thumb: {
      kind: "sudoku",
      size: save.gridSize,
      cells: save.userBoard.flatMap((row, r) =>
        row.map((value, c) => ({ value, given: save.puzzle[r][c] !== null }))
      ),
    },
  };
}

function emptySudoku(size: GridSize): SudokuThumb {
  return {
    kind: "sudoku",
    size,
    cells: Array.from({ length: size * size }, () => ({ value: null, given: false })),
  };
}

// ── Wordle ────────────────────────────────────────────────────────────────────

const wordleSettings = (length: Variant) => `${length} letters`;

function wordleBest(length: Variant) {
  const best = getBest("wordle", wordleVariant(length));
  return best ? describeBest("wordle", best) : null;
}

function wordleRows(length: Variant, guesses: { word: string; states: LetterState[] }[]) {
  return Array.from({ length: getMaxGuesses(length) }, (_, r) =>
    Array.from({ length }, (_, c) => ({
      letter: guesses[r]?.word[c] ?? "",
      state: guesses[r]?.states[c] ?? null,
    }))
  );
}

export function wordleCard(): CardState {
  const save = loadStoredJSON(STORAGE_KEYS.wordleSession, isPersistedWordleSession);
  if (!save) {
    const length = loadWordleVariant();
    return {
      game: "wordle",
      status: "new",
      settings: wordleSettings(length),
      time: null,
      best: wordleBest(length),
      newBest: false,
      thumb: { kind: "wordle", length, rows: wordleRows(length, []) },
    };
  }
  return {
    game: "wordle",
    status: save.status,
    settings: wordleSettings(save.variant),
    time: formatTimer(save.timerSeconds),
    best: wordleBest(save.variant),
    newBest: save.newBest,
    // Guesses only: the letters being typed and the answer stay off the card.
    thumb: { kind: "wordle", length: save.variant, rows: wordleRows(save.variant, save.guesses) },
  };
}

// ── Minesweeper ───────────────────────────────────────────────────────────────

function minesweeperSettings(difficulty: MinesweeperDifficulty, cols: number, rows: number) {
  return `${DIFFICULTY_PRESETS[difficulty].label} · ${cols}×${rows}`;
}

function minesweeperBest(difficulty: MinesweeperDifficulty, cols: number, rows: number) {
  const best = getBest("minesweeper", minesweeperVariant(difficulty, cols, rows));
  return best ? describeBest("minesweeper", best) : null;
}

export function minesweeperCard(isMobile = prefersMobilePresets()): CardState {
  const save = loadStoredJSON(STORAGE_KEYS.minesweeperSession, isPersistedMinesweeperSession);
  if (!save) {
    const difficulty = loadMinesweeperDifficulty();
    const { rows, cols } = getDifficultyPreset(difficulty, isMobile);
    return {
      game: "minesweeper",
      status: "new",
      settings: minesweeperSettings(difficulty, cols, rows),
      time: null,
      best: minesweeperBest(difficulty, cols, rows),
      newBest: false,
      thumb: {
        kind: "minesweeper",
        rows,
        cols,
        cells: Array.from({ length: rows * cols }, () => ({ kind: "hidden" as const })),
      },
    };
  }

  const [hitRow, hitCol] = save.triggeredMine ?? [-1, -1];
  const cells = save.board.flatMap((row, r) =>
    row.map((cell, c): MineCell => {
      if (cell.state === "flagged") return { kind: "flag" };
      if (cell.state === "revealed") {
        return cell.isMine
          ? { kind: "mine", hit: r === hitRow && c === hitCol }
          : { kind: "open", count: cell.value };
      }
      // A won board's untouched mines are known, so show them flagged.
      return save.status === "won" && cell.isMine ? { kind: "flag" } : { kind: "hidden" };
    })
  );

  return {
    game: "minesweeper",
    status: save.status,
    settings: minesweeperSettings(save.difficulty, save.cols, save.rows),
    time: formatTimer(save.timerSeconds),
    best: minesweeperBest(save.difficulty, save.cols, save.rows),
    newBest: save.newBest,
    thumb: { kind: "minesweeper", rows: save.rows, cols: save.cols, cells },
  };
}

// ── All cards ─────────────────────────────────────────────────────────────────

/** Every card, read from this device's saves. Browser only. */
export function readCards(): CardState[] {
  return [sudokuCard(), wordleCard(), minesweeperCard()];
}

/**
 * The cards as the server renders them, before saves can be read: empty boards at the
 * default settings. Each card keeps its size when the real state replaces this.
 */
export function placeholderCards(): CardState[] {
  return [sudokuCard(), wordleCard(), minesweeperCard(false)];
}
