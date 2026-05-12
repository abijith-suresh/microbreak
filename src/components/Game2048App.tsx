import { Show } from "solid-js";
import { create2048Game } from "@/lib/game2048Game";
import Game2048Board from "./Game2048Board";
import Game2048WinOverlay from "./Game2048WinOverlay";
import GameScreen from "./GameScreen";
import ThemeToggle from "./ThemeToggle";
import BackLink from "./ui/BackLink";
import Button from "./ui/Button";

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

  function handleBackToGames() {
    window.location.href = "/";
  }

  return (
    <>
      {/* ── Setup Phase (just a start button) ────────────────────────── */}
      <Show when={game.phase() === "setup"}>
        <div
          class="flex flex-col min-h-screen"
          class="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
        >
          {/* Top bar */}
          <div class="flex items-center justify-between px-5 py-4">
            <BackLink label="Games" href="/" />
            <ThemeToggle />
          </div>

          {/* Setup content */}
          <div class="flex-1 flex flex-col items-center justify-center gap-10 px-5 pb-16">
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
        <GameScreen
          left={<BackLink label="Setup" onClick={game.returnToSetup} />}
          center={
            <div class="flex items-center gap-4 text-xs">
              <div class="flex flex-col items-center">
                <span class="text-fg-tertiary text-xs tracking-widest uppercase">Score</span>
                <div class="relative">
                  <span class="font-mono tabular-nums tracking-wider text-fg font-semibold">
                    {formatNumber(game.score())}
                  </span>
                  <Show when={game.scorePopup()}>
                    {(popup) => (
                      <span
                        class="absolute -top-1 left-1/2 -translate-x-1/2 text-accent font-semibold text-xs tabular-nums pointer-events-none"
                        class="animate-score-float"
                      >
                        +{popup().value}
                      </span>
                    )}
                  </Show>
                </div>
              </div>

              <div class="flex flex-col items-center">
                <span class="text-fg-tertiary text-xs tracking-widest uppercase">Best</span>
                <span class="font-mono tabular-nums tracking-wider text-fg-secondary">
                  {formatNumber(game.bestScore())}
                </span>
              </div>

              <span class="opacity-40">|</span>

              <span class="font-mono tabular-nums tracking-wider text-fg-secondary">
                {formatTimer(game.timerSeconds())}
              </span>
            </div>
          }
          right={<ThemeToggle />}
          contentClass="flex-1 flex flex-col items-center justify-center gap-4 py-6 px-4"
          footer={
            <Button variant="ghost" onClick={game.restart}>
              Restart
            </Button>
          }
        >
          <Show
            when={game.tiles.length > 0}
            fallback={
              <div
                class="w-full max-w-[336px] aspect-square rounded-lg bg-surface border border-border"
                class="animate-pulse"
              />
            }
          >
            <Game2048Board tiles={game.tiles} onMove={game.handleMove} />
          </Show>
        </GameScreen>

        <Show when={game.gameOver()}>
          <div
            class="absolute inset-0 z-40 flex flex-col items-center justify-center bg-bg/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-2048-over-title"
          >
            <div
              class="sr-only"
              aria-live="assertive"
            >{`2048 game over with ${formatNumber(game.score())} points`}</div>
            <h1
              id="game-2048-over-title"
              class="font-display text-5xl text-fg italic tracking-tight"
            >
              Game Over
            </h1>
            <p class="mt-3 text-2xl font-light text-fg-secondary tabular-nums">
              {formatNumber(game.score())} points
            </p>
            <div class="flex items-center gap-3 mt-8">
              <Button onClick={game.playAgain}>Try Again</Button>
              <Button variant="secondary" onClick={handleBackToGames}>
                Back to Games
              </Button>
            </div>
          </div>
        </Show>
      </Show>
    </>
  );
}
