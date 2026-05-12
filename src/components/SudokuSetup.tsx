import { createSignal, onCleanup, onMount } from "solid-js";
import type { Difficulty, GridSize } from "@/lib/sudoku";
import { loadStoredJSON, saveStoredJSON } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import ThemeToggle from "./ThemeToggle";
import BackLink from "./ui/BackLink";
import Button from "./ui/Button";

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

  onMount(() => {
    const stored = loadStoredJSON(
      STORAGE_KEYS.sudokuPreferences,
      (value): value is { size: GridSize; difficulty: Difficulty } => {
        return (
          typeof value === "object" &&
          value !== null &&
          "size" in value &&
          "difficulty" in value &&
          (value.size === 4 || value.size === 6 || value.size === 9) &&
          (value.difficulty === "easy" ||
            value.difficulty === "medium" ||
            value.difficulty === "hard")
        );
      }
    );

    if (stored) {
      setSelectedSize(stored.size);
      setSelectedDifficulty(stored.difficulty);
    }
  });

  // ── Exit animation ─────────────────────────────────────────────────────────
  // When the user taps "Start Game", play the exit animation for 280 ms first,
  // then hand off to the parent. This creates a smooth crossfade-like feel:
  // the setup screen is already nearly gone when the board fades in.
  const [isExiting, setIsExiting] = createSignal(false);
  let exitTimer: ReturnType<typeof setTimeout> | null = null;

  onCleanup(() => {
    if (exitTimer !== null) clearTimeout(exitTimer);
  });

  function handleStart() {
    if (isExiting()) return; // guard against rapid double-tap

    saveStoredJSON(STORAGE_KEYS.sudokuPreferences, {
      size: selectedSize(),
      difficulty: selectedDifficulty(),
    });

    setIsExiting(true);
    exitTimer = setTimeout(() => {
      exitTimer = null;
      props.onStart(selectedSize(), selectedDifficulty());
    }, 280);
  }

  return (
    <div
      class={
        "flex flex-col min-h-screen" +
        (isExiting()
          ? " animate-out fade-out slide-out-to-top-3.5 duration-300 ease-in fill-mode-forwards"
          : "")
      }
    >
      {/* Top bar */}
      <div class="flex items-center justify-between px-5 py-4">
        <BackLink label="Games" href="/" />
        <ThemeToggle />
      </div>

      {/* Setup area */}
      <div class="flex-1 flex flex-col items-center justify-center px-6 pb-16 gap-12">
        {/* Header */}
        <div
          class="text-center space-y-2"
          class="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
        >
          <h1 class="font-display text-5xl md:text-6xl text-fg italic tracking-tight">Sudoku</h1>
          <p class="text-sm text-fg-tertiary tracking-wide">Choose your challenge</p>
          <div class="mx-auto mt-3 h-px w-12 bg-accent opacity-40" />
        </div>

        {/* Options card */}
        <div
          class="w-full max-w-md space-y-8"
          class="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both"
        >
          {/* Size selection */}
          <div class="space-y-3">
            <label class="text-xs font-medium text-fg-tertiary uppercase tracking-widest">
              Grid size
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              {sizes.map((s) => (
                <Button
                  variant="ghost"
                  class={`group flex flex-col items-center gap-1 py-4 px-3 rounded-xl border ${
                    selectedSize() === s.value
                      ? "border-accent bg-accent-light"
                      : "border-border bg-surface hover:border-border-strong"
                  }`}
                  onClick={() => setSelectedSize(s.value)}
                >
                  <span
                    class={`text-lg font-bold leading-none transition-colors duration-200 ${
                      selectedSize() === s.value ? "text-accent" : "text-fg"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span
                    class={`text-xs leading-tight transition-colors duration-200 ${
                      selectedSize() === s.value
                        ? "text-accent opacity-80"
                        : "text-fg-tertiary group-hover:text-fg-secondary"
                    }`}
                  >
                    {s.description}
                  </span>
                  <span
                    class={`text-xs leading-tight transition-colors duration-200 ${
                      selectedSize() === s.value
                        ? "text-accent opacity-50"
                        : "text-fg-tertiary opacity-60"
                    }`}
                  >
                    {s.time}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Difficulty selection */}
          <div class="space-y-3">
            <label class="text-xs font-medium text-fg-tertiary uppercase tracking-widest">
              Difficulty
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              {difficulties.map((d) => (
                <Button
                  variant="ghost"
                  class={`group flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border ${
                    selectedDifficulty() === d.value
                      ? "border-accent bg-accent-light"
                      : "border-border bg-surface hover:border-border-strong"
                  }`}
                  onClick={() => setSelectedDifficulty(d.value)}
                >
                  <span
                    class={`text-sm font-bold leading-none transition-colors duration-200 ${
                      selectedDifficulty() === d.value ? "text-accent" : "text-fg"
                    }`}
                  >
                    {d.label}
                  </span>
                  <span
                    class={`text-xs leading-tight transition-colors duration-200 ${
                      selectedDifficulty() === d.value
                        ? "text-accent opacity-70"
                        : "text-fg-tertiary group-hover:text-fg-secondary"
                    }`}
                  >
                    {d.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <div class="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
          <Button
            class="px-12 py-3.5 font-semibold text-base shadow-lg shadow-shadow"
            onClick={handleStart}
          >
            Start Game
          </Button>
        </div>
      </div>
    </div>
  );
}
