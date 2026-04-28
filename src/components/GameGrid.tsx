import { createSignal, onMount, onCleanup, For, Show } from "solid-js";

interface GameCard {
  name: string;
  icon: string;
  active: boolean;
  href?: string;
}

const games: GameCard[] = [
  { name: "Sudoku", icon: "⊞", active: true, href: "/sudoku" },
  { name: "Chess", icon: "♞", active: false },
  { name: "Wordle", icon: "W", active: true, href: "/wordle" },
  { name: "Minesweeper", icon: "✱", active: true, href: "/minesweeper" },
  { name: "Nonograms", icon: "▦", active: false },
  { name: "2048", icon: "2", active: true, href: "/2048" },
];

/** Game icon SVGs for the coming-soon cards */
const gameIcons: Record<string, string> = {
  Chess: "M12 2L8 8H5L3 11H6L4 20H8V22H10V20H14V22H16V20H20L18 11H21L19 8H16L12 2Z",
  Wordle:
    "M3 3H21V5H3V3ZM3 8H21V10H3V8ZM3 13H14V15H3V13ZM17 13H21V15H17V13ZM3 18H10V20H3V18ZM13 18H21V20H13V18Z",
  Minesweeper: "M12 4L10.5 7.5L7 8L9.5 10.5L8.5 14L12 12L15.5 14L14.5 10.5L17 8L13.5 7.5L12 4Z",
  Nonograms: "M3 3H8V8H3V3ZM10 3H15V8H10V3ZM17 3H22V8H17V3ZM3 10H8V15H3V10ZM10 10H15V15H10V10Z",
  "2048": "M4 4H20V20H4V4ZM8 8V12H12V8H8ZM14 8V16H18V8H14ZM8 14V18H12V14H8Z",
};

function MiniSudokuGrid() {
  const pattern = [
    5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6,
    1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2,
    8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
  ];

  // Initialize data immediately so SSR renders full grid — prevents layout shift on hydration
  const [visibleCells, setVisibleCells] = createSignal<Set<number>>(new Set());
  const [cellValues] = createSignal<number[]>(pattern);

  onMount(() => {
    const revealOrder = Array.from({ length: 81 }, (_, i) => i);
    for (let i = 80; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
    }

    let idx = 0;
    const batchSize = 3;

    const interval = setInterval(() => {
      if (idx >= 81) {
        setVisibleCells(new Set<number>());
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
    <div class="grid grid-cols-9 gap-[1px] p-2 w-full max-w-[160px] mx-auto rounded-lg bg-border overflow-hidden">
      <For each={cellValues()}>
        {(val, i) => {
          const row = Math.floor(i() / 9);
          const col = i() % 9;
          const isBoxRight = (col + 1) % 3 === 0 && col !== 8;
          const isBoxBottom = (row + 1) % 3 === 0 && row !== 8;

          return (
            <div
              class="flex items-center justify-center aspect-square bg-surface text-[7px] font-medium text-accent"
              style={{
                opacity: visibleCells().has(i()) ? "0.9" : "0",
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
        class="text-fg-tertiary"
      >
        <path d={path()} />
      </svg>
    </Show>
  );
}

function MiniMinesweeperGrid() {
  const totalCells = 64; // 8×8 mini grid
  // Initialize with 64 hidden cells immediately — prevents layout shift on hydration
  const [cells, setCells] = createSignal<("hidden" | "revealed" | "flagged")[]>(
    Array(totalCells).fill("hidden")
  );

  onMount(() => {
    // Match Sudoku's batch cadence: 3 cells per 120 ms tick
    const batchSize = 3;

    const interval = setInterval(() => {
      setCells((prev) => {
        const next = [...prev];
        const hiddenIndices = next.reduce<number[]>((acc, c, i) => {
          if (c === "hidden") acc.push(i);
          return acc;
        }, []);

        if (hiddenIndices.length <= 5) {
          // Reset: hide all cells and start the cycle again
          return Array(totalCells).fill("hidden");
        }

        // Reveal / flag up to batchSize hidden cells per tick
        for (let b = 0; b < batchSize && hiddenIndices.length - b > 5; b++) {
          const idx = Math.floor(Math.random() * (hiddenIndices.length - b));
          const pick = hiddenIndices.splice(idx, 1)[0];
          next[pick] = Math.random() < 0.8 ? "revealed" : "flagged";
        }
        return next;
      });
    }, 120);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="grid grid-cols-8 gap-[1px] p-2 w-full max-w-[160px] mx-auto rounded-lg bg-border overflow-hidden">
      <For each={cells()}>
        {(cell) => (
          <div
            class="flex items-center justify-center aspect-square"
            style={{
              "background-color": cell === "hidden" ? "var(--color-surface)" : "var(--color-bg)",
              opacity: cell === "hidden" ? "0" : "0.9",
            }}
          >
            {cell === "flagged" ? (
              <svg
                width="7"
                height="7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                stroke-width="2.5"
                stroke-linecap="round"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            ) : null}
          </div>
        )}
      </For>
    </div>
  );
}

function Mini2048Grid() {
  const [tiles, setTiles] = createSignal<{ value: number; row: number; col: number; id: number }[]>(
    []
  );

  const tileColors: Record<number, string> = {
    2: "var(--color-tile-2)",
    4: "var(--color-tile-4)",
    8: "var(--color-tile-8)",
    16: "var(--color-tile-16)",
    32: "var(--color-tile-32)",
    64: "var(--color-tile-64)",
    128: "var(--color-tile-128)",
    256: "var(--color-tile-256)",
    512: "var(--color-tile-512)",
    1024: "var(--color-tile-1024)",
    2048: "var(--color-tile-2048)",
  };

  onMount(() => {
    const values = [2, 4, 8, 16, 32, 64, 128, 256];
    let nextId = 0;

    // Seed a few tiles
    const initial: typeof tiles extends () => (infer T)[] ? T[] : never = [];
    for (let i = 0; i < 5; i++) {
      initial.push({
        value: values[Math.floor(Math.random() * values.length)],
        row: Math.floor(Math.random() * 4),
        col: Math.floor(Math.random() * 4),
        id: nextId++,
      });
    }
    setTiles(initial);

    const interval = setInterval(() => {
      setTiles((prev) => {
        // Remove a random tile and add a new one
        const next = [...prev];
        if (next.length > 0) {
          next.splice(Math.floor(Math.random() * next.length), 1);
        }
        next.push({
          value: values[Math.floor(Math.random() * values.length)],
          row: Math.floor(Math.random() * 4),
          col: Math.floor(Math.random() * 4),
          id: nextId++,
        });
        return next;
      });
    }, 500);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="w-full max-w-[160px] aspect-square p-2">
      <div class="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full">
        <For each={Array.from({ length: 16 })}>
          {(_, idx) => {
            const r = Math.floor(idx() / 4);
            const c = idx() % 4;
            const tile = () => tiles().find((t) => t.row === r && t.col === c);
            return (
              <div class="flex items-center justify-center rounded-sm bg-surface-hover">
                <Show when={tile()}>
                  {(t) => (
                    <div
                      class="flex items-center justify-center rounded-sm w-full h-full text-[7px] font-bold"
                      style={{
                        "background-color": tileColors[t().value] || "var(--color-tile-super)",
                        color:
                          t().value <= 4
                            ? "var(--color-tile-text)"
                            : "var(--color-tile-text-light)",
                        animation: "tileAppear 300ms ease-out both",
                      }}
                    >
                      {t().value}
                    </div>
                  )}
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

function MiniWordleGrid() {
  const word = "crane";
  const colors = ["absent", "correct", "present", "absent", "correct"] as const;
  const letters = word.split("");

  // tick 0-4: typing (letters appear one by one)
  // tick 5-9: revealing (colors appear one by one)
  // tick 10-14: pause showing final state
  // tick 15: reset
  const CYCLE = 16;
  const [tick, setTick] = createSignal(0);

  onMount(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % CYCLE);
    }, 200);
    onCleanup(() => clearInterval(interval));
  });

  const typedCount = () => Math.min(tick(), 5); // 0-5 during typing phase
  const revealedCount = () => Math.max(0, Math.min(tick() - 5, 5)); // 0-5 during reveal phase

  return (
    <div class="grid grid-cols-5 gap-[2px] p-2 w-full max-w-[160px] mx-auto rounded-lg bg-border overflow-hidden">
      <For each={letters}>
        {(letter, i) => {
          const isTyped = () => i() < typedCount();
          const isRevealed = () => i() < revealedCount();
          const color = () => (isRevealed() ? colors[i()] : null);

          return (
            <div
              class="flex items-center justify-center aspect-square rounded-sm"
              style={{
                "background-color":
                  color() === "correct"
                    ? "var(--color-wl-correct)"
                    : color() === "present"
                      ? "var(--color-wl-present)"
                      : color() === "absent"
                        ? "var(--color-wl-absent)"
                        : "var(--color-surface)",
                opacity: isTyped() ? "1" : "0",
                color:
                  color() === "absent"
                    ? "var(--color-wl-absent-text)"
                    : color()
                      ? "var(--color-wl-correct-text)"
                      : "var(--color-fg)",
              }}
            >
              <span class="text-[8px] font-bold uppercase">{isTyped() ? letter : ""}</span>
            </div>
          );
        }}
      </For>
    </div>
  );
}

function GamePreview(props: { name: string }) {
  if (props.name === "Sudoku") return <MiniSudokuGrid />;
  if (props.name === "Minesweeper") return <MiniMinesweeperGrid />;
  if (props.name === "2048") return <Mini2048Grid />;
  if (props.name === "Wordle") return <MiniWordleGrid />;
  return <div class="w-full max-w-[160px] aspect-[4/3]" />;
}

export default function GameGrid() {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-4xl mx-auto px-4">
      <For each={games}>
        {(game) =>
          game.active ? (
            <a
              href={game.href}
              class="group relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 pb-4 transition-all duration-300 hover:border-accent hover:shadow-xl hover:shadow-shadow-strong hover:-translate-y-1"
            >
              <div class="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-success opacity-70" />
              <h3 class="font-display text-3xl text-fg italic">{game.name}</h3>
              <GamePreview name={game.name} />
              <span class="text-xs text-fg-tertiary group-hover:text-accent transition-colors">
                Click to play →
              </span>
            </a>
          ) : (
            <div class="relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 pb-5 opacity-40 cursor-default select-none">
              <h3 class="font-display text-3xl text-fg-secondary italic">{game.name}</h3>
              <div class="flex items-center justify-center w-full aspect-[4/3] max-h-[100px]">
                <GameIcon name={game.name} />
              </div>
              <span class="inline-flex items-center rounded-full bg-surface-hover border border-border px-3 py-0.5 text-[10px] font-semibold text-fg-tertiary tracking-widest uppercase">
                Coming Soon
              </span>
            </div>
          )
        }
      </For>
    </div>
  );
}
