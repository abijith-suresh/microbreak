import { createSignal, onMount } from "solid-js";

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

  const [playAgainPressed, setPlayAgainPressed] = createSignal(false);
  const [backPressed, setBackPressed] = createSignal(false);

  const BTN_TRANSITION =
    "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.1s ease-out";

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
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg">
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
        {isWon() ? "Nice break · Now back to building" : "Shake it off · Try again"}
      </p>
    </div>
  );
}
