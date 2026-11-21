import { Show } from "solid-js";
import { describeBest, getBest, wordleVariant } from "@/lib/bests";
import { formatTimer } from "@/lib/elapsedTimer";
import type { Variant } from "@/lib/wordle";
import { createWordleGame } from "@/lib/wordleGame";
import GameScreen from "./GameScreen";
import NewGameMenu from "./ui/NewGameMenu";
import ResultScreen from "./ui/ResultScreen";
import WordleBoard from "./WordleBoard";
import WordleKeyboard from "./WordleKeyboard";

function variantLabel(v: number): string {
  return `${v} letters`;
}

const LENGTH_OPTIONS = [4, 5, 6].map((value) => ({ value, label: variantLabel(value) }));

export default function WordleApp() {
  const game = createWordleGame();

  function handleBackToGames() {
    window.location.href = "/";
  }

  const resultDetail = () => {
    const guesses = game.guesses().length;
    return game.gameResult() === "won"
      ? `${variantLabel(game.variant())} · ${guesses} ${guesses === 1 ? "guess" : "guesses"}`
      : variantLabel(game.variant());
  };

  const bestText = () => {
    const best = getBest("wordle", wordleVariant(game.variant()));
    return best ? describeBest("wordle", best) : null;
  };

  return (
    <>
      <GameScreen
        title="Wordle"
        meta={variantLabel(game.variant())}
        timer={formatTimer(game.timerSeconds())}
        menu={
          <NewGameMenu
            groups={[
              {
                id: "length",
                label: "Word length",
                options: LENGTH_OPTIONS,
                value: game.variant(),
              },
            ]}
            note="Replaces the word in progress."
            onStart={(values) => game.startGame(values.length as Variant)}
          />
        }
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
      >
        <Show
          when={game.gameResult()}
          fallback={
            <WordleBoard
              variant={game.variant()}
              guesses={game.guesses()}
              currentInput={game.currentInput()}
              revealRow={game.revealRow()}
              shakeRow={game.shakeRow()}
              gameResult={game.gameResult()}
              pendingReveal={game.pendingReveal()}
            />
          }
        >
          {(result) => (
            <ResultScreen
              type={result()}
              solveTime={game.timerSeconds()}
              difficulty={resultDetail()}
              best={bestText()}
              isNewBest={game.newBest()}
              onBackToGames={handleBackToGames}
              onPlayAgain={game.playAgain}
            >
              <Show when={game.gameResult() === "lost"}>
                <div class="mt-4 flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-500 fill-mode-both">
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
              </Show>
            </ResultScreen>
          )}
        </Show>
      </GameScreen>

      {/* ── Toast overlay ───────────────────────────────────────── */}
      <Show when={game.toastMessage()}>
        <div
          class="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div class="px-5 py-2.5 rounded-lg bg-fg text-bg text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-both">
            {game.toastMessage()}
          </div>
        </div>
      </Show>
    </>
  );
}
