import { createSignal } from "solid-js";
import type { CellState, CellValue } from "@/lib/minesweeper";

interface Props {
  state: CellState;
  value: CellValue;
  isMine: boolean;
  isTriggeredMine: boolean;
  isWrongFlag: boolean;
  isSelected: boolean;
  gameOver: boolean;
  cellSize: string;
  fontSize: string;
  borderClasses: string;
  onSelect: () => void;
}

// Standard minesweeper number colors (1–8)
const NUMBER_COLORS: Record<number, string> = {
  1: "color: var(--color-ms-1)",
  2: "color: var(--color-ms-2)",
  3: "color: var(--color-ms-3)",
  4: "color: var(--color-ms-4)",
  5: "color: var(--color-ms-5)",
  6: "color: var(--color-ms-6)",
  7: "color: var(--color-ms-7)",
  8: "color: var(--color-ms-8)",
};

export default function MinesweeperCell(props: Props) {
  const [pressing, setPressing] = createSignal(false);

  // ── Background class ───────────────────────────────────────────────────────
  const bgClass = () => {
    if (props.isTriggeredMine && props.state === "revealed") return "bg-error";
    if (props.state === "revealed") return "bg-bg";
    if (props.state === "flagged") return "bg-surface";
    // hidden
    return "bg-surface";
  };

  // ── Hover class ────────────────────────────────────────────────────────────
  const hoverClass = () =>
    props.state === "hidden" && !props.gameOver ? "hover:bg-surface-hover" : "";

  // ── Cursor ─────────────────────────────────────────────────────────────────
  const cursorClass = () =>
    props.state === "revealed" || props.gameOver ? "cursor-default" : "cursor-pointer";

  // ── Selection highlight ────────────────────────────────────────────────────
  const selectionClass = () =>
    props.isSelected && props.state !== "revealed" && !props.gameOver
      ? "ring-2 ring-accent ring-inset"
      : "";

  // ── Cell content ───────────────────────────────────────────────────────────
  function renderContent() {
    if (props.state === "flagged") {
      if (props.isWrongFlag) {
        // Wrong flag — show flag with X
        return (
          <span class="relative inline-flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-error)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            <svg
              class="absolute"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-error)"
              stroke-width="3"
              stroke-linecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
        );
      }
      // Normal flag
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-accent)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      );
    }

    if (props.state === "revealed") {
      if (props.isMine) {
        // Mine icon
        return (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="var(--color-fg)"
            stroke="var(--color-fg)"
            stroke-width="1"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
          </svg>
        );
      }

      if (props.value > 0) {
        return (
          <span class="font-bold" style={NUMBER_COLORS[props.value]}>
            {props.value}
          </span>
        );
      }
      // value === 0: empty cell, no content
      return null;
    }

    // Hidden cell: no content
    return null;
  }

  return (
    <button
      class={[
        "minesweeper-cell",
        props.cellSize,
        props.fontSize,
        props.borderClasses,
        bgClass(),
        hoverClass(),
        cursorClass(),
        selectionClass(),
        "focus:outline-none",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transform: pressing() && props.state !== "revealed" && !props.gameOver ? "scale(0.93)" : "",
        transition:
          "background-color 0.15s ease-out, border-color 0.2s ease-out, transform 0.1s ease-out",
      }}
      onClick={props.onSelect}
      onPointerDown={() => setPressing(true)}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      onPointerCancel={() => setPressing(false)}
    >
      {renderContent()}
    </button>
  );
}
