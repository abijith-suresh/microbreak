/**
 * The Sudoku preview at rest: a puzzle part way through. "g" is a given, "u" a number the
 * player has placed, "." still empty.
 */
const SUDOKU_RESTING_MASK = [
  "gg..g..ug",
  "g.ugg.g..",
  ".gg..u.g.",
  "g..ug.u.g",
  "g.ug.g..g",
  "g...gu..g",
  ".g.u..gg.",
  "...ggg..g",
  "u...g..gg",
].join("");

export const SUDOKU_GIVEN_CELLS = new Set(
  [...SUDOKU_RESTING_MASK].flatMap((ch, i) => (ch === "g" ? [i] : []))
);

export const SUDOKU_RESTING_CELLS = new Set(
  [...SUDOKU_RESTING_MASK].flatMap((ch, i) => (ch === "." ? [] : [i]))
);

export const STATIC_MINESWEEPER_CELLS: ("hidden" | "revealed" | "flagged")[] = [
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "hidden",
  "flagged",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "flagged",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "flagged",
  "hidden",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "hidden",
  "hidden",
  "revealed",
  "flagged",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "flagged",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
];

export const SUDOKU_PREVIEW_PATTERN = [
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6, 1,
  4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7,
  4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
];

/** The Wordle preview rests with this many rows guessed. */
export const WORDLE_RESTING_ROWS = 2;

export const WORDLE_PREVIEW_WORDS = ["crane", "slate", "trace", "crate", "stare"];

export const WORDLE_PREVIEW_COLORS: ("absent" | "correct" | "present")[][] = [
  ["absent", "correct", "present", "absent", "correct"],
  ["correct", "absent", "present", "absent", "correct"],
  ["present", "absent", "correct", "present", "absent"],
  ["absent", "present", "correct", "absent", "correct"],
  ["correct", "correct", "correct", "correct", "correct"],
];
