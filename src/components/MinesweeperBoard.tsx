import { For, createEffect, createMemo, onCleanup } from "solid-js";
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
}

export default function MinesweeperBoard(props: Props) {
  const rows = () => props.rows;
  const cols = () => props.cols;

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
              onSelect={() => {
                props.onSelectCell(row, col);
                props.onCellClick(row, col);
              }}
            />
          );
        }}
      </For>
    </div>
  );
}
