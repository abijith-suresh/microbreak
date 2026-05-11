import { For, createEffect, createSignal, onCleanup } from "solid-js";
import { ALL_SUDOKU_CELLS, SUDOKU_PREVIEW_PATTERN } from "@/data/previewGrids";
import { PreviewFrame } from "./PreviewFrame";

export function MiniSudokuGrid(props: { animated: boolean }) {
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
        <For each={SUDOKU_PREVIEW_PATTERN}>
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
