import { Show, createSignal } from "solid-js";
import { createMinesweeperGame } from "@/lib/minesweeperGame";
import type { Difficulty } from "@/lib/minesweeper";
import MinesweeperBoard from "./MinesweeperBoard";
import MinesweeperSetup from "./MinesweeperSetup";
import GameResultScreen from "./GameResultScreen";
import ThemeToggle from "./ThemeToggle";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function difficultyLabel(d: Difficulty): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export default function MinesweeperApp() {
  const game = createMinesweeperGame();

  const [newGamePressed, setNewGamePressed] = createSignal(false);
  const [restartPressed, setRestartPressed] = createSignal(false);

  function handleBackToGames() {
    window.location.href = "/";
  }

  return (
    <>
      {/* ── Setup Phase ──────────────────────────────────────────── */}
      <Show when={game.phase() === "setup"}>
        <MinesweeperSetup onStart={game.startGame} />
      </Show>

      {/* ── Result Overlay ───────────────────────────────────────── */}
      <Show when={game.phase() === "playing" && game.gameResult() !== null}>
        <GameResultScreen
          result={game.gameResult()!}
          solveTime={game.timerSeconds()}
          difficulty={game.difficulty()}
          onBackToGames={handleBackToGames}
          onPlayAgain={game.playAgain}
        />
      </Show>

      {/* ── Playing Phase ────────────────────────────────────────── */}
      <Show when={game.phase() === "playing" && game.gameResult() === null}>
        <div class="flex flex-col min-h-screen" style={{ animation: "fadeIn 0.35s ease-out both" }}>
          {/* Top bar */}
          <div class="flex items-center justify-between px-5 py-3">
            <button
              onClick={game.restart}
              onPointerDown={() => setNewGamePressed(true)}
              onPointerUp={() => setNewGamePressed(false)}
              onPointerLeave={() => setNewGamePressed(false)}
              onPointerCancel={() => setNewGamePressed(false)}
              style={{
                transition: "color 0.2s ease, transform 0.1s ease-out",
                transform: newGamePressed() ? "scale(0.93)" : "",
              }}
              class="flex items-center gap-1.5 text-fg-tertiary hover:text-fg"
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
              <span class="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-fg-tertiary)">
                  <circle cx="12" cy="12" r="5" />
                </svg>
                {game.mineCounter()}
              </span>
              <span class="opacity-40">·</span>
              <span>{difficultyLabel(game.difficulty())}</span>
              <span class="opacity-40 mx-1">|</span>
              <span class="font-mono tabular-nums tracking-wider text-fg-secondary">
                {formatTimer(game.timerSeconds())}
              </span>
            </div>

            <ThemeToggle />
          </div>

          {/* Thin separator */}
          <div class="h-px bg-border" />

          {/* Game area */}
          <div class="flex-1 flex flex-col items-center justify-center gap-4 py-4 px-2 md:px-4 overflow-auto">
            <Show when={game.board().length > 0}>
              <MinesweeperBoard
                board={game.board()}
                rows={game.rows()}
                cols={game.cols()}
                selectedCell={game.selectedCell()}
                onSelectCell={game.selectCell}
                triggeredMine={game.triggeredMine()}
                wrongFlags={game.wrongFlags()}
                gameOver={false}
                onCellClick={game.handleCellClick}
                isCompleting={game.completing()}
                completionOrigin={game.completionOrigin()}
              />
            </Show>

            {/* Dig/Flag mode toggle */}
            <div class="flex flex-col items-center gap-2">
              <div
                class="flex rounded-lg border border-border overflow-hidden"
                style={{ animation: "fadeIn 0.3s ease-out 0.2s both" }}
              >
                <button
                  onClick={() => game.digMode() || game.toggleMode()}
                  style={{
                    transition: "background-color 0.15s ease-out, color 0.15s ease-out",
                  }}
                  class={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${
                    game.digMode()
                      ? "bg-accent text-white"
                      : "bg-surface text-fg-tertiary hover:text-fg"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  >
                    <path d="M14 2L4 14l1 5 5 1L20 10" />
                  </svg>
                  Dig
                </button>
                <button
                  onClick={() => !game.digMode() || game.toggleMode()}
                  style={{
                    transition: "background-color 0.15s ease-out, color 0.15s ease-out",
                  }}
                  class={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-l border-border ${
                    !game.digMode()
                      ? "bg-accent text-white"
                      : "bg-surface text-fg-tertiary hover:text-fg"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                  Flag
                </button>
              </div>
              <p class="text-[11px] text-fg-tertiary tracking-wide text-center">
                Tap to dig · right-click or hold to flag
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div class="px-4 pb-5 flex justify-center">
            <button
              onClick={game.restart}
              onPointerDown={() => setRestartPressed(true)}
              onPointerUp={() => setRestartPressed(false)}
              onPointerLeave={() => setRestartPressed(false)}
              onPointerCancel={() => setRestartPressed(false)}
              style={{
                transition:
                  "border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease, transform 0.1s ease-out",
                transform: restartPressed() ? "scale(0.93)" : "",
              }}
              class="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-fg-tertiary hover:border-accent hover:text-accent"
            >
              Restart
            </button>
          </div>
        </div>
      </Show>
    </>
  );
}
