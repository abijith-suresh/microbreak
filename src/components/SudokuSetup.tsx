import { createSignal, onCleanup } from "solid-js";
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

/**
 * Explicit transition string for selection cards.
 * Keeps border/bg/color at 200 ms while transform snaps faster (100 ms),
 * giving a crisp press feel without disturbing the selection colour change.
 */
const CARD_TRANSITION =
  "border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, transform 0.1s ease-out";

export default function SudokuSetup(props: Props) {
  const [selectedSize, setSelectedSize] = createSignal<GridSize>(9);
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<Difficulty>("medium");

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
    setIsExiting(true);
    exitTimer = setTimeout(() => {
      exitTimer = null;
      props.onStart(selectedSize(), selectedDifficulty());
    }, 280);
  }

  // ── Press feedback signals ─────────────────────────────────────────────────
  const [pressedSize, setPressedSize] = createSignal<GridSize | null>(null);
  const [pressedDiff, setPressedDiff] = createSignal<Difficulty | null>(null);
  const [startPressed, setStartPressed] = createSignal(false);

  return (
    <div
      class="flex flex-col min-h-screen"
      style={isExiting() ? { animation: "setupExit 0.28s ease-in forwards" } : undefined}
    >
      {/* Top bar */}
      <div class="flex items-center justify-between px-5 py-4">
        <a
          href="/"
          class="flex items-center gap-2 text-fg-tertiary hover:text-fg transition-colors duration-200"
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
          <h1 class="font-display text-5xl md:text-6xl text-fg italic tracking-tight">Sudoku</h1>
          <p class="text-sm text-fg-tertiary tracking-wide">Choose your challenge</p>
          <div class="mx-auto mt-3 h-px w-12 bg-accent opacity-40" />
        </div>

        {/* Options card */}
        <div
          class="w-full max-w-md space-y-8"
          style={{ animation: "fadeIn 0.5s ease-out 0.1s both" }}
        >
          {/* Size selection */}
          <div class="space-y-3">
            <label class="text-[11px] font-medium text-fg-tertiary uppercase tracking-[0.15em]">
              Grid size
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              {sizes.map((s) => (
                <button
                  onClick={() => setSelectedSize(s.value)}
                  onPointerDown={() => setPressedSize(s.value)}
                  onPointerUp={() => setPressedSize(null)}
                  onPointerLeave={() => setPressedSize(null)}
                  onPointerCancel={() => setPressedSize(null)}
                  style={{
                    transition: CARD_TRANSITION,
                    transform: pressedSize() === s.value ? "scale(0.93)" : "",
                  }}
                  class={`group flex flex-col items-center gap-1 py-4 px-3 rounded-xl border ${
                    selectedSize() === s.value
                      ? "border-accent bg-accent-light"
                      : "border-border bg-surface hover:border-border-strong"
                  }`}
                >
                  <span
                    class={`text-lg font-bold leading-none transition-colors duration-200 ${
                      selectedSize() === s.value ? "text-accent" : "text-fg"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedSize() === s.value
                        ? "text-accent opacity-80"
                        : "text-fg-tertiary group-hover:text-fg-secondary"
                    }`}
                  >
                    {s.description}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedSize() === s.value
                        ? "text-accent opacity-50"
                        : "text-fg-tertiary opacity-60"
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
            <label class="text-[11px] font-medium text-fg-tertiary uppercase tracking-[0.15em]">
              Difficulty
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              {difficulties.map((d) => (
                <button
                  onClick={() => setSelectedDifficulty(d.value)}
                  onPointerDown={() => setPressedDiff(d.value)}
                  onPointerUp={() => setPressedDiff(null)}
                  onPointerLeave={() => setPressedDiff(null)}
                  onPointerCancel={() => setPressedDiff(null)}
                  style={{
                    transition: CARD_TRANSITION,
                    transform: pressedDiff() === d.value ? "scale(0.93)" : "",
                  }}
                  class={`group flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border ${
                    selectedDifficulty() === d.value
                      ? "border-accent bg-accent-light"
                      : "border-border bg-surface hover:border-border-strong"
                  }`}
                >
                  <span
                    class={`text-sm font-bold leading-none transition-colors duration-200 ${
                      selectedDifficulty() === d.value ? "text-accent" : "text-fg"
                    }`}
                  >
                    {d.label}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedDifficulty() === d.value
                        ? "text-accent opacity-70"
                        : "text-fg-tertiary group-hover:text-fg-secondary"
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
            onClick={handleStart}
            onPointerDown={() => setStartPressed(true)}
            onPointerUp={() => setStartPressed(false)}
            onPointerLeave={() => setStartPressed(false)}
            onPointerCancel={() => setStartPressed(false)}
            style={{
              transition: "background-color 0.2s ease, transform 0.1s ease-out",
              transform: startPressed() ? "scale(0.93)" : "",
            }}
            class="px-12 py-3.5 rounded-xl bg-accent text-white font-semibold text-base hover:bg-accent-hover shadow-lg shadow-shadow"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
