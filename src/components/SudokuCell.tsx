import { createSignal } from "solid-js";
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
  const combinedStyle = (): { animation: string; transform: string } => {
    // 1. Board entrance — highest priority; cells materialise from the centre
    if (props.entering) {
      return {
        animation: `cellReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${props.entranceDelay}ms both`,
        transform: "",
      };
    }

    // 2. Full-board completion wave
    if (props.isCompleting) {
      return {
        animation: `completionWave 0.5s ease-out ${props.completingDelay}ms forwards`,
        transform: "",
      };
    }

    // 3. Group sweep (row / col / box just completed)
    if (props.sweepDelay !== null) {
      return {
        animation: `groupSweep 0.45s ease-out ${props.sweepDelay}ms forwards`,
        transform: "",
      };
    }

    // 4. Normal state — error flash and/or press transform
    return {
      animation: props.isError ? "errorAppear 0.2s ease-out" : "",
      // Press transform only when no animation is running
      transform: pressing() && !isAnimating() ? "scale(0.93)" : "",
    };
  };

  return (
    <button
      class={[
        "sudoku-cell",
        props.cellSize,
        props.fontSize,
        props.borderClasses,
        borderColorClass(),
        bgClass(),
        textClass(),
        hoverClass(),
        "focus:outline-none cursor-pointer",
      ]
        .filter(Boolean)
        .join(" ")}
      style={combinedStyle()}
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
