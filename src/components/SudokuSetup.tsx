import { createSignal } from "solid-js";
import type { Difficulty, GridSize } from "@/lib/sudoku";
import ThemeToggle from "./ThemeToggle";

interface Props {
  onStart: (size: GridSize, difficulty: Difficulty) => void;
}

const sizes: { value: GridSize; label: string; description: string; time: string }[] = [
  { value: 4, label: "4×4", description: "Quick warmup", time: "~1 min" },
  { value: 6, label: "6×6", description: "A bit more", time: "~3 min" },
  { value: 9, label: "9×9", description: "The classic", time: "~7 min" },
];

const difficulties: { value: Difficulty; label: string; description: string }[] = [
  { value: "easy", description: "Relaxed", label: "Easy" },
  { value: "medium", description: "Focused", label: "Medium" },
  { value: "hard", description: "Deep think", label: "Hard" },
];

export default function SudokuSetup(props: Props) {
  const [selectedSize, setSelectedSize] = createSignal<GridSize>(9);
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<Difficulty>("medium");

  return (
    <div class="flex flex-col min-h-screen">
      {/* Top bar */}
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <a
          href="/"
          class="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="shrink-0">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-sm font-medium hidden sm:inline">Back</span>
        </a>
        <h2 class="font-display text-xl text-[var(--color-text-primary)] italic">Sudoku</h2>
        <ThemeToggle />
      </div>

      {/* Setup area */}
      <div class="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-10">
        {/* Decorative mini grid */}
        <div class="grid grid-cols-3 gap-[3px] p-3 rounded-xl bg-[var(--color-border)] opacity-30">
          {Array.from({ length: 9 }, (_, i) => (
            <div class="w-6 h-6 rounded-sm bg-[var(--color-surface)]" />
          ))}
        </div>

        {/* Size selection */}
        <div class="w-full max-w-sm space-y-3">
          <label class="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-widest">
            Grid Size
          </label>
          <div class="grid grid-cols-3 gap-3">
            {sizes.map((s) => (
              <button
                onClick={() => setSelectedSize(s.value)}
                class={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedSize() === s.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span class="text-lg font-bold leading-none">{s.label}</span>
                <span class="text-[10px] opacity-70">{s.description}</span>
                <span class="text-[10px] opacity-50">{s.time}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty selection */}
        <div class="w-full max-w-sm space-y-3">
          <label class="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-widest">
            Difficulty
          </label>
          <div class="grid grid-cols-3 gap-3">
            {difficulties.map((d) => (
              <button
                onClick={() => setSelectedDifficulty(d.value)}
                class={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedDifficulty() === d.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span class="text-sm font-bold leading-none">{d.label}</span>
                <span class="text-[10px] opacity-70">{d.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => props.onStart(selectedSize(), selectedDifficulty())}
          class="px-10 py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-base transition-all hover:bg-[var(--color-accent-hover)] active:scale-[0.97] shadow-md shadow-[var(--color-shadow)] hover:shadow-lg hover:shadow-[var(--color-shadow-strong)]"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
