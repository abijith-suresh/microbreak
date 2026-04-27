import { Show, createSignal } from "solid-js";
import { createWordleGame } from "@/lib/wordleGame";
import WordleSetup from "./WordleSetup";
import WordleBoard from "./WordleBoard";
import WordleKeyboard from "./WordleKeyboard";
import GameResultScreen from "./GameResultScreen";
import ThemeToggle from "./ThemeToggle";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function variantLabel(v: number): string {
  return `${v} letters`;
}

export default function WordleApp() {
  const game = createWordleGame();

  const [newGamePressed, setNewGamePressed] = createSignal(false);
  const [restartPressed, setRestartPressed] = createSignal(false);

  function handleBackToGames() {
    window.location.href = "/";
  }

  return (
    <>
      {/* ── Setup Phase ──────────────────────────────────────────── */}
      <Show when={game.phase() === "setup"}>
        <WordleSetup onStart={game.startGame} loading={game.loading()} />
      </Show>

      {/* ── Result Overlay ───────────────────────────────────────── */}
      <Show when={game.phase() === "playing" && game.gameResult() !== null}>
        <GameResultScreen
          result={game.gameResult()!}
          solveTime={game.timerSeconds()}
          difficulty={variantLabel(game.variant())}
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
              <span>{variantLabel(game.variant())}</span>
              <span class="opacity-40">|</span>
              <span class="font-mono tabular-nums tracking-wider text-fg-secondary">
                {formatTimer(game.timerSeconds())}
              </span>
            </div>

            <ThemeToggle />
          </div>

          {/* Thin separator */}
          <div class="h-px bg-border" />

          {/* Game area */}
          <div class="flex-1 flex flex-col items-center justify-center gap-6 py-4 px-2 md:px-4 overflow-auto">
            <WordleBoard
              variant={game.variant()}
              guesses={game.guesses()}
              currentInput={game.currentInput()}
              revealRow={game.revealRow()}
              shakeRow={game.shakeRow()}
              gameResult={game.gameResult()}
            />
          </div>

          {/* Keyboard */}
          <div class="px-2 pb-4">
            <WordleKeyboard
              keyboardState={game.keyboardState()}
              onType={game.typeLetter}
              onDelete={game.deleteLetter}
              onSubmit={game.submitGuess}
            />
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
