import { createEffect, createSignal, For, onCleanup } from "solid-js";
import {
  MINESWEEPER_PREVIEW_MINES,
  previewMineCount,
  STATIC_MINESWEEPER_CELLS,
} from "@/data/previewGrids";
import { Flag } from "@/lib/icons";
import { PreviewFrame } from "./PreviewFrame";

export function MiniMinesweeperGrid(props: { animated: boolean }) {
  const [cells, setCells] =
    createSignal<("hidden" | "revealed" | "flagged")[]>(STATIC_MINESWEEPER_CELLS);

  // Clears the rest of the resting board (flagging mines, opening the others), then starts over
  // from it. Stopping puts it back.
  createEffect(() => {
    if (!props.animated) {
      setCells(STATIC_MINESWEEPER_CELLS);
      return;
    }

    const batchSize = 2;
    const interval = setInterval(() => {
      setCells((prev) => {
        const next = [...prev];
        const hiddenIndices = next.reduce<number[]>((acc, cell, index) => {
          if (cell === "hidden") acc.push(index);
          return acc;
        }, []);

        if (hiddenIndices.length === 0) return STATIC_MINESWEEPER_CELLS;

        for (let b = 0; b < batchSize && hiddenIndices.length > 0; b++) {
          const pick = hiddenIndices.splice(Math.floor(Math.random() * hiddenIndices.length), 1)[0];
          next[pick] = MINESWEEPER_PREVIEW_MINES.has(pick) ? "flagged" : "revealed";
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
          {(cell, i) => {
            const count = previewMineCount(i());
            return (
              <div
                class="flex aspect-square items-center justify-center font-bold leading-none"
                style={{
                  "background-color":
                    cell === "revealed" ? "var(--color-bg)" : "var(--color-border)",
                  color: `var(--color-ms-${count})`,
                  "font-size": "calc(var(--frame) / 8 * 0.5)",
                }}
              >
                {cell === "flagged" ? (
                  <Flag strokeWidth={2.5} stroke="var(--color-accent)" class="size-[62%]" />
                ) : cell === "revealed" && count > 0 ? (
                  count
                ) : null}
              </div>
            );
          }}
        </For>
      </div>
    </PreviewFrame>
  );
}
