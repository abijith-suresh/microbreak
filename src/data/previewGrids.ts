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

/**
 * Where the mines sit on the 8×8 Minesweeper preview: the flagged cells of the resting frame
 * plus five still hidden. Opened cells show their real neighbour counts from this layout.
 */
export const MINESWEEPER_PREVIEW_MINES = new Set([3, 7, 14, 19, 28, 32, 42, 46, 55, 57]);

/** How many of a cell's neighbours are mines, on the 8×8 preview. */
export function previewMineCount(index: number): number {
  const row = Math.floor(index / 8);
  const col = index % 8;
  let count = 0;
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r < 0 || r > 7 || c < 0 || c > 7 || (r === row && c === col)) continue;
      if (MINESWEEPER_PREVIEW_MINES.has(r * 8 + c)) count++;
    }
  }
  return count;
}

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

/**
 * The Calcudoku preview: a 5×5 puzzle with one solution. CALCUDOKU_PREVIEW_CAGES names each
 * cell's cage by letter, and CALCUDOKU_PREVIEW_CLUES gives each cage's clue.
 */
export const CALCUDOKU_PREVIEW_SOLUTION = [
  3, 2, 1, 4, 5, 1, 3, 2, 5, 4, 4, 5, 3, 1, 2, 2, 4, 5, 3, 1, 5, 1, 4, 2, 3,
];

export const CALCUDOKU_PREVIEW_CAGES = ["CKDDD", "CEBBF", "GEIIF", "GAHIF", "JAHHF"].join("");

export const CALCUDOKU_PREVIEW_CLUES: Record<string, string> = {
  A: "3−",
  B: "7+",
  C: "3÷",
  D: "20×",
  E: "8+",
  F: "10+",
  G: "2÷",
  H: "40×",
  I: "9×",
  J: "5",
  K: "2",
};

/** At rest: givens and a few cages filled ("#"), the rest empty ("."). */
export const CALCUDOKU_RESTING_CELLS = new Set(
  [...["#####", "#.##.", "#....", "#....", "#...."].join("")].flatMap((ch, i) =>
    ch === "#" ? [i] : []
  )
);

/** Pencil notes on the resting board, by cell index. */
export const CALCUDOKU_PREVIEW_NOTES: Record<number, number[]> = {
  6: [3, 5],
  11: [3, 5],
  12: [1, 3],
  16: [1, 4],
};

/** On hover the board fills these cells in turn (cages E, A and H), then starts over. */
export const CALCUDOKU_FILL_ORDER = [6, 11, 16, 21, 17, 22, 23];
