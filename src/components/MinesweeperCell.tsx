import { createSignal, onCleanup } from "solid-js";
import type { JSX } from "solid-js";
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
  /** True while the board entrance animation is playing */
  entering: boolean;
  /** ms delay for the centre-outward entrance stagger */
  entranceDelay: number;
  /** True while the pre-result animation is playing */
  isCompleting: boolean;
  /** ms delay for the completion stagger (win wave or loss blast) */
  completingDelay: number;
  /** True when the game ended as a loss (drives mineBlast vs completionWave) */
  isLoss: boolean;
  onSelect: () => void;
  onFlag: () => void;
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

const LONG_PRESS_MS = 350;

export default function MinesweeperCell(props: Props) {
  const [pressing, setPressing] = createSignal(false);
  const [longPressTriggered, setLongPressTriggered] = createSignal(false);

  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  // True whenever a keyframe animation owns the transform
  const isAnimating = () => props.entering || props.isCompleting;

  // ── Background class ───────────────────────────────────────────────────────
  const bgClass = () => {
    // During completion/entrance, keyframe owns background — clear it
    if (props.isCompleting || props.entering) return "";
    if (props.isTriggeredMine && props.state === "revealed") return "bg-error";
    if (props.state === "revealed") return "bg-bg";
    return "bg-surface";
  };

  // ── Hover class ────────────────────────────────────────────────────────────
  const hoverClass = () =>
    !isAnimating() && props.state === "hidden" && !props.gameOver ? "hover:bg-surface-hover" : "";

  // ── Cursor ─────────────────────────────────────────────────────────────────
  const cursorClass = () =>
    props.state === "revealed" || props.gameOver ? "cursor-default" : "cursor-pointer";

  // ── Selection highlight ────────────────────────────────────────────────────
  const selectionClass = () =>
    !isAnimating() && props.isSelected && !props.gameOver ? "ring-2 ring-accent ring-inset" : "";

  // ── Combined animation + press style ──────────────────────────────────────
  /**
   * Priority: entrance → completion animation → normal press feedback.
   * Always returns both `animation` and `transform` so SolidJS reliably
   * clears whichever is not in use.
   */
  const cellAnimationClass = (): string => {
    // 1. Board entrance — cells materialise centre-outward
    if (props.entering) return "animate-cell-reveal";

    // 2. Pre-result animation: completionWave (win) or mineBlast (loss)
    if (props.isCompleting) return props.isLoss ? "animate-mine-blast" : "animate-completion-wave";

    // 3. Normal state — no animation class
    return "";
  };

  const cellAnimationDelay = (): string | undefined => {
    if (props.entering) return `${props.entranceDelay}ms`;
    if (props.isCompleting) return `${props.completingDelay}ms`;
    return undefined;
  };

  const cellTransform = () =>
    pressing() && props.state !== "revealed" && !props.gameOver ? "scale(0.93)" : "";

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

  function clearLongPressTimer() {
    if (longPressTimer !== null) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function startLongPress(pointerType: string) {
    if (pointerType === "mouse" || props.state === "revealed" || props.gameOver) return;
    clearLongPressTimer();
    longPressTimer = setTimeout(() => {
      setLongPressTriggered(true);
      setPressing(false);
      props.onFlag();
      longPressTimer = null;
    }, LONG_PRESS_MS);
  }

  function handleClick() {
    if (longPressTriggered()) {
      setLongPressTriggered(false);
      return;
    }
    props.onSelect();
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    props.onFlag();
  }

  onCleanup(() => clearLongPressTimer());

  return (
    <button
      class={[
        "minesweeper-cell",
        props.cellSize,
        props.fontSize,
        props.borderClasses,
        bgClass(),
        hoverClass(),
        cellAnimationClass(),
        cursorClass(),
        selectionClass(),
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--tw-animation-delay": cellAnimationDelay(),
          transform: cellTransform(),
          transition:
            "background-color 0.15s ease-out, border-color 0.2s ease-out, transform 0.1s ease-out",
        } as JSX.CSSProperties & Record<string, string | undefined>
      }
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={(e) => {
        setPressing(true);
        startLongPress(e.pointerType);
      }}
      onPointerUp={() => {
        setPressing(false);
        clearLongPressTimer();
      }}
      onPointerLeave={() => {
        setPressing(false);
        clearLongPressTimer();
      }}
      onPointerCancel={() => {
        setPressing(false);
        clearLongPressTimer();
      }}
    >
      {renderContent()}
    </button>
  );
}
