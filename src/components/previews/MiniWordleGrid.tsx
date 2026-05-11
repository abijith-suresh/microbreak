import { For, createEffect, createSignal, onCleanup } from "solid-js";
import { WORDLE_PREVIEW_WORDS, WORDLE_PREVIEW_COLORS } from "@/data/previewGrids";
import { PreviewFrame } from "./PreviewFrame";

const ticksPerRow = 10;
const pauseTicks = 10;
const cycle = ticksPerRow * 5 + pauseTicks;

export function MiniWordleGrid(props: { animated: boolean }) {
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

  const rows = WORDLE_PREVIEW_WORDS.map((word) => word.split(""));

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
                      isRevealed() || isFullyRevealed()
                        ? WORDLE_PREVIEW_COLORS[rowIdx()][colIdx()]
                        : null;

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
