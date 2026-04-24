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
      <div class="flex items-center justify-between px-5 py-4">
        <a
          href="/"
          class="flex items-center gap-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" class="shrink-0">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-sm font-medium hidden sm:inline">Games</span>
        </a>
        <ThemeToggle />
      </div>

      {/* Setup area */}
      <div class="flex-1 flex flex-col items-center justify-center px-6 pb-16 gap-12">
        {/* Header */}
        <div class="text-center space-y-2" style={{ animation: "fadeIn 0.5s ease-out both" }}>
          <h1 class="font-display text-5xl md:text-6xl text-[var(--color-text-primary)] italic tracking-tight">
            Sudoku
          </h1>
          <p class="text-sm text-[var(--color-text-tertiary)] tracking-wide">
            Choose your challenge
          </p>
          <div class="mx-auto mt-3 h-px w-12 bg-[var(--color-accent)] opacity-40" />
        </div>

        {/* Options card */}
        <div
          class="w-full max-w-md space-y-8"
          style={{ animation: "fadeIn 0.5s ease-out 0.1s both" }}
        >
          {/* Size selection */}
          <div class="space-y-3">
            <label class="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[0.15em]">
              Grid size
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              {sizes.map((s) => (
                <button
                  onClick={() => setSelectedSize(s.value)}
                  class={`group flex flex-col items-center gap-1 py-4 px-3 rounded-xl border transition-all duration-200 ${
                    selectedSize() === s.value
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
                  } active:scale-[0.97]`}
                >
                  <span
                    class={`text-lg font-bold leading-none transition-colors duration-200 ${
                      selectedSize() === s.value
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedSize() === s.value
                        ? "text-[var(--color-accent)] opacity-80"
                        : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {s.description}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedSize() === s.value
                        ? "text-[var(--color-accent)] opacity-50"
                        : "text-[var(--color-text-tertiary)] opacity-60"
                    }`}
                  >
                    {s.time}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty selection */}
          <div class="space-y-3">
            <label class="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-[0.15em]">
              Difficulty
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              {difficulties.map((d) => (
                <button
                  onClick={() => setSelectedDifficulty(d.value)}
                  class={`group flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border transition-all duration-200 ${
                    selectedDifficulty() === d.value
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
                  } active:scale-[0.97]`}
                >
                  <span
                    class={`text-sm font-bold leading-none transition-colors duration-200 ${
                      selectedDifficulty() === d.value
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {d.label}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedDifficulty() === d.value
                        ? "text-[var(--color-accent)] opacity-70"
                        : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {d.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <div style={{ animation: "fadeIn 0.4s ease-out 0.2s both" }}>
          <button
            onClick={() => props.onStart(selectedSize(), selectedDifficulty())}
            class="px-12 py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-base transition-all duration-200 hover:bg-[var(--color-accent-hover)] active:scale-[0.97] shadow-lg shadow-[var(--color-shadow)]"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
