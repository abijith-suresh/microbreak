import { type JSX, onMount } from "solid-js";
import Button from "./Button";

interface Props {
  type: "won" | "lost";
  solveTime: number;
  difficulty: string;
  /** Optional override for the heading (defaults to "Solved" / "Game over") */
  heading?: string;
  onBackToGames: () => void;
  onPlayAgain: () => void;
  /** Optional game-specific content rendered above the time (e.g. Wordle answer reveal) */
  children?: JSX.Element;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function headingText(type: "won" | "lost", override?: string): string {
  if (override) return override;
  return type === "won" ? "Solved" : "Game over";
}

function taglineText(type: "won" | "lost"): string {
  return type === "won"
    ? "Nice break · Now back to building"
    : "Shake it off · Now back to building";
}

export default function ResultScreen(props: Props) {
  let svgRef: SVGSVGElement | undefined;
  let dialogRef!: HTMLDivElement;
  const isWon = () => props.type === "won";

  onMount(() => {
    dialogRef.querySelector("button")?.focus();
    if (svgRef && isWon()) {
      const circle = svgRef.querySelector(".result-checkmark-circle") as SVGElement;
      const check = svgRef.querySelector(".result-checkmark-check") as SVGElement;
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

  const labelId = "result-screen-title";

  return (
    <div
      ref={dialogRef}
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
    >
      <div class="sr-only" aria-live="assertive">
        {isWon()
          ? `Solved in ${formatTime(props.solveTime)}, ${props.difficulty}`
          : `Game over after ${formatTime(props.solveTime)}, ${props.difficulty}`}
      </div>

      {/* Icon */}
      <div class="mb-6 animate-in fade-in zoom-in-90 duration-300 delay-100 fill-mode-both">
        {isWon() ? (
          <svg
            aria-hidden="true"
            ref={(el) => (svgRef = el)}
            width="80"
            height="80"
            viewBox="0 0 96 96"
            fill="none"
          >
            <circle
              class="result-checkmark-circle"
              cx="48"
              cy="48"
              r="40"
              stroke="var(--color-accent)"
              stroke-width="2.5"
              fill="none"
            />
            <path
              class="result-checkmark-check"
              d="M30 50 L42 62 L66 36"
              stroke="var(--color-accent)"
              stroke-width="3"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        ) : (
          <svg aria-hidden="true" width="80" height="80" viewBox="0 0 96 96" fill="none">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="var(--color-error)"
              stroke-width="2.5"
              fill="none"
              class="animate-in fade-in zoom-in-90 duration-300 delay-100 fill-mode-both"
            />
            <path
              d="M36 36 L60 60 M60 36 L36 60"
              stroke="var(--color-error)"
              stroke-width="3"
              stroke-linecap="round"
              class="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-500 fill-mode-both"
            />
          </svg>
        )}
      </div>

      {/* Heading */}
      <h1
        id={labelId}
        class="font-display text-5xl md:text-6xl text-fg italic tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both"
      >
        {headingText(props.type, props.heading)}
      </h1>

      {/* Game-specific content (e.g. Wordle answer reveal) */}
      {props.children && (
        <div class="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300 fill-mode-both">
          {props.children}
        </div>
      )}

      {/* Time */}
      <p
        class="mt-3 text-2xl md:text-3xl font-light tabular-nums animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500"
        style={{
          color: isWon() ? "var(--color-accent)" : "var(--color-fg-secondary)",
        }}
      >
        {formatTime(props.solveTime)}
      </p>

      {/* Difficulty / variant info */}
      <p class="mt-1 text-xs text-fg-tertiary tracking-wide animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500 fill-mode-both">
        {props.difficulty}
      </p>

      {/* Actions */}
      <div class="flex flex-col sm:flex-row items-center gap-3 mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-700 fill-mode-both">
        <Button size="lg" onClick={() => props.onPlayAgain()}>
          Play again
        </Button>
        <Button size="lg" variant="secondary" onClick={() => props.onBackToGames()}>
          Back to games
        </Button>
      </div>

      {/* Tagline */}
      <p class="mt-10 text-xs text-fg-tertiary tracking-widest uppercase animate-in fade-in slide-in-from-bottom-2 duration-500 delay-700 fill-mode-both">
        {taglineText(props.type)}
      </p>
    </div>
  );
}
