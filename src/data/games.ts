export type GameStatus = "available" | "coming-soon";
export type GameCategory = "logic" | "word" | "arcade";

export interface GameCard {
  name: string;
  icon: string;
  status: GameStatus;
  category: GameCategory;
  sessionLength: string;
  blurb: string;
  tags: string[];
  href?: string;
}

export const games: GameCard[] = [
  {
    name: "Sudoku",
    icon: "⊞",
    status: "available",
    category: "logic",
    sessionLength: "3–8 min",
    blurb: "Choose a 4×4, 6×6, or 9×9 board for a focused logic break.",
    tags: ["numbers", "pencil-friendly", "calm"],
    href: "/sudoku",
  },
  {
    name: "Wordle",
    icon: "W",
    status: "available",
    category: "word",
    sessionLength: "1–5 min",
    blurb: "Quick daily-style deduction with 4, 5, and 6 letter variants.",
    tags: ["vocabulary", "deduction", "snappy"],
    href: "/wordle",
  },
  {
    name: "Minesweeper",
    icon: "✱",
    status: "available",
    category: "logic",
    sessionLength: "1–5 min",
    blurb: "Classic mine-hunting with mobile presets and fast restart loops.",
    tags: ["spatial", "risk", "classic"],
    href: "/minesweeper",
  },
  {
    name: "2048",
    icon: "2",
    status: "available",
    category: "arcade",
    sessionLength: "2–6 min",
    blurb: "Swipe-friendly tile merging when you want momentum over rules lookup.",
    tags: ["numbers", "swipe", "momentum"],
    href: "/2048",
  },
  {
    name: "Chess",
    icon: "♞",
    status: "coming-soon",
    category: "logic",
    sessionLength: "5–15 min",
    blurb: "A future quick-format strategy entry for slightly longer breaks.",
    tags: ["strategy", "head-to-head", "planned"],
  },
  {
    name: "Nonograms",
    icon: "▦",
    status: "coming-soon",
    category: "logic",
    sessionLength: "5–12 min",
    blurb: "Picture logic puzzles that reward slow, deliberate pattern spotting.",
    tags: ["grids", "pattern", "planned"],
  },
];

/** Return games sorted: available first (in defined order), then upcoming */
export function getOrderedGames(): GameCard[] {
  const available = games.filter((game) => game.status === "available");
  const upcoming = games.filter((game) => game.status === "coming-soon");
  return [...available, ...upcoming];
}
