export interface Game {
  name: string;
  href: string;
  /** One plain line about the game, shown on its home card. */
  line: string;
  /** Set to false to hide the game everywhere. Omitted means shown. */
  enabled?: boolean;
}

export const games: Game[] = [
  { name: "Sudoku", href: "/sudoku", line: "Fill every row, column and box" },
  { name: "Wordle", href: "/wordle", line: "Guess the hidden word" },
  { name: "Minesweeper", href: "/minesweeper", line: "Clear the board, dodge the mines" },
  { name: "2048", href: "/2048", line: "Slide the tiles to 2048", enabled: false },
];

/** The games shown on the site, in order. */
export function getShownGames(): Game[] {
  return games.filter((game) => game.enabled !== false);
}
