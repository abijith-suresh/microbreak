import type { Difficulty, GridSize } from "@/lib/sudoku";

interface Props {
  currentSize: GridSize;
  currentDifficulty: Difficulty;
  onSizeChange: (size: GridSize) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onNewPuzzle: () => void;
}

const sizes: { value: GridSize; label: string; hint: string }[] = [
  { value: 4, label: "4×4", hint: "~2 min" },
  { value: 6, label: "6×6", hint: "~4 min" },
  { value: 9, label: "9×9", hint: "~7 min" },
];

const difficulties: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function SudokuControls(props: Props) {
  return (
    <div class="flex flex-wrap items-center justify-center gap-3">
      {/* Size selector */}
      <div class="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden">
        {sizes.map((s) => (
          <button
            onClick={() => props.onSizeChange(s.value)}
            class={`px-3 py-2 text-sm font-medium transition-colors ${
              props.currentSize === s.value
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
            }`}
            title={s.hint}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Difficulty selector */}
      <div class="flex items-center rounded-lg border border-[var(--color-border)] overflow-hidden">
        {difficulties.map((d) => (
          <button
            onClick={() => props.onDifficultyChange(d.value)}
            class={`px-3 py-2 text-sm font-medium transition-colors ${
              props.currentDifficulty === d.value
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* New Puzzle */}
      <button
        onClick={() => props.onNewPuzzle()}
        class="px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-95"
      >
        New Puzzle
      </button>
    </div>
  );
}
