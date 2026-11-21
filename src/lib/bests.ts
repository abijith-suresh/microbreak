/**
 * Personal bests, one per game and variant, kept on this device only.
 *
 *   Sudoku       fastest win per size and difficulty
 *   Minesweeper  fastest win per difficulty and board size
 *   Wordle       fewest guesses per word length; the faster win breaks a tie
 *   2048         highest score
 *
 * Only the best result is stored: no history, streaks or counts.
 */

import { formatDuration } from "./elapsedTimer";
import type { Difficulty as MinesweeperDifficulty } from "./minesweeper";
import { isRecord, loadStoredJSON, loadStoredNumber, saveStoredJSON } from "./storage";
import { STORAGE_KEYS } from "./storageKeys";
import type { GridSize, Difficulty as SudokuDifficulty } from "./sudoku";
import type { Variant } from "./wordle";

export interface TimeBest {
  seconds: number;
}
export interface GuessBest {
  guesses: number;
  seconds: number;
}
export interface ScoreBest {
  score: number;
}

interface BestByGame {
  sudoku: TimeBest;
  minesweeper: TimeBest;
  wordle: GuessBest;
  "2048": ScoreBest;
}

export type BestGame = keyof BestByGame;

interface StoredBests {
  version: 1;
  games: { [G in BestGame]: Record<string, BestByGame[G]> };
}

export interface RecordedBest<T> {
  /** True when the result beat the stored best, or there was none. */
  isNew: boolean;
  /** The best before this result. */
  previous: T | null;
}

// ── Variant keys ────────────────────────────────────────────────────────────

export function sudokuVariant(size: GridSize, difficulty: SudokuDifficulty): string {
  return `${size}x${size}-${difficulty}`;
}

export function minesweeperVariant(
  difficulty: MinesweeperDifficulty,
  cols: number,
  rows: number
): string {
  return `${difficulty}-${cols}x${rows}`;
}

export function wordleVariant(variant: Variant): string {
  return String(variant);
}

export const GAME_2048_VARIANT = "classic";

// ── Rules ───────────────────────────────────────────────────────────────────

const isCount = (value: unknown, min: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min;

const VALID: { [G in BestGame]: (value: unknown) => value is BestByGame[G] } = {
  sudoku: (v): v is TimeBest => isRecord(v) && isCount(v.seconds, 0),
  minesweeper: (v): v is TimeBest => isRecord(v) && isCount(v.seconds, 0),
  wordle: (v): v is GuessBest =>
    isRecord(v) && Number.isInteger(v.guesses) && isCount(v.guesses, 1) && isCount(v.seconds, 0),
  "2048": (v): v is ScoreBest => isRecord(v) && isCount(v.score, 0),
};

const BEATS: { [G in BestGame]: (next: BestByGame[G], best: BestByGame[G]) => boolean } = {
  sudoku: (next, best) => next.seconds < best.seconds,
  minesweeper: (next, best) => next.seconds < best.seconds,
  wordle: (next, best) =>
    next.guesses < best.guesses || (next.guesses === best.guesses && next.seconds < best.seconds),
  "2048": (next, best) => next.score > best.score,
};

const GAMES = Object.keys(VALID) as BestGame[];

// ── Storage ─────────────────────────────────────────────────────────────────

function emptyBests(): StoredBests {
  return { version: 1, games: { sudoku: {}, minesweeper: {}, wordle: {}, "2048": {} } };
}

/** Reads the store, keeping every valid entry and dropping anything else. */
function readBests(): StoredBests {
  const raw = loadStoredJSON(STORAGE_KEYS.bests, isRecord);
  const bests = emptyBests();
  if (raw?.version !== 1 || !isRecord(raw.games)) return bests;

  for (const game of GAMES) {
    const entries = raw.games[game];
    if (!isRecord(entries)) continue;
    for (const [variant, best] of Object.entries(entries)) {
      if (VALID[game](best)) (bests.games[game] as Record<string, unknown>)[variant] = best;
    }
  }
  return bests;
}

export function getBest<G extends BestGame>(game: G, variant: string): BestByGame[G] | null {
  const best = readBests().games[game][variant] ?? null;
  if (best || game !== "2048") return best;

  // 2048 kept its best score under its own key before this store existed.
  const legacy = loadStoredNumber(STORAGE_KEYS.game2048Best, 0);
  return legacy > 0 ? ({ score: legacy } as BestByGame[G]) : null;
}

/** Stores the result if it beats the current best, and says whether it did. */
export function recordBest<G extends BestGame>(
  game: G,
  variant: string,
  result: BestByGame[G]
): RecordedBest<BestByGame[G]> {
  const previous = getBest(game, variant);
  const isNew = previous === null || BEATS[game](result, previous);
  if (isNew) {
    const bests = readBests();
    (bests.games[game] as Record<string, BestByGame[G]>)[variant] = result;
    saveStoredJSON(STORAGE_KEYS.bests, bests);
  }
  return { isNew, previous };
}

/** The best as people read it: "1m 42s", "3 guesses", "2,048". */
export function describeBest<G extends BestGame>(game: G, best: BestByGame[G]): string {
  if (game === "wordle") {
    const { guesses } = best as GuessBest;
    return `${guesses} ${guesses === 1 ? "guess" : "guesses"}`;
  }
  if (game === "2048") return (best as ScoreBest).score.toLocaleString("en");
  return formatDuration((best as TimeBest).seconds);
}
