import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import type { LetterState } from "@/lib/wordle";

interface Props {
  letter: string;
  state?: LetterState;
  isRevealing?: boolean;
  revealDelay?: number;
  isPopping?: boolean;
  isBouncing?: boolean;
  bounceDelay?: number;
}

const stateStyles: Record<string, { bg: string; text: string }> = {
  correct: { bg: "var(--color-wl-correct)", text: "var(--color-wl-correct-text)" },
  present: { bg: "var(--color-wl-present)", text: "var(--color-wl-present-text)" },
  absent: { bg: "var(--color-wl-absent)", text: "var(--color-wl-absent-text)" },
};

/**
 * The tileFlip animation goes:
 *   0%   → rotateX(0)    — blank tile, facing user
 *   45%  → rotateX(90°)  — edge-on, invisible to user
 *   55%  → rotateX(90°)  — still edge-on (color changes here)
 *   100% → rotateX(0)    — colored tile, facing user
 *
 * The flip takes 500ms. The edge-on window is 45%-55% = 225ms-275ms.
 * We delay the color change to (revealDelay + 250ms) so it happens
 * when the tile is invisible, creating the classic Wordle "flip to reveal".
 */
const FLIP_DURATION = 500;
const FLIP_MIDPOINT = Math.floor(FLIP_DURATION * 0.5); // 250ms

export default function WordleTile(props: Props) {
  // Delayed state: starts undefined during reveal, becomes the actual state
  // at the flip midpoint (when the tile is edge-on and invisible).
  const [visibleState, setVisibleState] = createSignal<LetterState | undefined>(undefined);

  createEffect(() => {
    const revealing = props.isRevealing;
    const state = props.state;
    const delay = props.revealDelay ?? 0;

    if (revealing && state) {
      // During reveal: start blank, schedule color at flip midpoint
      setVisibleState(undefined);
      const timer = setTimeout(() => {
        setVisibleState(state);
      }, delay + FLIP_MIDPOINT);
      onCleanup(() => clearTimeout(timer));
    } else if (!revealing && state) {
      // Already revealed or not animating — show state immediately
      setVisibleState(state);
    } else {
      setVisibleState(undefined);
    }
  });

  const hasState = () => visibleState() !== undefined;
  const styles = () => (visibleState() ? stateStyles[visibleState()!] : null);

  return (
    <div
      class="flex items-center justify-center w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-lg select-none"
      style={{
        "border-width": "2px",
        "border-style": "solid",
        "border-color":
          props.letter && !hasState() ? "var(--color-border-strong)" : "var(--color-border)",
        "background-color": styles()?.bg ?? "transparent",
        color: styles()?.text ?? "var(--color-fg)",
        "font-size": "1.5rem",
        "font-weight": "700",
        "text-transform": "uppercase" as const,
        transition: "border-color 0.15s ease-out",
        animation: [
          props.isRevealing
            ? `tileFlip ${FLIP_DURATION}ms ease-in-out ${props.revealDelay ?? 0}ms both`
            : "",
          props.isPopping && !props.isRevealing ? "tilePop 100ms ease-out both" : "",
          props.isBouncing ? `tileBounce 500ms ease ${props.bounceDelay ?? 0}ms both` : "",
        ]
          .filter(Boolean)
          .join(", "),
        perspective: "600px",
      }}
    >
      <Show when={props.letter}>{props.letter}</Show>
    </div>
  );
}
