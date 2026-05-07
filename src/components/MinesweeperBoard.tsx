import { For, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { Board } from "@/lib/minesweeper";
import MinesweeperCell from "./MinesweeperCell";

interface Props {
  board: Board;
  rows: number;
  cols: number;
  selectedCell: [number, number] | null;
  onSelectCell: (row: number, col: number) => void;
  triggeredMine: [number, number] | null;
  wrongFlags: [number, number][];
  gameOver: boolean;
  onCellClick: (row: number, col: number) => void;
  /** True while the pre-result animation is playing */
  isCompleting: boolean;
  /** The cell that triggered game-end — origin for animation stagger */
  completionOrigin: [number, number] | null;
}

export default function MinesweeperBoard(props: Props) {
  const rows = () => props.rows;
  const cols = () => props.cols;

  // ── Entrance animation ─────────────────────────────────────────────────────
  /**
   * True from mount until the last cell's entrance animation finishes.
   * Stagger step scales with board size so all three difficulty boards
   * complete in roughly the same 750–850 ms window.
   */
  const [entering, setEntering] = createSignal(true);
  onMount(() => {
    const maxDist = Math.floor(rows() / 2) + Math.floor(cols() / 2);
    const step = Math.round(250 / Math.max(maxDist, 1));
    const timer = setTimeout(() => setEntering(false), maxDist * step + 520);
    onCleanup(() => clearTimeout(timer));
  });

  // ── Keyboard navigation ────────────────────────────────────────────────────
  function handleKeyDown(e: KeyboardEvent) {
    const sel = props.selectedCell;
    if (!sel) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        props.onSelectCell(0, 0);
      }
      return;
    }

    const [row, col] = sel;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) props.onSelectCell(row - 1, col);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (row < rows() - 1) props.onSelectCell(row + 1, col);
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (col > 0) props.onSelectCell(row, col - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (col < cols() - 1) props.onSelectCell(row, col + 1);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        props.onCellClick(row, col);
        break;
      case "f":
      case "F":
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("minesweeper-flag", { detail: { row, col } }));
        break;
      case "Escape":
        e.preventDefault();
        props.onSelectCell(-1, -1);
        break;
    }
  }

  createEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  // ── Per-cell helpers ───────────────────────────────────────────────────────

  function cellBorderClasses(_row: number, col: number): string {
    const c = cols();
    const borders: string[] = [];

    if (col === c - 1) borders.push("border-r");
    else borders.push("border-r");

    borders.push("border-b");

    if (col === 0) borders.push("border-l");

    return borders.join(" ");
  }

  function cellSize(): string {
    const r = rows();
    const c = cols();
    if (r <= 9 && c <= 9) return "w-9 h-9 md:w-11 md:h-11";
    if (r <= 16 && c <= 16) return "w-7 h-7 md:w-9 md:h-9";
    return "w-6 h-6 md:w-7 md:h-7";
  }

  function fontSize(): string {
    const r = rows();
    const c = cols();
    if (r <= 9 && c <= 9) return "text-base md:text-lg";
    if (r <= 16 && c <= 16) return "text-sm md:text-base";
    return "text-xs md:text-sm";
  }

  // ── Flat cell index list ───────────────────────────────────────────────────
  const cellIndices = createMemo(() => Array.from({ length: rows() * cols() }, (_, i) => i));

  const wrongFlagsSet = createMemo(() => {
    const set = new Set<string>();
    for (const [r, c] of props.wrongFlags) {
      set.add(`${r},${c}`);
    }
    return set;
  });

  return (
    <div
      class="inline-grid rounded-sm overflow-hidden border-2 border-border-strong shadow-md shadow-shadow"
      style={{ "grid-template-columns": `repeat(${cols()}, auto)` }}
    >
      <For each={cellIndices()}>
        {(idx) => {
          const row = Math.floor(idx / cols());
          const col = idx % cols();

          const cell = () => props.board[row]?.[col];
          const isSelected = () => {
            const sel = props.selectedCell;
            return sel !== null && sel[0] === row && sel[1] === col;
          };
          const isTriggeredMine = () => {
            const tm = props.triggeredMine;
            return tm !== null && tm[0] === row && tm[1] === col;
          };
          const isWrongFlag = () => wrongFlagsSet().has(`${row},${col}`);

          // ── Per-cell animation values ──────────────────────────────────────
          const centerRow = (rows() - 1) / 2;
          const centerCol = (cols() - 1) / 2;
          const maxDist = Math.floor(rows() / 2) + Math.floor(cols() / 2);
          const step = Math.round(250 / Math.max(maxDist, 1));
          const entranceDelay = Math.round(
            (Math.abs(row - centerRow) + Math.abs(col - centerCol)) * step
          );

          const completingDelay = () => {
            const origin = props.completionOrigin;
            return props.isCompleting && origin
              ? (Math.abs(row - origin[0]) + Math.abs(col - origin[1])) * 35
              : 0;
          };

          const borders = cellBorderClasses(row, col);
          const cs = cellSize();
          const fs = fontSize();

          return (
            <MinesweeperCell
              state={cell()?.state ?? "hidden"}
              value={cell()?.value ?? 0}
              isMine={cell()?.isMine ?? false}
              isTriggeredMine={isTriggeredMine()}
              isWrongFlag={isWrongFlag()}
              isSelected={isSelected()}
              gameOver={props.gameOver}
              cellSize={cs}
              fontSize={fs}
              borderClasses={borders}
              entering={entering()}
              entranceDelay={entranceDelay}
              isCompleting={props.isCompleting}
              completingDelay={completingDelay()}
              isLoss={props.triggeredMine !== null}
              onSelect={() => {
                props.onSelectCell(row, col);
                props.onCellClick(row, col);
              }}
              onFlag={() => {
                props.onSelectCell(row, col);
                window.dispatchEvent(new CustomEvent("minesweeper-flag", { detail: { row, col } }));
              }}
            />
          );
        }}
      </For>
    </div>
  );
}
