import { onMount } from "solid-js";

interface GameCard {
  name: string;
  icon: string;
  active: boolean;
  href?: string;
}

const games: GameCard[] = [
  {
    name: "Sudoku",
    icon: "⊞",
    active: true,
    href: "/sudoku",
  },
  { name: "Chess", icon: "♞", active: false },
  { name: "Wordle", icon: "W", active: false },
  { name: "Minesweeper", icon: "✱", active: false },
  { name: "Nonograms", icon: "▦", active: false },
  { name: "2048", icon: "2", active: false },
];

/** Mini animated Sudoku grid for the active card */
function MiniSudokuGrid() {
  let frame = 0;
  let interval: ReturnType<typeof setInterval>;

  const cells = Array.from({ length: 81 }, () => ({
    value: 0,
    visible: false,
  }));

  // Pre-generate a solved 9×9 pattern (simplified for animation)
  const pattern = [
    5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5,
    9, 7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3,
    7, 2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
  ];

  onMount(() => {
    // Reveal cells progressively
    const revealOrder = Array.from({ length: 81 }, (_, i) => i);
    // Shuffle for more organic feel
    for (let i = 80; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
    }

    let idx = 0;
    const batchSize = 3;

    interval = setInterval(() => {
      // Reset after full reveal
      if (idx >= 81) {
        for (let k = 0; k < 81; k++) cells[k].visible = false;
        idx = 0;
        frame++;
      }

      // Reveal batch
      for (let b = 0; b < batchSize && idx < 81; b++, idx++) {
        const pos = revealOrder[idx];
        cells[pos].value = pattern[pos];
        cells[pos].visible = true;
      }

      // Force update via DOM
      const container = document.getElementById("mini-grid");
      if (container) {
        const cellEls = container.querySelectorAll(".mc");
        cells.forEach((cell, i) => {
          const el = cellEls[i] as HTMLElement;
          if (el) {
            if (cell.visible) {
              el.textContent = String(cell.value);
              el.style.opacity = "1";
              el.style.transform = "scale(1)";
            } else {
              el.textContent = "";
              el.style.opacity = "0";
              el.style.transform = "scale(0.5)";
            }
          }
        });
      }
    }, 120);

    return () => clearInterval(interval);
  });

  return (
    <div id="mini-grid" class="grid grid-cols-9 gap-px p-2 w-full max-w-[180px] mx-auto">
      {cells.map(() => (
        <div
          class="mc flex items-center justify-center aspect-square text-[8px] font-medium text-[var(--color-accent)] transition-all duration-300"
          style={{ opacity: 0, transform: "scale(0.5)" }}
        />
      ))}
    </div>
  );
}

export default function GameGrid() {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-4xl mx-auto px-4">
      {games.map((game) =>
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
              <span class="text-4xl text-[var(--color-text-tertiary)]">{game.icon}</span>
            </div>
            <span class="inline-flex items-center rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)] tracking-wide uppercase">
              Coming Soon
            </span>
          </div>
        )
      )}
    </div>
  );
}
