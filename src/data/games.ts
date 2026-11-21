export interface Game {
  name: string;
  href: string;
  /** Set to false to hide the game everywhere. Omitted means shown. */
  enabled?: boolean;
}

export const games: Game[] = [
  { name: "Sudoku", href: "/sudoku" },
  { name: "Wordle", href: "/wordle" },
  { name: "Minesweeper", href: "/minesweeper" },
  { name: "2048", href: "/2048", enabled: false },
];

/** The games shown on the site, in order. */
export function getShownGames(): Game[] {
  return games.filter((game) => game.enabled !== false);
}
