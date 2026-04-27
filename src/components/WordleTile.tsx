import { Show } from "solid-js";
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

export default function WordleTile(props: Props) {
  const hasState = () => props.state !== undefined;
  const styles = () => (props.state ? stateStyles[props.state] : null);

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
        transition: "background-color 0.1s ease, color 0.1s ease, border-color 0.1s ease",
        animation: [
          props.isRevealing ? `tileFlip 500ms ease-in-out ${props.revealDelay ?? 0}ms both` : "",
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
