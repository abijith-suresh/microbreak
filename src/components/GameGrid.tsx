import { createSignal, onMount, onCleanup, For } from "solid-js";

interface GameCard {
  name: string;
  icon: string;
  active: boolean;
  href?: string;
}

const games: GameCard[] = [
  { name: "Sudoku", icon: "⊞", active: true, href: "/sudoku" },
  { name: "Chess", icon: "♞", active: false },
  { name: "Wordle", icon: "W", active: false },
  { name: "Minesweeper", icon: "✱", active: false },
  { name: "Nonograms", icon: "▦", active: false },
  { name: "2048", icon: "2", active: false },
];

/** Game icon SVGs for the coming-soon cards */
const gameIcons: Record<string, string> = {
  Chess: "M12 2L8 8H5L3 11H6L4 20H8V22H10V20H14V22H16V20H20L18 11H21L19 8H16L12 2Z",
  Wordle:
    "M3 3H21V5H3V3ZM3 8H21V10H3V8ZM3 13H14V15H3V13ZM17 13H21V15H17V13ZM3 18H10V20H3V18ZM13 18H21V20H13V18Z",
  Minesweeper:
    "M12 4L10.5 7.5L7 8L9.5 10.5L8.5 14L12 12L15.5 14L14.5 10.5L17 8L13.5 7.5L12 4Z",
  Nonograms:
    "M3 3H8V8H3V3ZM10 3H15V8H10V3ZM17 3H22V8H17V3ZM3 10H8V15H3V10ZM10 10H15V15H10V10Z",
  "2048": "M4 4H20V20H4V4ZM8 8V12H12V8H8ZM14 8V16H18V8H14ZM8 14V18H12V14H8Z",
};

function MiniSudokuGrid() {
  const [visibleCells, setVisibleCells] = createSignal<Set<number>>(new Set());
  const [cellValues, setCellValues] = createSignal<number[]>([]);

  const pattern = [
    5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5,
    9, 7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3,
    7, 2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
  ];

  onMount(() => {
    setCellValues(pattern);

    const revealOrder = Array.from({ length: 81 }, (_, i) => i);
    for (let i = 80; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
    }

    let idx = 0;
    const batchSize = 3;

    const interval = setInterval(() => {
      if (idx >= 81) {
        setVisibleCells(new Set());
        idx = 0;
        return;
      }

      const newSet = new Set(visibleCells());
      for (let b = 0; b < batchSize && idx < 81; b++, idx++) {
        newSet.add(revealOrder[idx]);
      }
      setVisibleCells(newSet);
    }, 120);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="grid grid-cols-9 gap-[1px] p-2 w-full max-w-[160px] mx-auto rounded-lg bg-[var(--color-border)] overflow-hidden">
      <For each={cellValues()}>
        {(val, i) => {
          const row = Math.floor(i() / 9);
          const col = i() % 9;
          // Determine if this cell is at a box boundary for thicker visual gaps
          const isBoxRight = (col + 1) % 3 === 0 && col !== 8;
          const isBoxBottom = (row + 1) % 3 === 0 && row !== 8;

          return (
            <div
              class="flex items-center justify-center aspect-square bg-[var(--color-surface)] text-[7px] font-medium text-[var(--color-accent)] transition-all duration-300"
              style={{
                opacity: visibleCells().has(i()) ? "0.9" : "0",
                transform: visibleCells().has(i()) ? "scale(1)" : "scale(0.3)",
                "margin-right": isBoxRight ? "1px" : "0",
                "margin-bottom": isBoxBottom ? "1px" : "0",
              }}
            >
              {visibleCells().has(i()) ? val : ""}
            </div>
          );
        }}
      </For>
    </div>
  );
}

function GameIcon(props: { name: string }) {
  const path = () => gameIcons[props.name];
  return (
    <Show when={path()}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-[var(--color-text-tertiary)]"
      >
        <path d={path()} />
      </svg>
    </Show>
  );
}

import { Show } from "solid-js";

export default function GameGrid() {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-4xl mx-auto px-4">
      <For each={games}>
        {(game) =>
          game.active ? (
            <a
              href={game.href}
              class="group relative flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 pb-4 transition-all duration-300 hover:border-[var(--color-accent)] hover:shadow-xl hover:shadow-[var(--color-shadow-strong)] hover:-translate-y-1"
            >
              <div class="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[var(--color-success)] opacity-70" />
              <h3 class="font-display text-3xl text-[var(--color-text-primary)] italic">
                {game.name}
              </h3>
              <MiniSudokuGrid />
              <span class="text-xs text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)] transition-colors">
                Click to play →
              </span>
            </a>
          ) : (
            <div class="relative flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 pb-5 opacity-40 cursor-default select-none">
              <h3 class="font-display text-3xl text-[var(--color-text-secondary)] italic">
                {game.name}
              </h3>
              <div class="flex items-center justify-center w-full aspect-[4/3] max-h-[100px]">
                <GameIcon name={game.name} />
              </div>
              <span class="inline-flex items-center rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] px-3 py-0.5 text-[10px] font-semibold text-[var(--color-text-tertiary)] tracking-widest uppercase">
                Coming Soon
              </span>
            </div>
          )
        }
      </For>
    </div>
  );
}
