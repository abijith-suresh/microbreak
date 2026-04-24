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
    <div class="grid grid-cols-9 gap-px p-2 w-full max-w-[180px] mx-auto">
      <For each={cellValues()}>
        {(val, i) => (
          <div
            class="flex items-center justify-center aspect-square text-[8px] font-medium text-[var(--color-accent)] transition-all duration-300"
            style={{
              opacity: visibleCells().has(i()) ? "1" : "0",
              transform: visibleCells().has(i()) ? "scale(1)" : "scale(0.5)",
            }}
          >
            {visibleCells().has(i()) ? val : ""}
          </div>
        )}
      </For>
    </div>
  );
}

export default function GameGrid() {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-4xl mx-auto px-4">
      <For each={games}>
        {(game) =>
          game.active ? (
            <a
              href={game.href}
              class="group relative flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 pb-3 transition-all duration-200 hover:border-[var(--color-accent)] hover:shadow-lg hover:shadow-[var(--color-shadow-strong)] hover:-translate-y-0.5"
            >
              <h3 class="font-display text-2xl text-[var(--color-text-primary)]">{game.name}</h3>
              <MiniSudokuGrid />
              <span class="sr-only">Play {game.name}</span>
            </a>
          ) : (
            <div class="relative flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 pb-4 opacity-50 cursor-default">
              <h3 class="font-display text-2xl text-[var(--color-text-secondary)]">{game.name}</h3>
              <div class="flex items-center justify-center w-full aspect-[4/3] max-h-[120px]">
                <span class="text-4xl text-[var(--color-text-tertiary)] select-none">
                  {game.icon}
                </span>
              </div>
              <span class="inline-flex items-center rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)] tracking-wide uppercase">
                Coming Soon
              </span>
            </div>
          )
        }
      </For>
    </div>
  );
}
