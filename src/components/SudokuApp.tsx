import { Show } from "solid-js";
import { createSudokuGame } from "@/lib/sudokuGame";
import { getBoxDims, type GridSize } from "@/lib/sudoku";
import SudokuBoard from "./SudokuBoard";
import SudokuSetup from "./SudokuSetup";
import NumberPad from "./NumberPad";
import CompletionScreen from "./CompletionScreen";
import ThemeToggle from "./ThemeToggle";
import BackLink from "./ui/BackLink";
import PressableButton from "./ui/PressableButton";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function sizeLabel(size: number): string {
  if (size === 4) return "4×4";
  if (size === 6) return "6×6";
  return "9×9";
}

// ── Skeleton board ─────────────────────────────────────────────────────────────
/**
 * Shown for the brief window (~1 frame) while the puzzle is generating.
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
        class="inline-grid rounded-sm overflow-hidden border-[2.5px] border-border-strong shadow-md shadow-shadow"
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
              ? "border-r-[2.5px]"
              : (col + 1) % boxCols === 0
                ? "border-r-[2px]"
                : "border-r";

          return (
            <div
              class={`${cellSizeClass()} ${rightBorder} border-b border-border bg-surface`}
              style={{ animation: `skeletonPulse 1.4s ease-in-out ${delay}ms infinite` }}
            />
          );
        })}
      </div>

      {/* Number pad skeleton */}
      <div
        class={`grid ${padLayoutClass()} gap-1.5 justify-items-center`}
        style={{
          animation: "skeletonPulse 1.4s ease-in-out 200ms infinite",
        }}
      >
        {Array.from({ length: props.size }, (_, i) => (
          <div
            class={`${numBtnClass()} rounded-lg bg-surface border border-border`}
            style={{ animation: `skeletonPulse 1.4s ease-in-out ${i * 70}ms infinite` }}
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

  return (
    <>
      {/* ── Setup Phase ──────────────────────────────────────────── */}
      <Show when={game.phase() === "setup"}>
        <SudokuSetup onStart={game.startGame} />
      </Show>

      {/* ── Completion Overlay ───────────────────────────────────── */}
      <Show when={game.phase() === "playing" && game.completed()}>
        <CompletionScreen
          solveTime={game.timerSeconds()}
          gridSize={game.gridSize()}
          difficulty={game.difficulty()}
          onBackToGames={handleBackToGames}
          onPlayAgain={game.playAgain}
        />
      </Show>

      {/* ── Playing Phase ────────────────────────────────────────── */}
      <Show when={game.phase() === "playing" && !game.completed()}>
        {/*
          The container fades in as one unit. Individual cells then cascade in
          centre-outward via the `cellReveal` keyframe inside SudokuBoard,
          giving the puzzle a "materialising" entrance.
        */}
        <div class="flex flex-col min-h-screen" style={{ animation: "fadeIn 0.35s ease-out both" }}>
          {/* Top bar */}
          <div class="flex items-center justify-between px-5 py-3">
            <BackLink label="Setup" onClick={game.returnToSetup} />

            <div class="flex items-center gap-2 text-xs text-fg-tertiary">
              <span>{sizeLabel(game.gridSize())}</span>
              <span class="opacity-40">·</span>
              <span class="capitalize">{game.difficulty()}</span>
              <span class="opacity-40 mx-1">|</span>
              <span class="font-mono tabular-nums tracking-wider text-fg-secondary">
                {formatTimer(game.timerSeconds())}
              </span>
            </div>

            <ThemeToggle />
          </div>

          {/* Thin separator */}
          <div class="h-px bg-border" />

          {/* Puzzle area */}
          <div class="flex-1 flex flex-col items-center justify-center gap-6 py-6 px-4">
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
                userBoard={game.userBoard()}
                conflictedCells={game.conflictedCells()}
                completing={game.completing()}
                completionOrigin={game.completionOrigin()}
                completingGroups={game.completingGroups()}
              />

              {/* Number pad fades in slightly after the board so cells have
                  a head-start on their cascade before the pad appears */}
              <div style={{ animation: "fadeIn 0.3s ease-out 0.2s both" }}>
                <NumberPad
                  size={game.gridSize()}
                  onNumber={game.handleKeyboardNumber}
                  onErase={game.handleKeyboardErase}
                  placedCounts={game.numberPlacedCounts}
                />
              </div>
            </Show>
          </div>

          {/* Bottom bar */}
          <div class="px-4 pb-5 flex justify-center">
            <PressableButton variant="ghost" onClick={game.restart}>
              Restart
            </PressableButton>
          </div>
        </div>
      </Show>
    </>
  );
}
