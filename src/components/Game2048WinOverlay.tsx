import { createSignal, onMount } from "solid-js";

interface Props {
  score: number;
  onKeepPlaying: () => void;
  onNewGame: () => void;
}

export default function Game2048WinOverlay(props: Props) {
  let svgRef: SVGSVGElement | undefined;

  const [keepPlayingPressed, setKeepPlayingPressed] = createSignal(false);
  const [newGamePressed, setNewGamePressed] = createSignal(false);

  const BTN_TRANSITION =
    "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.1s ease-out";

  onMount(() => {
    if (svgRef) {
      const star = svgRef.querySelector(".win-star") as SVGElement;
      if (star) {
        star.style.animation = "scaleIn 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.2s both";
      }
    }
  });

  return (
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/90 backdrop-blur-sm">
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
        <button
          onClick={() => props.onKeepPlaying()}
          onPointerDown={() => setKeepPlayingPressed(true)}
          onPointerUp={() => setKeepPlayingPressed(false)}
          onPointerLeave={() => setKeepPlayingPressed(false)}
          onPointerCancel={() => setKeepPlayingPressed(false)}
          style={{
            transition: BTN_TRANSITION,
            transform: keepPlayingPressed() ? "scale(0.93)" : "",
          }}
          class="px-8 py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover"
        >
          Keep Playing
        </button>
        <button
          onClick={() => props.onNewGame()}
          onPointerDown={() => setNewGamePressed(true)}
          onPointerUp={() => setNewGamePressed(false)}
          onPointerLeave={() => setNewGamePressed(false)}
          onPointerCancel={() => setNewGamePressed(false)}
          style={{
            transition: BTN_TRANSITION,
            transform: newGamePressed() ? "scale(0.93)" : "",
          }}
          class="px-8 py-3 rounded-xl bg-surface border border-border text-fg-secondary font-medium text-sm hover:border-accent hover:text-accent"
        >
          New Game
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
