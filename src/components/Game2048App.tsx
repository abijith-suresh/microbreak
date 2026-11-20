import { createEffect, createSignal, onMount, Show } from "solid-js";
import { formatTimer } from "@/lib/elapsedTimer";
import { create2048Game } from "@/lib/game2048Game";
import Game2048Board from "./Game2048Board";
import Game2048WinOverlay from "./Game2048WinOverlay";
import GameScreen from "./GameScreen";
import Button from "./ui/Button";

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function Game2048App() {
  const game = create2048Game();

  const [gameOverDialog, setGameOverDialog] = createSignal<HTMLDivElement>();
  createEffect(() => gameOverDialog()?.querySelector("button")?.focus());

  // No setup screen: resume the saved game, or start one.
  onMount(() => {
    if (game.phase() !== "playing") game.startGame();
  });

  function handleBackToGames() {
    window.location.href = "/";
  }

  return (
    <>
      {/* ── Win Overlay ──────────────────────────────────────────────── */}
      <Show when={game.phase() === "playing" && game.hasShownWin()}>
        <Game2048WinOverlay
          score={game.score()}
          onKeepPlaying={game.continueAfterWin}
          onNewGame={game.playAgain}
        />
      </Show>

      {/* ── Playing Phase ────────────────────────────────────────────── */}
      <Show when={!game.hasShownWin()}>
        <GameScreen
          title="2048"
          meta="Join the tiles"
          timer={formatTimer(game.timerSeconds())}
          menu={
            <Button variant="secondary" onClick={game.playAgain}>
              New game
            </Button>
          }
          stats={
            <div class="flex items-center gap-4 text-xs">
              <div class="flex flex-col items-center">
                <span class="text-fg-tertiary text-xs tracking-widest uppercase">Score</span>
                <div class="relative">
                  <span class="font-mono tabular-nums tracking-wider text-fg font-semibold">
                    {formatNumber(game.score())}
                  </span>
                  <Show when={game.scorePopup()}>
                    {(popup) => (
                      <span class="absolute -top-1 left-1/2 -translate-x-1/2 text-accent font-semibold text-xs tabular-nums pointer-events-none animate-score-float">
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
            </div>
          }
        >
          <Show
            when={game.tiles.length > 0}
            fallback={
              <div class="w-full max-w-[336px] aspect-square rounded-lg bg-surface border border-border animate-pulse" />
            }
          >
            <Game2048Board tiles={game.tiles} onMove={game.handleMove} />
          </Show>
        </GameScreen>

        <Show when={game.gameOver()}>
          <div
            ref={setGameOverDialog}
            class="absolute inset-0 z-40 flex flex-col items-center justify-center bg-bg/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-2048-over-title"
          >
            <div
              class="sr-only"
              aria-live="assertive"
            >{`Game over, ${formatNumber(game.score())} points`}</div>
            <h1
              id="game-2048-over-title"
              class="font-display text-5xl text-fg italic tracking-tight"
            >
              Game over
            </h1>
            <p class="mt-3 text-2xl font-light text-fg-secondary tabular-nums">
              {formatNumber(game.score())} points
            </p>
            <div class="flex items-center gap-3 mt-8">
              <Button size="lg" onClick={game.playAgain}>
                Play again
              </Button>
              <Button size="lg" variant="secondary" onClick={handleBackToGames}>
                Back to games
              </Button>
            </div>
          </div>
        </Show>
      </Show>
    </>
  );
}
