import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { describeBest, getBest, sudokuVariant } from "@/lib/bests";
import { formatTimer } from "@/lib/elapsedTimer";
import { type Difficulty, type GridSize, getBoxDims } from "@/lib/sudoku";
import { createSudokuGame } from "@/lib/sudokuGame";
import GameScreen from "./GameScreen";
import NumberPad from "./NumberPad";
import SudokuBoard from "./SudokuBoard";
import NewGameMenu from "./ui/NewGameMenu";
import ResultScreen from "./ui/ResultScreen";

const SIZE_OPTIONS = [
  { value: 4, label: "4×4" },
  { value: 6, label: "6×6" },
  { value: 9, label: "9×9" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function sizeLabel(size: number): string {
  if (size === 4) return "4×4";
  if (size === 6) return "6×6";
  return "9×9";
}

function difficultyString(size: number, diff: string): string {
  const dims = sizeLabel(size);
  const label = diff.charAt(0).toUpperCase() + diff.slice(1);
  return `${dims} · ${label}`;
}

// ── Skeleton board ─────────────────────────────────────────────────────────────
/**
 * Shown while the puzzle is generating.
 * Matches the board's grid dimensions with pulsing empty cells so the layout
 * doesn't jump when the real board mounts.
 */
function SkeletonBoard(props: { size: GridSize }) {
  const cellSizeClass = () => {
    if (props.size === 4) return "w-16 h-16 md:w-20 md:h-20";
    if (props.size === 6) return "w-13 h-13 md:w-16 md:h-16";
    return "w-9 h-9 md:w-12 md:h-12";
  };

  const numBtnClass = () => {
    if (props.size === 4) return "w-14 h-14";
    if (props.size === 6) return "w-12 h-12";
    return "w-12 h-12 md:w-11 md:h-11";
  };

  const padLayoutClass = () => {
    if (props.size === 4) return "grid-cols-4";
    if (props.size === 6) return "grid-cols-6";
    return "grid-cols-3 sm:grid-cols-9";
  };

  const [, boxCols] = getBoxDims(props.size);
  const center = (props.size - 1) / 2;

  return (
    <div class="flex flex-col items-center gap-6">
      {/* Grid */}
      <div
        class="inline-grid rounded-sm overflow-hidden border-strong border-border-strong shadow-md shadow-shadow"
        style={{ "grid-template-columns": `repeat(${props.size}, auto)` }}
      >
        {Array.from({ length: props.size * props.size }, (_, idx) => {
          const row = Math.floor(idx / props.size);
          const col = idx % props.size;
          const dist = Math.abs(row - center) + Math.abs(col - center);
          const delay = Math.round(dist * 60);

          // Box-boundary right border
          const rightBorder =
            col === props.size - 1
              ? "border-r-strong"
              : (col + 1) % boxCols === 0
                ? "border-r-2"
                : "border-r";

          return (
            <div
              class={`${cellSizeClass()} ${rightBorder} border-b border-border bg-surface animate-pulse`}
              style={
                { "--tw-animation-delay": `${delay}ms` } as JSX.CSSProperties &
                  Record<string, string | undefined>
              }
            />
          );
        })}
      </div>

      {/* Number pad skeleton */}
      <div
        class={`grid ${padLayoutClass()} gap-1.5 justify-items-center animate-pulse`}
        style={
          { "--tw-animation-delay": "200ms" } as JSX.CSSProperties &
            Record<string, string | undefined>
        }
      >
        {Array.from({ length: props.size }, (_, i) => (
          <div
            class={`${numBtnClass()} rounded-lg bg-surface border border-border animate-pulse`}
            style={
              { "--tw-animation-delay": `${i * 70}ms` } as JSX.CSSProperties &
                Record<string, string | undefined>
            }
          />
        ))}
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function SudokuApp() {
  const game = createSudokuGame();

  function handleBackToGames() {
    window.location.href = "/";
  }

  const bestText = () => {
    const best = getBest("sudoku", sudokuVariant(game.gridSize(), game.difficulty()));
    return best ? describeBest("sudoku", best) : null;
  };

  return (
    <GameScreen
      title="Sudoku"
      meta={difficultyString(game.gridSize(), game.difficulty())}
      timer={formatTimer(game.timerSeconds())}
      menu={
        <NewGameMenu
          groups={[
            { id: "size", label: "Size", options: SIZE_OPTIONS, value: game.gridSize() },
            {
              id: "difficulty",
              label: "Difficulty",
              options: DIFFICULTY_OPTIONS,
              value: game.difficulty(),
            },
          ]}
          note="Replaces the board in progress."
          onStart={(values) =>
            game.startGame(values.size as GridSize, values.difficulty as Difficulty)
          }
        />
      }
    >
      <Show
        when={!game.completed()}
        fallback={
          <ResultScreen
            type="won"
            solveTime={game.timerSeconds()}
            difficulty={difficultyString(game.gridSize(), game.difficulty())}
            best={bestText()}
            isNewBest={game.newBest()}
            onBackToGames={handleBackToGames}
            onPlayAgain={game.playAgain}
          />
        }
      >
        {/*
            Individual cells cascade in centre-outward via the `cellReveal` keyframe
            inside SudokuBoard, giving the puzzle a "materialising" entrance.
          */}
        <Show
          when={
            game.puzzle().length === game.gridSize() &&
            game.solution().length === game.gridSize() &&
            game.userBoard().length === game.gridSize()
          }
          fallback={<SkeletonBoard size={game.gridSize()} />}
        >
          <SudokuBoard
            puzzle={game.puzzle()}
            solution={game.solution()}
            size={game.gridSize()}
            selectedCell={game.selectedCell()}
            onSelectCell={game.selectCell}
            onFillCell={game.fillCell}
            userBoard={game.userBoard()}
            conflictedCells={game.conflictedCells()}
            completing={game.completing()}
            completionOrigin={game.completionOrigin()}
            completingGroups={game.completingGroups()}
          />

          {/* Number pad fades in slightly after the board so cells have
                a head-start on their cascade before the pad appears */}
          <div class="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
            <NumberPad
              size={game.gridSize()}
              onNumber={game.handleKeyboardNumber}
              onErase={game.handleKeyboardErase}
              placedCounts={game.numberPlacedCounts}
            />
          </div>
        </Show>
      </Show>
    </GameScreen>
  );
}
