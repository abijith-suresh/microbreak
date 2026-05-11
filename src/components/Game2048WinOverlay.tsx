import { onMount } from "solid-js";
import PressableButton from "./ui/PressableButton";

interface Props {
  score: number;
  onKeepPlaying: () => void;
  onNewGame: () => void;
}

export default function Game2048WinOverlay(props: Props) {
  let svgRef: SVGSVGElement | undefined;

  onMount(() => {
    if (svgRef) {
      const star = svgRef.querySelector(".win-star") as SVGElement;
      if (star) {
        star.style.animation = "scaleIn 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.2s both";
      }
    }
  });

  return (
    <div
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-2048-win-title"
    >
      <div class="sr-only" aria-live="assertive">
        {`2048 reached with ${props.score} points`}
      </div>
      {/* Star icon */}
      <div class="mb-6" style={{ animation: "scaleIn 0.4s ease-out 0.1s both" }}>
        <svg ref={(el) => (svgRef = el)} width="80" height="80" viewBox="0 0 96 96" fill="none">
          <path
            class="win-star"
            d="M48 8L56.9 35.6L86 36.2L62.7 53.8L71.2 81.6L48 64.8L24.8 81.6L33.3 53.8L10 36.2L39.1 35.6L48 8Z"
            stroke="var(--color-accent)"
            stroke-width="2.5"
            fill="var(--color-accent-light)"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1
        id="game-2048-win-title"
        class="font-display text-5xl md:text-6xl text-fg italic tracking-tight"
        style={{ animation: "fadeIn 0.5s ease-out 0.3s both" }}
      >
        2048!
      </h1>

      {/* Score */}
      <p
        class="mt-3 text-2xl md:text-3xl font-light text-accent tabular-nums"
        style={{ animation: "fadeIn 0.5s ease-out 0.4s both" }}
      >
        {props.score} points
      </p>

      {/* Actions */}
      <div
        class="flex flex-col sm:flex-row items-center gap-3 mt-10"
        style={{ animation: "fadeIn 0.5s ease-out 0.6s both" }}
      >
        <PressableButton onClick={() => props.onKeepPlaying()}>Keep Playing</PressableButton>
        <PressableButton variant="secondary" onClick={() => props.onNewGame()}>
          New Game
        </PressableButton>
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
