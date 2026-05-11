import { Show } from "solid-js";
import type { JSX } from "solid-js";
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
 * The flip uses the standard card-flip CSS pattern with separate front/back
 * elements and backface-visibility: hidden. The back face always holds the
 * revealed color — it starts rotated 180° (hidden) and the transition
 * interpolates to 0° when revealed. At the 90° midpoint both faces are
 * edge-on, so the color switch is invisible.
 *
 * The pop is a quick scale bump when typing a letter.
 * The bounce is a celebratory translateY on correct tiles after all flips.
 */
const FLIP_DURATION = 600;

type Style = JSX.CSSProperties & Record<string, string | undefined>;

export default function WordleTile(props: Props) {
  const styles = () => (props.state ? stateStyles[props.state] : null);
  const isRevealed = () => props.state !== undefined;

  const flipStyle = (): Style => ({
    // perspective() lives in the transform so it is self-contained and never
    // conflicts with an ancestor transform (e.g. the tile-pop scale).
    // SolidJS's style handler calls nodeStyle.setProperty(key, val) for all
    // properties, so keys MUST be hyphenated CSS names — camelCase is silently
    // ignored by setProperty.
    transition: `transform ${FLIP_DURATION}ms ease-in-out ${props.revealDelay ?? 0}ms`,
    transform: isRevealed()
      ? `perspective(600px) rotateX(180deg)`
      : `perspective(600px) rotateX(0deg)`,
    "transform-style": "preserve-3d",
  });

  const frontStyle = (): Style => ({
    "backface-visibility": "hidden",
    "-webkit-backface-visibility": "hidden",
    // Use explicit longhands (hyphenated) so setProperty applies each one
    // individually; the border shorthand + camelCase borderColor was broken.
    "border-width": "2px",
    "border-style": "solid",
    "border-color":
      props.letter && !isRevealed() ? "var(--color-border-strong)" : "var(--color-border)",
    "background-color": "transparent",
    color: "var(--color-fg)",
  });

  const backStyle = (): Style => ({
    "backface-visibility": "hidden",
    "-webkit-backface-visibility": "hidden",
    transform: "rotateX(180deg)",
    "border-width": "2px",
    "border-style": "solid",
    "border-color": "transparent",
    "background-color": styles()?.bg ?? "transparent",
    color: styles()?.text ?? "var(--color-fg)",
    "--tw-animate-delay": props.isBouncing ? `${props.bounceDelay ?? 0}ms` : undefined,
  });

  return (
    <div
      class={
        "flex items-center justify-center size-13 sm:size-15 rounded-lg select-none" +
        (props.isPopping && !props.isRevealing ? " animate-tile-pop" : "")
      }
    >
      <div class="relative w-full h-full" style={flipStyle()}>
        {/* ── Front face — empty / border-only state ── */}
        <div
          class="absolute inset-0 flex items-center justify-center rounded-lg text-lg sm:text-2xl font-bold uppercase"
          style={frontStyle()}
        >
          <Show when={props.letter}>{props.letter}</Show>
        </div>

        {/* ── Back face — revealed state (colour, always starts hidden) ── */}
        <div
          class={
            "absolute inset-0 flex items-center justify-center rounded-lg text-lg sm:text-2xl font-bold uppercase" +
            (props.isBouncing ? " animate-tile-bounce" : "")
          }
          style={backStyle()}
        >
          <Show when={props.letter}>{props.letter}</Show>
        </div>
      </div>
    </div>
  );
}
