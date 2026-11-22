import { Show } from "solid-js";
import { describeBest, getBest, nonogramVariant } from "@/lib/bests";
import { formatTimer } from "@/lib/elapsedTimer";
import { NONOGRAM_SIZE_LABELS, NONOGRAM_SIZES, type NonogramSize } from "@/lib/nonogram";
import { createNonogramGame, type Mode } from "@/lib/nonogramGame";
import GameScreen from "./GameScreen";
import NonogramsBoard from "./NonogramsBoard";
import NewGameMenu from "./ui/NewGameMenu";
import ResultScreen from "./ui/ResultScreen";

const SIZE_OPTIONS = NONOGRAM_SIZES.map((value) => ({ value, label: `${value}×${value}` }));

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: "fill", label: "Fill", icon: "M5 5h14v14H5z" },
  { value: "cross", label: "Cross", icon: "M6 6l12 12M18 6L6 18" },
];

export default function NonogramsApp() {
  const game = createNonogramGame();

  const meta = () => `${game.size()}×${game.size()} · ${NONOGRAM_SIZE_LABELS[game.size()]}`;

  const bestText = () => {
    const best = getBest("nonograms", nonogramVariant(game.size()));
    return best ? describeBest("nonograms", best) : null;
  };

  return (
    <GameScreen
      title="Nonograms"
      meta={meta()}
      timer={formatTimer(game.timerSeconds())}
      menu={
        <NewGameMenu
          groups={[{ id: "size", label: "Size", options: SIZE_OPTIONS, value: game.size() }]}
          note="Replaces the board in progress."
          onStart={(values) => game.startGame(values.size as NonogramSize)}
        />
      }
    >
      <Show
        when={game.gameResult()}
        fallback={
          <Show when={game.puzzle()}>
            {(puzzle) => (
              <>
                <NonogramsBoard
                  size={puzzle().size}
                  rowClues={puzzle().rowClues}
                  colClues={puzzle().colClues}
                  marks={game.marks()}
                  satisfiedRows={game.satisfied().rows}
                  satisfiedCols={game.satisfied().cols}
                  selectedCell={game.selectedCell()}
                  isCompleting={game.completing()}
                  onSelectCell={game.selectCell}
                  onBeginStroke={game.beginStroke}
                  onExtendStroke={game.extendStroke}
                  onEndStroke={game.endStroke}
                  onMarkCell={game.markCell}
                />
                {/* Under the board, like Sudoku's number pad. */}
                <div class="flex flex-col items-center gap-2">
                  <div class="flex rounded-lg border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
                    {MODES.map(({ value, label, icon }, i) => (
                      <button
                        type="button"
                        onClick={() => game.setMode(value)}
                        aria-pressed={game.mode() === value}
                        style={{
                          transition: "background-color 0.15s ease-out, color 0.15s ease-out",
                        }}
                        class={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${
                          i > 0 ? "border-l border-border" : ""
                        } ${
                          game.mode() === value
                            ? "bg-accent text-white"
                            : "bg-surface text-fg-tertiary hover:text-fg"
                        }`}
                      >
                        <svg
                          aria-hidden="true"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill={value === "fill" ? "currentColor" : "none"}
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d={icon} />
                        </svg>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p class="text-xs text-fg-tertiary tracking-wide text-center">
                    Drag to mark a whole line
                  </p>
                </div>
              </>
            )}
          </Show>
        }
      >
        {(result) => (
          <ResultScreen
            type={result()}
            solveTime={game.timerSeconds()}
            difficulty={meta()}
            best={bestText()}
            isNewBest={game.newBest()}
            onBackToGames={() => {
              window.location.href = "/";
            }}
            onPlayAgain={game.playAgain}
          />
        )}
      </Show>
    </GameScreen>
  );
}
