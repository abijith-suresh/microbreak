import { createEffect, createSignal, For, onCleanup } from "solid-js";
import {
  WORDLE_PREVIEW_COLORS,
  WORDLE_PREVIEW_WORDS,
  WORDLE_RESTING_ROWS,
} from "@/data/previewGrids";
import { PreviewFrame } from "./PreviewFrame";

const ticksPerRow = 10;
const pauseTicks = 10;
const cycle = ticksPerRow * 5 + pauseTicks;
/** At rest the first rows are guessed and the rest are empty. */
const restingTick = ticksPerRow * WORDLE_RESTING_ROWS;

export function MiniWordleGrid(props: { animated: boolean }) {
  const [tick, setTick] = createSignal(restingTick);

  // Types and reveals the remaining guesses, then starts over from rest. Stopping puts it back.
  createEffect(() => {
    if (!props.animated) {
      setTick(restingTick);
      return;
    }

    const interval = setInterval(() => {
      setTick((value) => (value + 1 >= cycle ? restingTick : value + 1));
    }, 100);

    onCleanup(() => clearInterval(interval));
  });

  const rows = WORDLE_PREVIEW_WORDS.map((word) => word.split(""));

  return (
    <PreviewFrame>
      <div class="grid" style={{ gap: "calc(var(--frame) * 0.045)" }}>
        <For each={rows}>
          {(letters, rowIdx) => {
            const rowTick = () => tick() - rowIdx() * ticksPerRow;
            const typedCount = () => (rowTick() >= 0 ? Math.min(Math.floor(rowTick()), 5) : 0);
            const revealedCount = () => (rowTick() >= 5 ? Math.min(rowTick() - 5, 5) : 0);
            const isFullyRevealed = () => rowTick() >= 10;

            return (
              <div class="grid grid-cols-5" style={{ gap: "calc(var(--frame) * 0.045)" }}>
                <For each={letters}>
                  {(letter, colIdx) => {
                    const isTyped = () => colIdx() < typedCount();
                    const isRevealed = () => colIdx() < revealedCount();
                    const color = () =>
                      isRevealed() || isFullyRevealed()
                        ? WORDLE_PREVIEW_COLORS[rowIdx()][colIdx()]
                        : null;

                    return (
                      <div
                        class="flex aspect-square items-center justify-center rounded-[3px] border"
                        style={{
                          "background-color":
                            color() === "correct"
                              ? "var(--color-wl-correct)"
                              : color() === "present"
                                ? "var(--color-wl-present)"
                                : color() === "absent"
                                  ? "var(--color-wl-absent)"
                                  : "var(--color-surface)",
                          "border-color": color()
                            ? "transparent"
                            : isTyped()
                              ? "var(--color-border-strong)"
                              : "var(--color-border)",
                          color:
                            color() === "absent"
                              ? "var(--color-wl-absent-text)"
                              : color()
                                ? "var(--color-wl-correct-text)"
                                : "var(--color-fg)",
                        }}
                      >
                        <span
                          class="font-bold uppercase leading-none"
                          style={{ "font-size": "calc(var(--frame) / 5 * 0.42)" }}
                        >
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
