import { For, Show, createEffect, createSignal, onCleanup, onMount, type JSX } from "solid-js";
import { getOrderedGames, type GameCard } from "@/data/games";

/** Game icon SVGs for the coming-soon cards */
const gameIcons: Record<string, string> = {
  Chess: "M12 2L8 8H5L3 11H6L4 20H8V22H10V20H14V22H16V20H20L18 11H21L19 8H16L12 2Z",
  Wordle:
    "M3 3H21V5H3V3ZM3 8H21V10H3V8ZM3 13H14V15H3V13ZM17 13H21V15H17V13ZM3 18H10V20H3V18ZM13 18H21V20H13V18Z",
  Minesweeper: "M12 4L10.5 7.5L7 8L9.5 10.5L8.5 14L12 12L15.5 14L14.5 10.5L17 8L13.5 7.5L12 4Z",
  Nonograms: "M3 3H8V8H3V3ZM10 3H15V8H10V3ZM17 3H22V8H17V3ZM3 10H8V15H3V10ZM10 10H15V15H10V10Z",
  "2048": "M4 4H20V20H4V4ZM8 8V12H12V8H8ZM14 8V16H18V8H14ZM8 14V18H12V14H8Z",
};

const ALL_SUDOKU_CELLS = new Set(Array.from({ length: 81 }, (_, i) => i));
const STATIC_MINESWEEPER_CELLS: ("hidden" | "revealed" | "flagged")[] = [
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "hidden",
  "flagged",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "flagged",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "flagged",
  "hidden",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "hidden",
  "hidden",
  "revealed",
  "flagged",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
  "hidden",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "flagged",
  "hidden",
  "hidden",
  "revealed",
  "hidden",
  "hidden",
  "revealed",
  "revealed",
  "hidden",
];
const STATIC_2048_TILES = [
  { value: 2, row: 0, col: 0, id: 0 },
  { value: 4, row: 0, col: 2, id: 1 },
  { value: 8, row: 1, col: 1, id: 2 },
  { value: 16, row: 2, col: 3, id: 3 },
  { value: 32, row: 3, col: 0, id: 4 },
  { value: 64, row: 3, col: 2, id: 5 },
];

function categoryLabel(category: GameCard["category"]) {
  if (category === "logic") return "Logic";
  if (category === "word") return "Word";
  return "Arcade";
}

function PreviewFrame(props: { children: JSX.Element }) {
  return <div class="w-full max-w-[160px] mx-auto">{props.children}</div>;
}

function MiniSudokuGrid(props: { animated: boolean }) {
  const pattern = [
    5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6,
    1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2,
    8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9,
  ];

  const [visibleCells, setVisibleCells] = createSignal<Set<number>>(new Set());

  createEffect(() => {
    if (!props.animated) return;

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

      const next = new Set(visibleCells());
      for (let b = 0; b < batchSize && idx < 81; b++, idx++) {
        next.add(revealOrder[idx]);
      }
      setVisibleCells(next);
    }, 120);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <PreviewFrame>
      <div class="grid grid-cols-9 gap-[1px] rounded-lg bg-border p-2 overflow-hidden">
        <For each={pattern}>
          {(value, i) => {
            const row = Math.floor(i() / 9);
            const col = i() % 9;
            const isBoxRight = (col + 1) % 3 === 0 && col !== 8;
            const isBoxBottom = (row + 1) % 3 === 0 && row !== 8;
            const isVisible = () =>
              props.animated ? visibleCells().has(i()) : ALL_SUDOKU_CELLS.has(i());

            return (
              <div
                class="flex aspect-square items-center justify-center bg-surface text-[7px] font-medium text-accent"
                style={{
                  opacity: isVisible() ? "0.9" : "0",
                  "margin-right": isBoxRight ? "1px" : "0",
                  "margin-bottom": isBoxBottom ? "1px" : "0",
                }}
              >
                {isVisible() ? value : ""}
              </div>
            );
          }}
        </For>
      </div>
    </PreviewFrame>
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

function MiniMinesweeperGrid(props: { animated: boolean }) {
  const totalCells = 64;
  const [cells, setCells] = createSignal<("hidden" | "revealed" | "flagged")[]>(
    Array(totalCells).fill("hidden")
  );

  createEffect(() => {
    if (!props.animated) return;

    const batchSize = 3;
    const interval = setInterval(() => {
      setCells((prev) => {
        const next = [...prev];
        const hiddenIndices = next.reduce<number[]>((acc, cell, index) => {
          if (cell === "hidden") acc.push(index);
          return acc;
        }, []);

        if (hiddenIndices.length <= 5) {
          return Array(totalCells).fill("hidden");
        }

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

  const previewCells = () => (props.animated ? cells() : STATIC_MINESWEEPER_CELLS);

  return (
    <PreviewFrame>
      <div class="grid grid-cols-8 gap-[1px] rounded-lg bg-border p-2 overflow-hidden">
        <For each={previewCells()}>
          {(cell) => (
            <div
              class="flex aspect-square items-center justify-center"
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
    </PreviewFrame>
  );
}

function Mini2048Grid(props: { animated: boolean }) {
  const [tiles, setTiles] =
    createSignal<{ value: number; row: number; col: number; id: number }[]>(STATIC_2048_TILES);

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

  createEffect(() => {
    if (!props.animated) {
      setTiles(STATIC_2048_TILES);
      return;
    }

    const values = [2, 4, 8, 16, 32, 64, 128, 256];
    let nextId = 0;

    const initial: typeof STATIC_2048_TILES = [];
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
    <PreviewFrame>
      <div class="aspect-square w-full p-2">
        <div class="grid h-full w-full grid-cols-4 grid-rows-4 gap-1">
          <For each={Array.from({ length: 16 })}>
            {(_, idx) => {
              const row = Math.floor(idx() / 4);
              const col = idx() % 4;
              const tile = () => tiles().find((entry) => entry.row === row && entry.col === col);
              return (
                <div class="flex items-center justify-center rounded-sm bg-surface-hover">
                  <Show when={tile()}>
                    {(entry) => (
                      <div
                        class="flex h-full w-full items-center justify-center rounded-sm text-[7px] font-bold"
                        style={{
                          "background-color":
                            tileColors[entry().value] || "var(--color-tile-super)",
                          color:
                            entry().value <= 4
                              ? "var(--color-tile-text)"
                              : "var(--color-tile-text-light)",
                          animation: props.animated ? "tileAppear 300ms ease-out both" : "none",
                        }}
                      >
                        {entry().value}
                      </div>
                    )}
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </PreviewFrame>
  );
}

function MiniWordleGrid(props: { animated: boolean }) {
  const words = ["crane", "slate", "trace", "crate", "stare"];
  const colors: ("absent" | "correct" | "present")[][] = [
    ["absent", "correct", "present", "absent", "correct"],
    ["correct", "absent", "present", "absent", "correct"],
    ["present", "absent", "correct", "present", "absent"],
    ["absent", "present", "correct", "absent", "correct"],
    ["correct", "correct", "correct", "correct", "correct"],
  ];
  const ticksPerRow = 10;
  const pauseTicks = 10;
  const cycle = ticksPerRow * 5 + pauseTicks;
  const [tick, setTick] = createSignal(0);

  createEffect(() => {
    if (!props.animated) {
      setTick(cycle - 1);
      return;
    }

    const interval = setInterval(() => {
      setTick((value) => (value + 1) % cycle);
    }, 100);

    onCleanup(() => clearInterval(interval));
  });

  const rows = words.map((word) => word.split(""));

  return (
    <PreviewFrame>
      <div class="grid grid-rows-5 gap-[2px] rounded-lg bg-border p-2 overflow-hidden">
        <For each={rows}>
          {(letters, rowIdx) => {
            const rowTick = () => tick() - rowIdx() * ticksPerRow;
            const typedCount = () => (rowTick() >= 0 ? Math.min(Math.floor(rowTick()), 5) : 0);
            const revealedCount = () => (rowTick() >= 5 ? Math.min(rowTick() - 5, 5) : 0);
            const isFullyRevealed = () => !props.animated || rowTick() >= 10;

            return (
              <div class="grid grid-cols-5 gap-[2px]">
                <For each={letters}>
                  {(letter, colIdx) => {
                    const isTyped = () => colIdx() < typedCount();
                    const isRevealed = () => colIdx() < revealedCount();
                    const color = () =>
                      isRevealed() || isFullyRevealed() ? colors[rowIdx()][colIdx()] : null;

                    return (
                      <div
                        class="flex aspect-square items-center justify-center rounded-sm"
                        style={{
                          "background-color":
                            color() === "correct"
                              ? "var(--color-wl-correct)"
                              : color() === "present"
                                ? "var(--color-wl-present)"
                                : color() === "absent"
                                  ? "var(--color-wl-absent)"
                                  : "var(--color-surface)",
                          opacity: isTyped() || isFullyRevealed() ? "1" : "0",
                          color:
                            color() === "absent"
                              ? "var(--color-wl-absent-text)"
                              : color()
                                ? "var(--color-wl-correct-text)"
                                : "var(--color-fg)",
                        }}
                      >
                        <span class="text-[7px] font-bold uppercase">
                          {isTyped() || isFullyRevealed() ? letter : ""}
                        </span>
                      </div>
                    );
                  }}
                </For>
              </div>
            );
          }}
        </For>
      </div>
    </PreviewFrame>
  );
}

function GamePreview(props: { game: GameCard; animated: boolean }) {
  if (props.game.name === "Sudoku") return <MiniSudokuGrid animated={props.animated} />;
  if (props.game.name === "Minesweeper") return <MiniMinesweeperGrid animated={props.animated} />;
  if (props.game.name === "2048") return <Mini2048Grid animated={props.animated} />;
  if (props.game.name === "Wordle") return <MiniWordleGrid animated={props.animated} />;
  return <div class="w-full max-w-[160px] aspect-[4/3]" />;
}

function StatusBadge(props: { status: GameCard["status"] }) {
  return props.status === "available" ? (
    <span class="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
      <span class="h-1.5 w-1.5 rounded-full bg-success" />
      Available
    </span>
  ) : (
    <span class="inline-flex items-center rounded-full bg-surface-hover border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-tertiary">
      Coming soon
    </span>
  );
}

export default function GameGrid() {
  const [animationsEnabled, setAnimationsEnabled] = createSignal(false);

  onMount(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setAnimationsEnabled(document.visibilityState === "visible" && !mediaQuery.matches);
    };

    update();
    document.addEventListener("visibilitychange", update);
    mediaQuery.addEventListener("change", update);

    onCleanup(() => {
      document.removeEventListener("visibilitychange", update);
      mediaQuery.removeEventListener("change", update);
    });
  });

  return (
    <div class="grid grid-cols-1 gap-4 px-4 mx-auto max-w-5xl sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
      <For each={getOrderedGames()}>
        {(game) => {
          const isAvailable = game.status === "available";

          return isAvailable ? (
            <a
              href={game.href}
              class="group relative flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-xl hover:shadow-shadow-strong"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-fg-tertiary">
                    <span class="rounded-full border border-border px-2.5 py-1">
                      {categoryLabel(game.category)}
                    </span>
                    <span>{game.sessionLength}</span>
                  </div>
                  <div>
                    <h3 class="font-display text-3xl italic text-fg">{game.name}</h3>
                    <p class="mt-2 max-w-[18rem] text-sm leading-relaxed text-fg-secondary">
                      {game.blurb}
                    </p>
                  </div>
                </div>
                <StatusBadge status={game.status} />
              </div>

              <div class="rounded-2xl border border-border bg-bg/60 py-4">
                <GamePreview game={game} animated={animationsEnabled()} />
              </div>

              <div class="flex flex-wrap gap-2">
                <For each={game.tags}>
                  {(tag) => (
                    <span class="rounded-full bg-surface-hover px-2.5 py-1 text-[11px] text-fg-secondary">
                      {tag}
                    </span>
                  )}
                </For>
              </div>

              <span class="text-xs text-fg-tertiary transition-colors group-hover:text-accent">
                Play now →
              </span>
            </a>
          ) : (
            <div class="relative flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 opacity-70 select-none">
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-fg-tertiary">
                    <span class="rounded-full border border-border px-2.5 py-1">
                      {categoryLabel(game.category)}
                    </span>
                    <span>{game.sessionLength}</span>
                  </div>
                  <div>
                    <h3 class="font-display text-3xl italic text-fg-secondary">{game.name}</h3>
                    <p class="mt-2 max-w-[18rem] text-sm leading-relaxed text-fg-tertiary">
                      {game.blurb}
                    </p>
                  </div>
                </div>
                <StatusBadge status={game.status} />
              </div>

              <div class="flex min-h-[160px] items-center justify-center rounded-2xl border border-border bg-bg/60">
                <GameIcon name={game.name} />
              </div>

              <div class="flex flex-wrap gap-2">
                <For each={game.tags}>
                  {(tag) => (
                    <span class="rounded-full bg-surface-hover px-2.5 py-1 text-[11px] text-fg-tertiary">
                      {tag}
                    </span>
                  )}
                </For>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
