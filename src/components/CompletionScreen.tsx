import type { Difficulty, GridSize } from "@/lib/sudoku";
import { onMount } from "solid-js";

interface Props {
  solveTime: number; // in seconds
  gridSize: GridSize;
  difficulty: Difficulty;
  onBackToGames: () => void;
  onPlayAgain: () => void;
  themeToggle: Element;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function sizeLabel(size: GridSize): string {
  switch (size) {
    case 4:
      return "4×4";
    case 6:
      return "6×6";
    case 9:
      return "9×9";
  }
}

export default function CompletionScreen(props: Props) {
  let svgRef: SVGSVGElement | undefined;

  onMount(() => {
    if (svgRef) {
      const circle = svgRef.querySelector(".checkmark-circle") as SVGElement;
      const check = svgRef.querySelector(".checkmark-check") as SVGElement;
      if (circle) {
        circle.style.strokeDasharray = "166";
        circle.style.strokeDashoffset = "166";
        circle.style.animation = "checkmark 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards";
      }
      if (check) {
        check.style.strokeDasharray = "48";
        check.style.strokeDashoffset = "48";
        check.style.animation = "checkmark 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards";
      }
    }
  });

  return (
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-completion-bg)] animate-fade-in">
      {/* Theme toggle */}
      <div class="absolute top-4 right-4" ref={(el) => el.replaceChildren(props.themeToggle)} />

      {/* Success animation */}
      <div class="mb-8 animate-scale-in" style={{ "animation-delay": "0.1s" }}>
        <svg ref={svgRef} width="96" height="96" viewBox="0 0 96 96" fill="none">
          <circle
            class="checkmark-circle"
            cx="48"
            cy="48"
            r="40"
            stroke="var(--color-accent)"
            stroke-width="3"
            fill="none"
          />
          <path
            class="checkmark-check"
            d="M30 50 L42 62 L66 36"
            stroke="var(--color-accent)"
            stroke-width="3.5"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      {/* Solved heading */}
      <h1 class="font-display text-5xl md:text-7xl text-[var(--color-text-primary)] mb-4 animate-fade-in" style={{ "animation-delay": "0.3s" }}>
        Solved
      </h1>

      {/* Solve time */}
      <p class="text-2xl md:text-3xl font-light text-[var(--color-accent)] mb-2 animate-fade-in" style={{ "animation-delay": "0.4s" }}>
        {formatTime(props.solveTime)}
      </p>

      {/* Grid info */}
      <p class="text-sm text-[var(--color-text-tertiary)] mb-10 animate-fade-in" style={{ "animation-delay": "0.5s" }}>
        {sizeLabel(props.gridSize)} · {props.difficulty.charAt(0).toUpperCase() + props.difficulty.slice(1)}
      </p>

      {/* Actions */}
      <div class="flex flex-col sm:flex-row items-center gap-3 animate-fade-in" style={{ "animation-delay": "0.6s" }}>
        <button
          onClick={() => props.onBackToGames()}
          class="px-8 py-3 rounded-xl bg-[var(--color-accent)] text-white font-medium text-base transition-all hover:bg-[var(--color-accent-hover)] active:scale-[0.97]"
        >
          Back to Games
        </button>
        <button
          onClick={() => props.onPlayAgain()}
          class="px-8 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium text-base transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-[0.97]"
        >
          One more?
        </button>
      </div>

      {/* Subtle nudge */}
      <p class="mt-8 text-xs text-[var(--color-text-tertiary)] animate-fade-in" style={{ "animation-delay": "0.8s" }}>
        Nice break. Now back to building.
      </p>
    </div>
  );
}
