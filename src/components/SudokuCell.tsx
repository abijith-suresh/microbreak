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
  /** Border width/side classes computed by SudokuBoard (box boundaries) */
  borderClasses: string;
  cellSize: string;
  fontSize: string;
  onSelect: () => void;
}

export default function SudokuCell(props: Props) {
  /**
   * Background class.
   * Completing wave and group sweep are handled via inline animation styles,
   * so we skip the static bg when an animation is running.
   */
  const bgClass = () => {
    if (props.isCompleting || props.sweepDelay !== null) return "";
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

  /**
   * Text colour + font-weight based on cell state.
   * Error always gets text-error; given gets text-fg font-bold; user gets
   * text-accent font-medium; empty gets no explicit colour.
   */
  const textClass = () => {
    if (props.isError) return "text-error font-medium";
    if (props.isGiven) return "text-fg font-bold";
    if (props.value !== null) return "text-accent font-medium";
    return "";
  };

  /**
   * Border colour — if error, use error colour; otherwise use the theme border.
   * z-[1] on error cells ensures the coloured border overlaps adjacent borders.
   */
  const borderColorClass = () => (props.isError ? "border-error z-[1]" : "border-border");

  /**
   * Inline animation style. Completing wave takes visual precedence over the
   * group sweep. The error flash keyframe is also applied here so it replays
   * each time a new conflict is introduced.
   */
  const animationStyle = () => {
    if (props.isCompleting) {
      return {
        animation: `completionWave 0.5s ease-out ${props.completingDelay}ms forwards`,
      };
    }
    if (props.sweepDelay !== null) {
      return {
        animation: `groupSweep 0.45s ease-out ${props.sweepDelay}ms forwards`,
      };
    }
    if (props.isError) {
      return { animation: "errorAppear 0.2s ease-out" };
    }
    return undefined;
  };

  /** Only show hover background when the cell has no highlight / animation */
  const hoverClass = () =>
    !props.isCompleting && props.sweepDelay === null && props.highlight === null
      ? "hover:bg-surface-hover"
      : "";

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
      style={animationStyle()}
      onClick={props.onSelect}
    >
      {props.value}
    </button>
  );
}
