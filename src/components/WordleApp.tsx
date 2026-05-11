import { Show } from "solid-js";
import { createWordleGame } from "@/lib/wordleGame";
import WordleSetup from "./WordleSetup";
import WordleBoard from "./WordleBoard";
import WordleKeyboard from "./WordleKeyboard";
import GameScreen from "./GameScreen";
import ThemeToggle from "./ThemeToggle";
import BackLink from "./ui/BackLink";
import ResultScreen from "./ui/ResultScreen";

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

  function handleBackToGames() {
    window.location.href = "/";
  }

  return (
    <>
      {/* ── Setup Phase ──────────────────────────────────────────── */}
      <Show when={game.phase() === "setup"}>
        <WordleSetup onStart={game.startGame} loading={game.loading()} />
      </Show>

      {/* ── Playing Phase (includes result overlay) ──────────────── */}
      <Show when={game.phase() === "playing"}>
        <GameScreen
          left={<BackLink label="Setup" onClick={game.returnToSetup} />}
          center={
            <div class="flex items-center gap-2 text-xs text-fg-tertiary">
              <span>{variantLabel(game.variant())}</span>
              <span class="opacity-40">|</span>
              <span class="font-mono tabular-nums tracking-wider text-fg-secondary">
                {formatTimer(game.timerSeconds())}
              </span>
            </div>
          }
          right={<ThemeToggle />}
          belowContent={
            <Show when={game.gameResult() === null}>
              <div class="flex justify-center px-2 pb-4">
                <WordleKeyboard
                  keyboardState={game.keyboardState()}
                  onType={game.typeLetter}
                  onDelete={game.deleteLetter}
                  onSubmit={game.submitGuess}
                />
              </div>
            </Show>
          }
          footer={
            <button
              onClick={game.restart}
              style={{
                transition: "border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease",
              }}
              class="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-fg-tertiary hover:border-accent hover:text-accent"
            >
              Restart
            </button>
          }
        >
          <WordleBoard
            variant={game.variant()}
            guesses={game.guesses()}
            currentInput={game.currentInput()}
            revealRow={game.revealRow()}
            shakeRow={game.shakeRow()}
            gameResult={game.gameResult()}
            pendingReveal={game.pendingReveal()}
          />
        </GameScreen>

        {/* ── Toast overlay ───────────────────────────────────────── */}
        <Show when={game.toastMessage()}>
          <div
            class="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div
              class="px-5 py-2.5 rounded-lg bg-fg text-bg text-sm font-bold"
              class="animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-both"
            >
              {game.toastMessage()}
            </div>
          </div>
        </Show>

        {/* ── Result overlay ──────────────────────────────────────── */}
        <Show when={game.gameResult() !== null}>
          <ResultScreen
            type={game.gameResult()!}
            solveTime={game.timerSeconds()}
            difficulty={variantLabel(game.variant())}
            onBackToGames={handleBackToGames}
            onPlayAgain={game.playAgain}
          >
            <Show when={game.gameResult() === "lost"}>
              <div
                class="mt-4 flex gap-1"
                class="animate-in fade-in slide-in-from-bottom-2 duration-400 delay-500 fill-mode-both"
              >
                {game
                  .answer()
                  .split("")
                  .map((letter) => (
                    <div
                      class="flex items-center justify-center size-10 rounded-md text-lg font-bold uppercase"
                      style={{
                        "background-color": "var(--color-wl-correct)",
                        color: "var(--color-wl-correct-text)",
                      }}
                    >
                      {letter}
                    </div>
                  ))}
              </div>
              <p
                class="mt-2 text-xs text-fg-tertiary tracking-wide"
                class="animate-in fade-in slide-in-from-bottom-2 duration-400 delay-600 fill-mode-both"
              >
                The word was{" "}
                <span class="text-accent font-semibold uppercase tracking-widest">
                  {game.answer()}
                </span>
              </p>
            </Show>
          </ResultScreen>
        </Show>
      </Show>
    </>
  );
}
