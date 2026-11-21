export const STORAGE_KEYS = {
  theme: "microbreak-theme",
  bests: "microbreak-bests:v1",
  /** Read once as a fallback; 2048 bests now live in `bests`. */
  game2048Best: "microbreak-2048-best",
  game2048Session: "microbreak-2048-session:v1",
  sudokuPreferences: "microbreak-sudoku-preferences:v1",
  sudokuSession: "microbreak-sudoku-session:v1",
  minesweeperPreferences: "microbreak-minesweeper-preferences:v1",
  minesweeperSession: "microbreak-minesweeper-session:v1",
  wordlePreferences: "microbreak-wordle-preferences:v1",
  wordleSession: "microbreak-wordle-session:v1",
  wordleRecentAnswers: "microbreak-wordle-recent-answers:v1",
} as const;
