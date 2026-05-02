export interface GameCard {
  name: string;
  icon: string;
  active: boolean;
  href?: string;
}

export const games: GameCard[] = [
  { name: "Sudoku", icon: "⊞", active: true, href: "/sudoku" },
  { name: "Chess", icon: "♞", active: false },
  { name: "Wordle", icon: "W", active: true, href: "/wordle" },
  { name: "Minesweeper", icon: "✱", active: true, href: "/minesweeper" },
  { name: "Nonograms", icon: "▦", active: false },
  { name: "2048", icon: "2", active: true, href: "/2048" },
];

/** Return games sorted: active first (in defined order), then inactive */
export function getOrderedGames(): GameCard[] {
  const active = games.filter((g) => g.active);
  const inactive = games.filter((g) => !g.active);
  return [...active, ...inactive];
}
