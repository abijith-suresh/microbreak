import { For, Show } from "solid-js";
import { calcudokuVariant, describeBest, getBest } from "@/lib/bests";
import {
  type CalcudokuBoard as CalcudokuBoardState,
  calcudokuCellSize,
  type Difficulty,
  type GridSize,
  SIZE_FOR_DIFFICULTY,
} from "@/lib/calcudoku";
import { createCalcudokuGame } from "@/lib/calcudokuGame";
import { formatTimer } from "@/lib/elapsedTimer";
import CalcudokuBoard from "./CalcudokuBoard";
import GameScreen from "./GameScreen";
import NumberPad from "./NumberPad";
import NewGameMenu from "./ui/NewGameMenu";
import ResultScreen from "./ui/ResultScreen";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const SIZE_OPTIONS = (["easy", "medium", "hard"] as const).map((value) => ({
  value,
  label: `${SIZE_FOR_DIFFICULTY[value]}×${SIZE_FOR_DIFFICULTY[value]}`,
}));

function meta(difficulty: Difficulty): string {
  const size = SIZE_FOR_DIFFICULTY[difficulty];
  return `${size}×${size} · ${DIFFICULTY_LABELS[difficulty]}`;
}

/** Holds the board's place until the puzzle is ready, so the layout doesn't jump. */
function SkeletonBoard(props: { size: GridSize }) {
  const cells = () => Array.from({ length: props.size }, (_, i) => i);
  return (
    <div class="flex flex-col overflow-hidden rounded-sm border-2 border-cage shadow-md shadow-shadow">
      <For each={cells()}>
        {(row) => (
          <div class="flex">
            <For each={cells()}>
              {(col) => (
                <div
                  class={`${calcudokuCellSize(props.size)} animate-pulse bg-surface ${
                    col < props.size - 1 ? "border-r border-border" : ""
                  } ${row < props.size - 1 ? "border-b border-border" : ""}`}
                />
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}

export default function CalcudokuApp() {
  const game = createCalcudokuGame();

  const bestText = () => {
    const best = getBest("calcudoku", calcudokuVariant(game.size()));
    return best ? describeBest("calcudoku", best) : null;
  };

  return (
    <GameScreen
      title="Calcudoku"
      meta={meta(game.difficulty())}
      timer={formatTimer(game.timerSeconds())}
      menu={
        <NewGameMenu
          groups={[{ id: "size", label: "Size", options: SIZE_OPTIONS, value: game.difficulty() }]}
          note="Replaces the board in progress."
          onStart={(values) => game.startGame(values.size as Difficulty)}
        />
      }
    >
      <Show
        when={!game.completed()}
        fallback={
          <ResultScreen
            type="won"
            solveTime={game.timerSeconds()}
            difficulty={meta(game.difficulty())}
            best={bestText()}
            isNewBest={game.newBest()}
            onBackToGames={() => {
              window.location.href = "/";
            }}
            onPlayAgain={game.playAgain}
          />
        }
      >
        {/* Keyed on the puzzle, so a new game mounts a fresh board and replays its entrance. */}
        <Show when={game.puzzle()} keyed fallback={<SkeletonBoard size={game.size()} />}>
          {(puzzle) => (
            <CalcudokuBoard
              puzzle={puzzle}
              board={game.board() as CalcudokuBoardState}
              selectedCell={game.selectedCell()}
              conflictedCells={game.conflictedCells()}
              cageStatuses={game.cageStatuses()}
              completing={game.completing()}
              completionOrigin={game.completionOrigin()}
              onSelectCell={game.selectCell}
              onDigit={game.enterDigit}
              onErase={game.eraseCell}
              onToggleNotes={game.toggleNotesMode}
            />
          )}
        </Show>

        <div class="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
          <NumberPad
            size={game.size()}
            onNumber={game.handleNumber}
            onErase={game.handleErase}
            placedCounts={game.numberPlacedCounts}
            notes={{ on: game.notesMode(), onToggle: game.toggleNotesMode }}
          />
        </div>
      </Show>
    </GameScreen>
  );
}
