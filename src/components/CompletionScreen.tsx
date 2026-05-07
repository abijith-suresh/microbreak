import type { Difficulty, GridSize } from "@/lib/sudoku";
import { createSignal, onMount } from "solid-js";

interface Props {
  solveTime: number;
  gridSize: GridSize;
  difficulty: Difficulty;
  onBackToGames: () => void;
  onPlayAgain: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function sizeLabel(size: GridSize): string {
  if (size === 4) return "4×4";
  if (size === 6) return "6×6";
  return "9×9";
}

export default function CompletionScreen(props: Props) {
  let svgRef: SVGSVGElement | undefined;

  // Press feedback — same JS-pointer approach used throughout the game
  // so it works correctly on iOS Safari.
  const [playAgainPressed, setPlayAgainPressed] = createSignal(false);
  const [backPressed, setBackPressed] = createSignal(false);

  const BTN_TRANSITION =
    "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.1s ease-out";

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
    <div
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-screen-title"
    >
      <div class="sr-only" aria-live="assertive">
        {`Sudoku solved in ${formatTime(props.solveTime)} on ${sizeLabel(props.gridSize)} ${props.difficulty}`}
      </div>
      {/* Checkmark */}
      <div class="mb-6" style={{ animation: "scaleIn 0.4s ease-out 0.1s both" }}>
        <svg ref={(el) => (svgRef = el)} width="80" height="80" viewBox="0 0 96 96" fill="none">
          <circle
            class="checkmark-circle"
            cx="48"
            cy="48"
            r="40"
            stroke="var(--color-accent)"
            stroke-width="2.5"
            fill="none"
          />
          <path
            class="checkmark-check"
            d="M30 50 L42 62 L66 36"
            stroke="var(--color-accent)"
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1
        id="completion-screen-title"
        class="font-display text-5xl md:text-6xl text-fg italic tracking-tight"
        style={{ animation: "fadeIn 0.5s ease-out 0.3s both" }}
      >
        Solved
      </h1>

      {/* Time */}
      <p
        class="mt-3 text-2xl md:text-3xl font-light text-accent tabular-nums"
        style={{ animation: "fadeIn 0.5s ease-out 0.4s both" }}
      >
        {formatTime(props.solveTime)}
      </p>

      {/* Info */}
      <p
        class="mt-1 text-xs text-fg-tertiary tracking-wide"
        style={{ animation: "fadeIn 0.5s ease-out 0.5s both" }}
      >
        {sizeLabel(props.gridSize)} ·{" "}
        {props.difficulty.charAt(0).toUpperCase() + props.difficulty.slice(1)}
      </p>

      {/* Actions */}
      <div
        class="flex flex-col sm:flex-row items-center gap-3 mt-10"
        style={{ animation: "fadeIn 0.5s ease-out 0.6s both" }}
      >
        <button
          onClick={() => props.onPlayAgain()}
          onPointerDown={() => setPlayAgainPressed(true)}
          onPointerUp={() => setPlayAgainPressed(false)}
          onPointerLeave={() => setPlayAgainPressed(false)}
          onPointerCancel={() => setPlayAgainPressed(false)}
          style={{
            transition: BTN_TRANSITION,
            transform: playAgainPressed() ? "scale(0.93)" : "",
          }}
          class="px-8 py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover"
        >
          Play Again
        </button>
        <button
          onClick={() => props.onBackToGames()}
          onPointerDown={() => setBackPressed(true)}
          onPointerUp={() => setBackPressed(false)}
          onPointerLeave={() => setBackPressed(false)}
          onPointerCancel={() => setBackPressed(false)}
          style={{
            transition: BTN_TRANSITION,
            transform: backPressed() ? "scale(0.93)" : "",
          }}
          class="px-8 py-3 rounded-xl bg-surface border border-border text-fg-secondary font-medium text-sm hover:border-accent hover:text-accent"
        >
          Back to Games
        </button>
      </div>

      {/* Tagline */}
      <p
        class="mt-10 text-[11px] text-fg-tertiary tracking-widest uppercase"
        style={{ animation: "fadeIn 0.5s ease-out 0.8s both" }}
      >
        Nice break · Now back to building
      </p>
    </div>
  );
}
