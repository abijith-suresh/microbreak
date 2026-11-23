import { type Component, createSignal, For, onCleanup, onMount } from "solid-js";
import { getShownGames } from "@/data/games";
import { MiniMinesweeperGrid } from "./previews/MiniMinesweeperGrid";
import { MiniNonogramsGrid } from "./previews/MiniNonogramsGrid";
import { MiniSudokuGrid } from "./previews/MiniSudokuGrid";
import { MiniWordleGrid } from "./previews/MiniWordleGrid";

const PREVIEWS: Record<string, Component<{ animated: boolean }>> = {
  Sudoku: MiniSudokuGrid,
  Wordle: MiniWordleGrid,
  Minesweeper: MiniMinesweeperGrid,
  Nonograms: MiniNonogramsGrid,
};

/**
 * The home page's game cards: a sample board, the name and one line, the whole card a link.
 * The cards invite you to play; they never show your own game, which resumes when opened.
 *
 * A card's board plays its animation only while that card is hovered or focused, on devices
 * with a fine pointer and without a reduced-motion preference. Everyone else sees it at rest.
 */
export default function GameGrid() {
  const cards = getShownGames().filter((game) => game.name in PREVIEWS);
  const [active, setActive] = createSignal<string | null>(null);
  const [motion, setMotion] = createSignal(false);

  onMount(() => {
    const query = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    const update = () => setMotion(query.matches);
    update();
    query.addEventListener("change", update);
    onCleanup(() => query.removeEventListener("change", update));
  });

  const start = (name: string) => setActive(name);
  const stop = (name: string) => setActive((current) => (current === name ? null : current));

  return (
    // Rows of two, then three, with a short last row centred under the full ones.
    <ul class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-5">
      <For each={cards}>
        {(game) => {
          const Preview = PREVIEWS[game.name];
          const animated = () => motion() && active() === game.name;
          // Morphs into the game's board and title (see GameScreen).
          const slug = game.name.toLowerCase();
          return (
            <li class="sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]">
              <a
                href={game.href}
                data-animating={animated()}
                onMouseEnter={() => start(game.name)}
                onMouseLeave={() => stop(game.name)}
                onFocus={() => start(game.name)}
                onBlur={() => stop(game.name)}
                class="group flex h-full items-center gap-4 rounded-[14px] border border-border bg-surface p-2.5 transition duration-200 hover:border-accent hover:shadow-[0_16px_32px_-12px_var(--color-shadow-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-col sm:items-stretch sm:gap-4 sm:rounded-2xl sm:p-3.5 sm:pb-5 sm:hover:-translate-y-0.5"
              >
                <div
                  aria-hidden="true"
                  class="flex aspect-square w-22 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-hover [container-type:size] sm:aspect-[4/3] sm:w-full"
                >
                  <div
                    style={{
                      "view-transition-name": `board-${slug}`,
                      "view-transition-class": "board",
                    }}
                  >
                    <Preview animated={animated()} />
                  </div>
                </div>
                <div class="flex min-w-0 flex-col gap-1 sm:gap-1.5 sm:px-1">
                  <h2
                    style={{ "view-transition-name": `title-${slug}` }}
                    class="w-fit font-display text-[24px] leading-none text-fg italic sm:text-[28px] lg:text-[32px]"
                  >
                    {game.name}
                  </h2>
                  <p class="text-[13px] leading-snug text-fg-secondary sm:text-sm">{game.line}</p>
                </div>
              </a>
            </li>
          );
        }}
      </For>
    </ul>
  );
}
