import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";
import {
  CALCUDOKU_FILL_ORDER,
  CALCUDOKU_PREVIEW_CAGES,
  CALCUDOKU_PREVIEW_CLUES,
  CALCUDOKU_PREVIEW_NOTES,
  CALCUDOKU_PREVIEW_SOLUTION,
  CALCUDOKU_RESTING_CELLS,
} from "@/data/previewGrids";
import { PreviewFrame } from "./PreviewFrame";

const SIZE = 5;
/** Ticks the solved cages hold before the board starts over. */
const HOLD_TICKS = 4;

const cageOf = (i: number) => CALCUDOKU_PREVIEW_CAGES[i];
const clueCells = new Set(
  Object.keys(CALCUDOKU_PREVIEW_CLUES).map((cage) => CALCUDOKU_PREVIEW_CAGES.indexOf(cage))
);

function cageBorder(i: number): Record<string, string> {
  const row = Math.floor(i / SIZE);
  const col = i % SIZE;
  const line = (same: boolean) =>
    same ? "1px solid var(--color-border)" : "1.5px solid var(--color-fg-tertiary)";
  return {
    "border-right": col < SIZE - 1 ? line(cageOf(i) === cageOf(i + 1)) : "0",
    "border-bottom": row < SIZE - 1 ? line(cageOf(i) === cageOf(i + SIZE)) : "0",
  };
}

export function MiniCalcudokuGrid(props: { animated: boolean }) {
  const [step, setStep] = createSignal(0);

  // Fills the next cages one cell at a time, holds, then starts over. Stopping puts it back.
  createEffect(() => {
    if (!props.animated) {
      setStep(0);
      return;
    }
    const interval = setInterval(() => {
      setStep((value) => (value >= CALCUDOKU_FILL_ORDER.length + HOLD_TICKS ? 0 : value + 1));
    }, 320);
    onCleanup(() => clearInterval(interval));
  });

  const filled = () => new Set(CALCUDOKU_FILL_ORDER.slice(0, step()));

  return (
    <PreviewFrame>
      <div class="grid grid-cols-5 overflow-hidden rounded-md border border-border-strong bg-surface">
        <For each={CALCUDOKU_PREVIEW_SOLUTION}>
          {(digit, i) => {
            const isGiven = /^\d+$/.test(CALCUDOKU_PREVIEW_CLUES[cageOf(i())]);
            const shown = () => CALCUDOKU_RESTING_CELLS.has(i()) || filled().has(i());
            const notes = () => (shown() ? [] : (CALCUDOKU_PREVIEW_NOTES[i()] ?? []));
            return (
              <div
                class={`relative flex aspect-square items-center justify-center leading-none ${
                  isGiven ? "bg-surface font-bold text-fg" : "font-medium text-accent"
                }`}
                style={{ ...cageBorder(i()), "font-size": "calc(var(--frame) / 5 * 0.44)" }}
              >
                <Show when={clueCells.has(i())}>
                  <span
                    class="absolute font-semibold text-fg-secondary"
                    style={{
                      top: "6%",
                      left: "8%",
                      "font-size": "calc(var(--frame) / 5 * 0.2)",
                    }}
                  >
                    {CALCUDOKU_PREVIEW_CLUES[cageOf(i())]}
                  </span>
                </Show>
                <Show when={shown()}>
                  <span style={{ "padding-top": "12%" }}>{digit}</span>
                </Show>
                <Show when={notes().length > 0}>
                  <span
                    class="absolute font-medium text-fg-secondary"
                    style={{ bottom: "10%", "font-size": "calc(var(--frame) / 5 * 0.2)" }}
                  >
                    {notes().join(" ")}
                  </span>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </PreviewFrame>
  );
}
