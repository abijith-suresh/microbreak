import { Show, createSignal } from "solid-js";
import { createWordleGame } from "@/lib/wordleGame";
import WordleSetup from "./WordleSetup";
import WordleBoard from "./WordleBoard";
import WordleKeyboard from "./WordleKeyboard";
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
              pendingReveal={game.pendingReveal()}
            />
          </div>

          {/* Keyboard — centered under the board */}
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

          {/* Bottom bar */}
          <div class="px-4 pb-5 flex justify-center">
            <button
              onClick={game.restart}
              style={{
                transition: "border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease",
              }}
              class="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-fg-tertiary hover:border-accent hover:text-accent"
            >
              Restart
            </button>
          </div>
        </div>

        {/* ── Toast overlay ───────────────────────────────────────── */}
        <Show when={game.toastMessage()}>
          <div class="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div
              class="px-5 py-2.5 rounded-lg bg-fg text-bg text-sm font-bold"
              style={{ animation: "fadeIn 0.2s ease-out both" }}
            >
              {game.toastMessage()}
            </div>
          </div>
        </Show>

        {/* ── Result overlay ──────────────────────────────────────── */}
        <Show when={game.gameResult() !== null}>
          <div
            class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg"
            style={{ animation: "fadeIn 0.4s ease-out both" }}
          >
            {/* Icon */}
            <div class="mb-6" style={{ animation: "scaleIn 0.4s ease-out 0.1s both" }}>
              {game.gameResult() === "won" ? (
                <svg width="80" height="80" viewBox="0 0 96 96" fill="none">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="var(--color-accent)"
                    stroke-width="2.5"
                    fill="none"
                    style={{
                      "stroke-dasharray": "166",
                      "stroke-dashoffset": "166",
                      animation: "checkmark 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards",
                    }}
                  />
                  <path
                    d="M30 50 L42 62 L66 36"
                    stroke="var(--color-accent)"
                    stroke-width="3"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    style={{
                      "stroke-dasharray": "48",
                      "stroke-dashoffset": "48",
                      animation: "checkmark 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards",
                    }}
                  />
                </svg>
              ) : (
                <svg width="80" height="80" viewBox="0 0 96 96" fill="none">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="var(--color-error)"
                    stroke-width="2.5"
                    fill="none"
                    style={{ animation: "scaleIn 0.4s ease-out 0.1s both" }}
                  />
                  <path
                    d="M36 36 L60 60 M60 36 L36 60"
                    stroke="var(--color-error)"
                    stroke-width="3"
                    stroke-linecap="round"
                    style={{ animation: "fadeIn 0.3s ease-out 0.4s both" }}
                  />
                </svg>
              )}
            </div>

            {/* Heading */}
            <h1
              class="font-display text-5xl md:text-6xl text-fg italic tracking-tight"
              style={{ animation: "fadeIn 0.5s ease-out 0.3s both" }}
            >
              {game.gameResult() === "won" ? "Cleared" : "Game Over"}
            </h1>

            {/* Answer on loss */}
            <Show when={game.gameResult() === "lost"}>
              <div class="mt-4 flex gap-1" style={{ animation: "fadeIn 0.4s ease-out 0.5s both" }}>
                {game
                  .answer()
                  .split("")
                  .map((letter) => (
                    <div
                      class="flex items-center justify-center w-[40px] h-[40px] rounded-md text-lg font-bold uppercase"
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
                style={{ animation: "fadeIn 0.4s ease-out 0.6s both" }}
              >
                The word was{" "}
                <span class="text-accent font-semibold uppercase tracking-widest">
                  {game.answer()}
                </span>
              </p>
            </Show>

            {/* Time */}
            <p
              class="mt-3 text-2xl md:text-3xl font-light tabular-nums"
              style={{
                animation: "fadeIn 0.5s ease-out 0.4s both",
                color:
                  game.gameResult() === "won" ? "var(--color-accent)" : "var(--color-fg-secondary)",
              }}
            >
              {(() => {
                const s = game.timerSeconds();
                const m = Math.floor(s / 60);
                const sec = s % 60;
                return m === 0 ? `${sec}s` : `${m}m ${sec.toString().padStart(2, "0")}s`;
              })()}
            </p>

            {/* Info */}
            <p
              class="mt-1 text-xs text-fg-tertiary tracking-wide"
              style={{ animation: "fadeIn 0.5s ease-out 0.5s both" }}
            >
              {variantLabel(game.variant())}
            </p>

            {/* Actions */}
            <div
              class="flex flex-col sm:flex-row items-center gap-3 mt-10"
              style={{ animation: "fadeIn 0.5s ease-out 0.6s both" }}
            >
              <button
                onClick={game.playAgain}
                class="px-8 py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover"
                style={{
                  transition: "background-color 0.2s ease, transform 0.1s ease-out",
                }}
              >
                Play Again
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

            {/* Tagline */}
            <p
              class="mt-10 text-[11px] text-fg-tertiary tracking-widest uppercase"
              style={{ animation: "fadeIn 0.5s ease-out 0.8s both" }}
            >
              {game.gameResult() === "won"
                ? "Nice break · Now back to building"
                : "Shake it off · Try again"}
            </p>
          </div>
        </Show>
      </Show>
    </>
  );
}
