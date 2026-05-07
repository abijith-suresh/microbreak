import { Show, createSignal } from "solid-js";
import { create2048Game } from "@/lib/game2048Game";
import Game2048Board from "./Game2048Board";
import Game2048WinOverlay from "./Game2048WinOverlay";
import ThemeToggle from "./ThemeToggle";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function Game2048App() {
  const game = create2048Game();

  const [newGamePressed, setNewGamePressed] = createSignal(false);
  const [restartPressed, setRestartPressed] = createSignal(false);

  function handleBackToGames() {
    window.location.href = "/";
  }

  return (
    <>
      {/* ── Setup Phase (just a start button) ────────────────────────── */}
      <Show when={game.phase() === "setup"}>
        <div
          class="flex flex-col min-h-screen items-center justify-center gap-10 px-5"
          style={{ animation: "fadeIn 0.4s ease-out both" }}
        >
          <div class="text-center">
            <h1 class="font-display text-6xl md:text-7xl text-fg italic tracking-tight">2048</h1>
            <p class="mt-2 text-sm text-fg-secondary tracking-wide">
              Join the tiles, get to <span class="text-accent font-medium">2048</span>
            </p>
          </div>

          <button
            onClick={() => game.startGame()}
            class="px-10 py-3.5 rounded-xl bg-accent text-white font-medium text-base hover:bg-accent-hover"
            style={{
              transition: "background-color 0.2s ease, transform 0.1s ease-out",
            }}
          >
            New Game
          </button>

          <p class="text-xs text-fg-tertiary tracking-wide">
            Use arrow keys or swipe to move tiles
          </p>
        </div>
      </Show>

      {/* ── Win Overlay ──────────────────────────────────────────────── */}
      <Show when={game.phase() === "playing" && game.hasShownWin()}>
        <Game2048WinOverlay
          score={game.score()}
          onKeepPlaying={game.continueAfterWin}
          onNewGame={game.playAgain}
        />
      </Show>

      {/* ── Playing Phase ────────────────────────────────────────────── */}
      <Show when={game.phase() === "playing" && !game.hasShownWin()}>
        <div class="flex flex-col min-h-screen" style={{ animation: "fadeIn 0.35s ease-out both" }}>
          {/* Top bar */}
          <div class="flex items-center justify-between px-5 py-3">
            <button
              onClick={game.returnToSetup}
              onPointerDown={() => setNewGamePressed(true)}
              onPointerUp={() => setNewGamePressed(false)}
              onPointerLeave={() => setNewGamePressed(false)}
              onPointerCancel={() => setNewGamePressed(false)}
              style={{
                transition: "color 0.2s ease, transform 0.1s ease-out",
                transform: newGamePressed() ? "scale(0.93)" : "",
              }}
              class="flex items-center gap-1.5 text-fg-tertiary hover:text-fg"
              aria-label="Return to setup"
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
              <span class="text-sm font-medium hidden sm:inline">Setup</span>
            </button>

            <div class="flex items-center gap-4 text-xs">
              {/* Score */}
              <div class="flex flex-col items-center">
                <span class="text-fg-tertiary text-[10px] tracking-widest uppercase">Score</span>
                <div class="relative">
                  <span class="font-mono tabular-nums tracking-wider text-fg font-semibold">
                    {formatNumber(game.score())}
                  </span>
                  <Show when={game.scorePopup()}>
                    {(popup) => (
                      <span
                        class="absolute -top-1 left-1/2 -translate-x-1/2 text-accent font-semibold text-xs tabular-nums pointer-events-none"
                        style={{ animation: "scoreFloat 600ms ease-out forwards" }}
                      >
                        +{popup().value}
                      </span>
                    )}
                  </Show>
                </div>
              </div>

              {/* Best */}
              <div class="flex flex-col items-center">
                <span class="text-fg-tertiary text-[10px] tracking-widest uppercase">Best</span>
                <span class="font-mono tabular-nums tracking-wider text-fg-secondary">
                  {formatNumber(game.bestScore())}
                </span>
              </div>

              <span class="opacity-40">|</span>

              <span class="font-mono tabular-nums tracking-wider text-fg-secondary">
                {formatTimer(game.timerSeconds())}
              </span>
            </div>

            <ThemeToggle />
          </div>

          {/* Thin separator */}
          <div class="h-px bg-border" />

          {/* Game board */}
          <div class="flex-1 flex flex-col items-center justify-center gap-4 py-6 px-4">
            <Show
              when={game.tiles.length > 0}
              fallback={
                <div
                  class="w-full max-w-[336px] aspect-square rounded-lg bg-surface border border-border"
                  style={{ animation: "skeletonPulse 1.4s ease-in-out infinite" }}
                />
              }
            >
              <Game2048Board tiles={game.tiles} onMove={game.handleMove} />
            </Show>
          </div>

          {/* Game Over overlay */}
          <Show when={game.gameOver()}>
            <div class="absolute inset-0 z-40 flex flex-col items-center justify-center bg-bg/80 backdrop-blur-sm">
              <h1 class="font-display text-5xl text-fg italic tracking-tight">Game Over</h1>
              <p class="mt-3 text-2xl font-light text-fg-secondary tabular-nums">
                {formatNumber(game.score())} points
              </p>
              <div class="flex items-center gap-3 mt-8">
                <button
                  onClick={game.playAgain}
                  class="px-8 py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover"
                  style={{
                    transition: "background-color 0.2s ease, transform 0.1s ease-out",
                  }}
                >
                  Try Again
                </button>
                <button
                  onClick={handleBackToGames}
                  class="px-8 py-3 rounded-xl bg-surface border border-border text-fg-secondary font-medium text-sm hover:border-accent hover:text-accent"
                  style={{
                    transition: "border-color 0.2s ease, color 0.2s ease",
                  }}
                >
                  Back to Games
                </button>
              </div>
            </div>
          </Show>

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
