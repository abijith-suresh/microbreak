import type { GridSize } from "@/lib/sudoku";

interface Props {
  size: GridSize;
  onNumber: (num: number) => void;
  onErase: () => void;
  /** Reactive accessor: count of non-conflicted placements per digit */
  placedCounts: () => Record<number, number>;
}

export default function NumberPad(props: Props) {
  const numbers = () => Array.from({ length: props.size }, (_, i) => i + 1);

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
            class={[
              buttonSize(),
              "relative flex items-center justify-center rounded-lg bg-surface border border-border font-medium transition-all",
              isDone(num)
                ? "opacity-35 pointer-events-none text-fg-tertiary"
                : "text-fg hover:border-accent hover:text-accent hover:bg-accent-light active:scale-95",
            ].join(" ")}
          >
            {num}
          </button>
        ))}
      </div>
      <button
        onClick={() => props.onErase()}
        class="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-fg-secondary transition-all hover:border-error hover:text-error hover:bg-accent-light active:scale-95"
      >
        Erase
      </button>
    </div>
  );
}
