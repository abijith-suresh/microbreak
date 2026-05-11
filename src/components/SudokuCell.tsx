import { createSignal } from "solid-js";
import type { JSX } from "solid-js";
import type { Cell } from "@/lib/sudoku";

export type CellHighlight = "selected" | "row-col" | "box" | "number" | null;

interface Props {
  value: Cell;
  isGiven: boolean;
  highlight: CellHighlight;
  isError: boolean;
  /** True while the full-board completion wave is playing */
  isCompleting: boolean;
  /** ms delay for the full-board completion wave stagger */
  completingDelay: number;
  /** ms delay for the group sweep (null = not part of any completing group) */
  sweepDelay: number | null;
  /** True while the board entrance animation is playing */
  entering: boolean;
  /** ms delay for the center-outward entrance stagger */
  entranceDelay: number;
  /** Border width/side classes computed by SudokuBoard (box boundaries) */
  borderClasses: string;
  cellSize: string;
  fontSize: string;
  onSelect: () => void;
}

export default function SudokuCell(props: Props) {
  // ── Press feedback ─────────────────────────────────────────────────────────
  const [pressing, setPressing] = createSignal(false);

  // True whenever a keyframe animation owns the transform/opacity
  const isAnimating = () => props.entering || props.isCompleting || props.sweepDelay !== null;

  // ── Background class ───────────────────────────────────────────────────────
  /**
   * During sweep/completion, the keyframe handles background — return "".
   * During entrance, show the natural cell background so it fades in correctly.
   * Otherwise use the highlight-based background.
   */
  const bgClass = () => {
    if (props.isCompleting || props.sweepDelay !== null) return "";
    if (props.entering) return props.isGiven ? "bg-surface" : "bg-bg";
    switch (props.highlight) {
      case "selected":
        return "bg-selected";
      case "row-col":
        return "bg-highlight";
      case "box":
        return "bg-highlight opacity-70";
      case "number":
        return "bg-number-highlight";
      default:
        return props.isGiven ? "bg-surface" : "bg-bg";
    }
  };

  // ── Text class ─────────────────────────────────────────────────────────────
  const textClass = () => {
    if (props.isError) return "text-error font-medium";
    if (props.isGiven) return "text-fg font-bold";
    if (props.value !== null) return "text-accent font-medium";
    return "";
  };

  // ── Border colour ──────────────────────────────────────────────────────────
  const borderColorClass = () => (props.isError ? "border-error z-[1]" : "border-border");

  // ── Hover class ────────────────────────────────────────────────────────────
  const hoverClass = () =>
    !props.isCompleting && props.sweepDelay === null && props.highlight === null && !props.entering
      ? "hover:bg-surface-hover"
      : "";

  // ── Combined style (animation + press transform) ───────────────────────────
  /**
   * Always returns an object with both `animation` and `transform` so SolidJS
   * reliably clears whichever property is not in use, preventing stale styles
   * from a previous phase bleeding into the next.
   *
   * Priority: entrance > completion wave > group sweep > normal (error/press)
   */
  const cellAnimationClass = (): string => {
    // 1. Board entrance — cells materialise centre-outward
    if (props.entering) return "animate-cell-reveal";

    // 2. Full-board completion wave
    if (props.isCompleting) return "animate-completion-wave";

    // 3. Group sweep (row / col / box just completed)
    if (props.sweepDelay !== null) return "animate-group-sweep";

    // 4. Normal state — error flash
    if (props.isError) return "animate-error-appear";

    return "";
  };

  const cellAnimationDelay = (): string | undefined => {
    if (props.entering) return `${props.entranceDelay}ms`;
    if (props.isCompleting) return `${props.completingDelay}ms`;
    if (props.sweepDelay !== null) return `${props.sweepDelay}ms`;
    return undefined;
  };

  const cellTransform = () => (pressing() && !isAnimating() ? "scale(0.93)" : "");

  return (
    <button
      class={[
        "sudoku-cell",
        cellAnimationClass(),
        props.cellSize,
        props.fontSize,
        props.borderClasses,
        borderColorClass(),
        bgClass(),
        textClass(),
        hoverClass(),
        "cursor-pointer",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--tw-animation-delay": cellAnimationDelay(),
          transform: cellTransform(),
        } as JSX.CSSProperties & Record<string, string | undefined>
      }
      onClick={props.onSelect}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      onPointerCancel={() => setPressing(false)}
    >
      {props.value}
    </button>
  );
}
