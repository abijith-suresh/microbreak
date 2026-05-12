import { Show } from "solid-js";
import { createMinesweeperGame } from "@/lib/minesweeperGame";
import type { Difficulty } from "@/lib/minesweeper";
import MinesweeperBoard from "./MinesweeperBoard";
import MinesweeperSetup from "./MinesweeperSetup";
import ResultScreen from "./ui/ResultScreen";
import GameScreen from "./GameScreen";
import ThemeToggle from "./ThemeToggle";
import BackLink from "./ui/BackLink";
import PressableButton from "./ui/PressableButton";

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
        <ResultScreen
          type={game.gameResult()!}
          solveTime={game.timerSeconds()}
          difficulty={difficultyLabel(game.difficulty())}
          onBackToGames={handleBackToGames}
          onPlayAgain={game.playAgain}
        />
      </Show>

      {/* ── Playing Phase ────────────────────────────────────────── */}
      <Show when={game.phase() === "playing" && game.gameResult() === null}>
        <GameScreen
          left={<BackLink label="Setup" onClick={game.returnToSetup} />}
          center={
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
          }
          right={<ThemeToggle />}
          contentClass="flex-1 flex flex-col items-center justify-center gap-4 py-4 px-2 md:px-4 overflow-auto"
          belowContent={
            <div class="flex flex-col items-center gap-2">
              <div class="flex rounded-lg border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
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
              <p class="text-xs text-fg-tertiary tracking-wide text-center">
                Tap to dig · right-click or hold to flag
              </p>
            </div>
          }
          footer={
            <PressableButton variant="ghost" onClick={game.restart}>
              Restart
            </PressableButton>
          }
        >
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
        </GameScreen>
      </Show>
    </>
  );
}
