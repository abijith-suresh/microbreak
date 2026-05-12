import { onMount } from "solid-js";
import Button from "./ui/button";

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
        star.classList.add(
          "animate-in",
          "fade-in",
          "zoom-in-90",
          "duration-500",
          "delay-200",
          "ease-[cubic-bezier(0.65,0,0.45,1)]",
          "fill-mode-both"
        );
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
      <div class="mb-6" class="animate-in fade-in zoom-in-90 duration-300 delay-100 fill-mode-both">
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
        class="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both"
      >
        2048!
      </h1>

      {/* Score */}
      <p
        class="mt-3 text-2xl md:text-3xl font-light text-accent tabular-nums"
        class="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500 fill-mode-both"
      >
        {props.score} points
      </p>

      {/* Actions */}
      <div
        class="flex flex-col sm:flex-row items-center gap-3 mt-10"
        class="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-700 fill-mode-both"
      >
        <Button onClick={() => props.onKeepPlaying()}>Keep Playing</Button>
        <Button variant="secondary" onClick={() => props.onNewGame()}>
          New Game
        </Button>
      </div>

      {/* Tagline */}
      <p
        class="mt-10 text-xs text-fg-tertiary tracking-widest uppercase"
        class="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-700 fill-mode-both"
      >
        Nice break · Now back to building
      </p>
    </div>
  );
}
