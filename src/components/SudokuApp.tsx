import { Show } from "solid-js";
import { createSudokuGame } from "@/lib/sudokuGame";
import SudokuBoard from "./SudokuBoard";
import SudokuSetup from "./SudokuSetup";
import NumberPad from "./NumberPad";
import CompletionScreen from "./CompletionScreen";
import ThemeToggle from "./ThemeToggle";

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
        <div class="flex flex-col min-h-screen">
          {/* Top bar */}
          <div class="flex items-center justify-between px-5 py-3">
            <button
              onClick={game.restart}
              class="flex items-center gap-1.5 text-fg-tertiary hover:text-fg transition-colors duration-200"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" class="shrink-0">
                <path
                  d="M12.5 15L7.5 10L12.5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span class="text-sm font-medium hidden sm:inline">New Game</span>
            </button>

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
              fallback={<div class="text-fg-tertiary text-sm">Loading puzzle…</div>}
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

              <NumberPad
                size={game.gridSize()}
                onNumber={game.handleKeyboardNumber}
                onErase={game.handleKeyboardErase}
                placedCounts={game.numberPlacedCounts}
              />
            </Show>
          </div>

          {/* Bottom bar */}
          <div class="px-4 pb-5 flex justify-center">
            <button
              onClick={game.restart}
              class="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-fg-tertiary transition-all duration-200 hover:border-accent hover:text-accent active:scale-95"
            >
              Restart
            </button>
          </div>
        </div>
      </Show>
    </>
  );
}
