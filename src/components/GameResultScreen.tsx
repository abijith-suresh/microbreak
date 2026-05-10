import { onMount } from "solid-js";
import PressableButton from "./ui/PressableButton";

interface Props {
  result: "won" | "lost";
  solveTime: number;
  difficulty: string;
  onBackToGames: () => void;
  onPlayAgain: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function difficultyLabel(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export default function GameResultScreen(props: Props) {
  let svgRef: SVGSVGElement | undefined;

  const isWon = () => props.result === "won";

  onMount(() => {
    if (svgRef && isWon()) {
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
      aria-labelledby="game-result-title"
    >
      <div class="sr-only" aria-live="assertive">
        {isWon()
          ? `Puzzle cleared in ${formatTime(props.solveTime)} on ${difficultyLabel(props.difficulty)}`
          : `Game over after ${formatTime(props.solveTime)} on ${difficultyLabel(props.difficulty)}`}
      </div>
      {/* Icon */}
      <div class="mb-6" style={{ animation: "scaleIn 0.4s ease-out 0.1s both" }}>
        {isWon() ? (
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
        ) : (
          <svg width="80" height="80" viewBox="0 0 96 96" fill="none">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="var(--color-error)"
              stroke-width="2.5"
              fill="none"
              style={{ animation: "scaleIn 0.4s ease-out 0.1s both" }}
            />
            <path
              d="M36 36 L60 60 M60 36 L36 60"
              stroke="var(--color-error)"
              stroke-width="3"
              stroke-linecap="round"
              style={{ animation: "fadeIn 0.3s ease-out 0.4s both" }}
            />
          </svg>
        )}
      </div>

      {/* Heading */}
      <h1
        id="game-result-title"
        class="font-display text-5xl md:text-6xl text-fg italic tracking-tight"
        style={{ animation: "fadeIn 0.5s ease-out 0.3s both" }}
      >
        {isWon() ? "Cleared" : "Game Over"}
      </h1>

      {/* Time */}
      <p
        class="mt-3 text-2xl md:text-3xl font-light tabular-nums"
        style={{
          animation: "fadeIn 0.5s ease-out 0.4s both",
          color: isWon() ? "var(--color-accent)" : "var(--color-fg-secondary)",
        }}
      >
        {formatTime(props.solveTime)}
      </p>

      {/* Info */}
      <p
        class="mt-1 text-xs text-fg-tertiary tracking-wide"
        style={{ animation: "fadeIn 0.5s ease-out 0.5s both" }}
      >
        {difficultyLabel(props.difficulty)}
      </p>

      {/* Actions */}
      <div
        class="flex flex-col sm:flex-row items-center gap-3 mt-10"
        style={{ animation: "fadeIn 0.5s ease-out 0.6s both" }}
      >
        <PressableButton onClick={() => props.onPlayAgain()}>Play Again</PressableButton>
        <PressableButton variant="secondary" onClick={() => props.onBackToGames()}>
          Back to Games
        </PressableButton>
      </div>

      {/* Tagline */}
      <p
        class="mt-10 text-[11px] text-fg-tertiary tracking-widest uppercase"
        style={{ animation: "fadeIn 0.5s ease-out 0.8s both" }}
      >
        {isWon() ? "Nice break · Now back to building" : "Shake it off · Try again"}
      </p>
    </div>
  );
}
