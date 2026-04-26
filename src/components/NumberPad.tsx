import { createSignal } from "solid-js";
import type { GridSize } from "@/lib/sudoku";

interface Props {
  size: GridSize;
  onNumber: (num: number) => void;
  onErase: () => void;
  /** Reactive accessor: count of non-conflicted placements per digit */
  placedCounts: () => Record<number, number>;
}

/** Shared transition string — fast press-in, slightly slower release */
const PRESS_TRANSITION =
  "border-color 0.15s ease-out, color 0.15s ease-out, background-color 0.15s ease-out, transform 0.1s ease-out";

export default function NumberPad(props: Props) {
  const numbers = () => Array.from({ length: props.size }, (_, i) => i + 1);

  // ── Press state ────────────────────────────────────────────────────────────
  // A single signal tracks which number button is currently pressed (if any).
  // The erase button has its own boolean signal.
  const [pressedNum, setPressedNum] = createSignal<number | null>(null);
  const [erasePressed, setErasePressed] = createSignal(false);

  // ── Layout helpers ─────────────────────────────────────────────────────────
  const buttonSize = () => {
    switch (props.size) {
      case 4:
        return "w-14 h-14 text-xl";
      case 6:
        return "w-12 h-12 text-lg";
      case 9:
        return "w-10 h-10 md:w-11 md:h-11 text-base";
    }
  };

  const cols = () => {
    switch (props.size) {
      case 4:
        return "grid-cols-4";
      case 6:
        return "grid-cols-6";
      case 9:
        return "grid-cols-9";
    }
  };

  const isDone = (num: number) => (props.placedCounts()[num] ?? 0) >= props.size;

  return (
    <div class="flex flex-col items-center gap-2">
      <div class={`grid ${cols()} gap-1.5`}>
        {numbers().map((num) => (
          <button
            onClick={() => props.onNumber(num)}
            disabled={isDone(num)}
            onPointerDown={() => !isDone(num) && setPressedNum(num)}
            onPointerUp={() => setPressedNum(null)}
            onPointerLeave={() => setPressedNum(null)}
            onPointerCancel={() => setPressedNum(null)}
            style={{
              transition: PRESS_TRANSITION,
              transform: pressedNum() === num ? "scale(0.93)" : "",
            }}
            class={[
              buttonSize(),
              "relative flex items-center justify-center rounded-lg bg-surface border border-border font-medium",
              isDone(num)
                ? "opacity-35 pointer-events-none text-fg-tertiary"
                : "text-fg hover:border-accent hover:text-accent hover:bg-accent-light",
            ].join(" ")}
          >
            {num}
          </button>
        ))}
      </div>

      <button
        onClick={() => props.onErase()}
        onPointerDown={() => setErasePressed(true)}
        onPointerUp={() => setErasePressed(false)}
        onPointerLeave={() => setErasePressed(false)}
        onPointerCancel={() => setErasePressed(false)}
        style={{
          transition: PRESS_TRANSITION,
          transform: erasePressed() ? "scale(0.93)" : "",
        }}
        class="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-fg-secondary hover:border-error hover:text-error hover:bg-accent-light"
      >
        Erase
      </button>
    </div>
  );
}
