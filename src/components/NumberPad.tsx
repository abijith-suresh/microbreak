import type { GridSize } from "@/lib/sudoku";

interface Props {
  size: GridSize;
  onNumber: (num: number) => void;
  onErase: () => void;
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

  return (
    <div class="flex flex-col items-center gap-2">
      <div class={`grid ${cols()} gap-1.5`}>
        {numbers().map((num) => (
          <button
            onClick={() => props.onNumber(num)}
            class={`${buttonSize()} flex items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] font-medium text-[var(--color-text-primary)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] active:scale-95`}
          >
            {num}
          </button>
        ))}
      </div>
      <button
        onClick={() => props.onErase()}
        class="px-5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-accent-light)] active:scale-95"
      >
        Erase
      </button>
    </div>
  );
}
