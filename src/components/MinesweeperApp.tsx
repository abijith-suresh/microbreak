import { Show } from "solid-js";
import { describeBest, getBest, minesweeperVariant } from "@/lib/bests";
import { formatTimer } from "@/lib/elapsedTimer";
import { Circle, Flag } from "@/lib/icons";
import { DIFFICULTY_PRESETS, type Difficulty } from "@/lib/minesweeper";
import { createMinesweeperGame } from "@/lib/minesweeperGame";
import GameScreen from "./GameScreen";
import MinesweeperBoard from "./MinesweeperBoard";
import NewGameMenu from "./ui/NewGameMenu";
import ResultScreen from "./ui/ResultScreen";

function difficultyLabel(d: Difficulty): string {
  return DIFFICULTY_PRESETS[d].label;
}

const DIFFICULTY_OPTIONS = (["beginner", "intermediate", "expert"] as const).map((value) => ({
  value,
  label: difficultyLabel(value),
}));

export default function MinesweeperApp() {
  const game = createMinesweeperGame();

  function handleBackToGames() {
    window.location.href = "/";
  }

  const meta = () =>
    game.rows() > 0
      ? `${difficultyLabel(game.difficulty())} · ${game.cols()}×${game.rows()}`
      : difficultyLabel(game.difficulty());

  const bestText = () => {
    const variant = minesweeperVariant(game.difficulty(), game.cols(), game.rows());
    const best = getBest("minesweeper", variant);
    return best ? describeBest("minesweeper", best) : null;
  };

  return (
    <GameScreen
      title="Minesweeper"
      meta={meta()}
      timer={formatTimer(game.timerSeconds())}
      menu={
        <NewGameMenu
          groups={[
            {
              id: "difficulty",
              label: "Difficulty",
              options: DIFFICULTY_OPTIONS,
              value: game.difficulty(),
            },
          ]}
          note="Replaces the board in progress."
          onStart={(values) => game.startGame(values.difficulty as Difficulty)}
        />
      }
      belowContent={
        <Show when={game.gameResult() === null}>
          <div class="flex flex-col items-center gap-2 pb-4">
            <div class="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
              <span class="flex items-center gap-1.5 text-sm tabular-nums text-fg-secondary">
                <Circle size={10} fill="var(--color-fg-tertiary)" />
                <span class="sr-only">Mines left:</span>
                {game.mineCounter()}
              </span>
              <div class="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => game.digMode() || game.toggleMode()}
                  aria-pressed={game.digMode()}
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
                    aria-hidden="true"
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
                  type="button"
                  onClick={() => !game.digMode() || game.toggleMode()}
                  aria-pressed={!game.digMode()}
                  style={{
                    transition: "background-color 0.15s ease-out, color 0.15s ease-out",
                  }}
                  class={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-l border-border ${
                    !game.digMode()
                      ? "bg-accent text-white"
                      : "bg-surface text-fg-tertiary hover:text-fg"
                  }`}
                >
                  <Flag size={14} />
                  Flag
                </button>
              </div>
            </div>
            <p class="text-xs text-fg-tertiary tracking-wide text-center">
              Hold or right-click to flag
            </p>
          </div>
        </Show>
      }
    >
      <Show
        when={game.gameResult()}
        fallback={
          <Show when={game.board().length > 0}>
            <MinesweeperBoard
              board={game.board()}
              rows={game.rows()}
              cols={game.cols()}
              selectedCell={game.selectedCell()}
              onSelectCell={game.selectCell}
              triggeredMine={game.triggeredMine()}
              wrongFlags={game.wrongFlags()}
              onCellClick={game.handleCellClick}
              onFlagCell={game.flagCell}
              isCompleting={game.completing()}
              completionOrigin={game.completionOrigin()}
            />
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
            onBackToGames={handleBackToGames}
            onPlayAgain={game.playAgain}
          />
        )}
      </Show>
    </GameScreen>
  );
}
