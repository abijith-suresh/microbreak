/** Game icon SVGs for the coming-soon cards */
export const gameIcons: Record<string, string> = {
  Chess: "M12 2L8 8H5L3 11H6L4 20H8V22H10V20H14V22H16V20H20L18 11H21L19 8H16L12 2Z",
  Wordle:
    "M3 3H21V5H3V3ZM3 8H21V10H3V8ZM3 13H14V15H3V13ZM17 13H21V15H17V13ZM3 18H10V20H3V18ZM13 18H21V20H13V18Z",
  Minesweeper: "M12 4L10.5 7.5L7 8L9.5 10.5L8.5 14L12 12L15.5 14L14.5 10.5L17 8L13.5 7.5L12 4Z",
  Nonograms: "M3 3H8V8H3V3ZM10 3H15V8H10V3ZM17 3H22V8H17V3ZM3 10H8V15H3V10ZM10 10H15V15H10V10Z",
  "2048": "M4 4H20V20H4V4ZM8 8V12H12V8H8ZM14 8V16H18V8H14ZM8 14V18H12V14H8Z",
};

/** Show all 81 cells in the static sudoku preview */
export const ALL_SUDOKU_CELLS = new Set(Array.from({ length: 81 }, (_, i) => i));

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

export const STATIC_2048_TILES: {
  value: number;
  row: number;
  col: number;
  id: number;
}[] = [
  { value: 2, row: 0, col: 0, id: 0 },
  { value: 4, row: 0, col: 2, id: 1 },
  { value: 8, row: 1, col: 1, id: 2 },
  { value: 16, row: 2, col: 3, id: 3 },
  { value: 32, row: 3, col: 0, id: 4 },
  { value: 64, row: 3, col: 2, id: 5 },
];

export const SUDOKU_PREVIEW_PATTERN = [
  5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6, 1,
  4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7,
  4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
];

export const WORDLE_PREVIEW_WORDS = ["crane", "slate", "trace", "crate", "stare"];

export const WORDLE_PREVIEW_COLORS: ("absent" | "correct" | "present")[][] = [
  ["absent", "correct", "present", "absent", "correct"],
  ["correct", "absent", "present", "absent", "correct"],
  ["present", "absent", "correct", "present", "absent"],
  ["absent", "present", "correct", "absent", "correct"],
  ["correct", "correct", "correct", "correct", "correct"],
];
