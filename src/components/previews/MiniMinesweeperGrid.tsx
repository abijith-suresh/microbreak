import { createEffect, createSignal, For, onCleanup } from "solid-js";
import { STATIC_MINESWEEPER_CELLS } from "@/data/previewGrids";
import { Flag } from "@/lib/icons";
import { PreviewFrame } from "./PreviewFrame";

export function MiniMinesweeperGrid(props: { animated: boolean }) {
  const [cells, setCells] =
    createSignal<("hidden" | "revealed" | "flagged")[]>(STATIC_MINESWEEPER_CELLS);

  // Clears more of the resting board, then starts over from it. Stopping puts it back.
  createEffect(() => {
    if (!props.animated) {
      setCells(STATIC_MINESWEEPER_CELLS);
      return;
    }

    const batchSize = 3;
    const interval = setInterval(() => {
      setCells((prev) => {
        const next = [...prev];
        const hiddenIndices = next.reduce<number[]>((acc, cell, index) => {
          if (cell === "hidden") acc.push(index);
          return acc;
        }, []);

        if (hiddenIndices.length <= 5) return STATIC_MINESWEEPER_CELLS;

        for (let b = 0; b < batchSize && hiddenIndices.length - b > 5; b++) {
          const idx = Math.floor(Math.random() * (hiddenIndices.length - b));
          const pick = hiddenIndices.splice(idx, 1)[0];
          next[pick] = Math.random() < 0.8 ? "revealed" : "flagged";
        }

        return next;
      });
    }, 160);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <PreviewFrame>
      <div class="grid grid-cols-8 gap-px overflow-hidden rounded-md border border-border-strong bg-border-strong">
        <For each={cells()}>
          {(cell) => (
            <div
              class="flex aspect-square items-center justify-center"
              style={{
                "background-color": cell === "revealed" ? "var(--color-bg)" : "var(--color-border)",
              }}
            >
              {cell === "flagged" ? (
                <Flag strokeWidth={2.5} stroke="var(--color-accent)" class="size-[62%]" />
              ) : null}
            </div>
          )}
        </For>
      </div>
    </PreviewFrame>
  );
}
