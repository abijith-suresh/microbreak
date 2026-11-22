import { createEffect, createSignal, For, onCleanup } from "solid-js";
import {
  SUDOKU_GIVEN_CELLS,
  SUDOKU_PREVIEW_PATTERN,
  SUDOKU_RESTING_CELLS,
} from "@/data/previewGrids";
import { PreviewFrame } from "./PreviewFrame";

export function MiniSudokuGrid(props: { animated: boolean }) {
  const [visibleCells, setVisibleCells] = createSignal<Set<number>>(SUDOKU_RESTING_CELLS);

  // Solves the rest of the resting puzzle, then starts over from it. Stopping puts it back.
  createEffect(() => {
    if (!props.animated) {
      setVisibleCells(SUDOKU_RESTING_CELLS);
      return;
    }

    const revealOrder = Array.from({ length: 81 }, (_, i) => i).filter(
      (i) => !SUDOKU_RESTING_CELLS.has(i)
    );
    for (let i = revealOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
    }

    let idx = 0;
    const batchSize = 3;

    const interval = setInterval(() => {
      if (idx >= revealOrder.length) {
        setVisibleCells(SUDOKU_RESTING_CELLS);
        idx = 0;
        return;
      }

      const next = new Set(visibleCells());
      for (let b = 0; b < batchSize && idx < revealOrder.length; b++, idx++) {
        next.add(revealOrder[idx]);
      }
      setVisibleCells(next);
    }, 180);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <PreviewFrame>
      <div class="grid grid-cols-9 gap-px overflow-hidden rounded-md border border-border-strong bg-border">
        <For each={SUDOKU_PREVIEW_PATTERN}>
          {(value, i) => {
            const row = Math.floor(i() / 9);
            const col = i() % 9;
            const isBoxRight = (col + 1) % 3 === 0 && col !== 8;
            const isBoxBottom = (row + 1) % 3 === 0 && row !== 8;
            const isVisible = () => visibleCells().has(i());
            const isGiven = SUDOKU_GIVEN_CELLS.has(i());

            return (
              <div
                class={`flex aspect-square items-center justify-center bg-surface leading-none ${
                  isGiven ? "font-bold text-fg" : "font-medium text-accent"
                }`}
                style={{
                  "font-size": "calc(var(--frame) / 9 * 0.5)",
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
