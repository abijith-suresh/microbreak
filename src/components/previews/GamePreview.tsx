import type { GameCard } from "@/data/games";
import { MiniSudokuGrid } from "./MiniSudokuGrid";
import { MiniMinesweeperGrid } from "./MiniMinesweeperGrid";
import { Mini2048Grid } from "./Mini2048Grid";
import { MiniWordleGrid } from "./MiniWordleGrid";

export default function GamePreview(props: { game: GameCard; animated: boolean }) {
  if (props.game.name === "Sudoku") return <MiniSudokuGrid animated={props.animated} />;
  if (props.game.name === "Minesweeper") return <MiniMinesweeperGrid animated={props.animated} />;
  if (props.game.name === "2048") return <Mini2048Grid animated={props.animated} />;
  if (props.game.name === "Wordle") return <MiniWordleGrid animated={props.animated} />;
  return <div class="w-full max-w-[160px] aspect-[4/3]" />;
}
