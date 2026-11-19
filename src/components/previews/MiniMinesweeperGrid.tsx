import { createEffect, createSignal, For, onCleanup } from "solid-js";
import { STATIC_MINESWEEPER_CELLS } from "@/data/previewGrids";
import { Flag } from "@/lib/icons";
import { PreviewFrame } from "./PreviewFrame";

export function MiniMinesweeperGrid(props: { animated: boolean }) {
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
      <div class="grid grid-cols-8 gap-px rounded-lg bg-border p-2 overflow-hidden">
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
                <Flag size={7} strokeWidth={2.5} stroke="var(--color-accent)" />
              ) : null}
            </div>
          )}
        </For>
      </div>
    </PreviewFrame>
  );
}
