import { createSignal, createEffect, onCleanup } from "solid-js";
import type { Cell, Board, GridSize } from "@/lib/sudoku";

interface Props {
  puzzle: Board;
  solution: Board;
  size: GridSize;
  selectedCell: [number, number] | null;
  onSelectCell: (row: number, col: number) => void;
  userBoard: Board;
}

export default function SudokuBoard(props: Props) {
  const size = () => props.size;

  function isGiven(row: number, col: number): boolean {
    return props.puzzle[row][col] !== null;
  }

  function isSelected(row: number, col: number): boolean {
    const sel = props.selectedCell;
    return sel !== null && sel[0] === row && sel[1] === col;
  }

  function isHighlighted(row: number, col: number): boolean {
    const sel = props.selectedCell;
    if (!sel) return false;
    if (row === sel[0] || col === sel[1]) return true;

    // Check same box
    const [boxRows, boxCols] = getBoxDims(size());
    const boxR = Math.floor(row / boxRows);
    const boxC = Math.floor(col / boxCols);
    const selBoxR = Math.floor(sel[0] / boxRows);
    const selBoxC = Math.floor(sel[1] / boxCols);
    return boxR === selBoxR && boxC === selBoxC;
  }

  function getBoxDims(s: GridSize): [number, number] {
    switch (s) {
      case 4:
        return [2, 2];
      case 6:
        return [2, 3];
      case 9:
        return [3, 3];
    }
  }

  // Keyboard navigation
  function handleKeyDown(e: KeyboardEvent) {
    const sel = props.selectedCell;
    if (!sel) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        props.onSelectCell(0, 0);
      }
      return;
    }

    let [row, col] = sel;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) props.onSelectCell(row - 1, col);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (row < size() - 1) props.onSelectCell(row + 1, col);
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (col > 0) props.onSelectCell(row, col - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (col < size() - 1) props.onSelectCell(row, col + 1);
        break;
      case "Backspace":
      case "Delete":
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("sudoku-erase", { detail: { row, col } }));
        break;
      case "Escape":
        e.preventDefault();
        props.onSelectCell(-1, -1); // deselect signal
        break;
      default: {
        const num = parseInt(e.key);
        if (num >= 1 && num <= size()) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("sudoku-number-input", { detail: { row, col, num } }));
        }
        break;
      }
    }
  }

  createEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  function cellBorderStyle(row: number, col: number): string {
    const [boxRows, boxCols] = getBoxDims(size());
    const borders: string[] = [];

    if (col === size() - 1) {
      borders.push("border-r-[2.5px]");
    } else if ((col + 1) % boxCols === 0) {
      borders.push("border-r-[2px]");
    } else {
      borders.push("border-r");
    }

    if (row === size() - 1) {
      borders.push("border-b-[2.5px]");
    } else if ((row + 1) % boxRows === 0) {
      borders.push("border-b-[2px]");
    } else {
      borders.push("border-b");
    }

    if (row === 0) borders.push("border-t-[2.5px]");
    if (col === 0) borders.push("border-l-[2.5px]");

    return borders.join(" ");
  }

  function fontSize(): string {
    switch (size()) {
      case 4:
        return "text-3xl md:text-4xl";
      case 6:
        return "text-2xl md:text-3xl";
      case 9:
        return "text-lg md:text-xl";
    }
  }

  function cellSize(): string {
    switch (size()) {
      case 4:
        return "w-16 h-16 md:w-20 md:h-20";
      case 6:
        return "w-13 h-13 md:w-16 md:h-16";
      case 9:
        return "w-9 h-9 md:w-12 md:h-12";
    }
  }

  return (
    <div
      class="inline-grid border-[var(--color-border-strong)] rounded-sm overflow-hidden shadow-md shadow-[var(--color-shadow)]"
      style={{
        "grid-template-columns": `repeat(${size()}, auto)`,
      }}
    >
      {Array.from({ length: size() }, (_, row) =>
        Array.from({ length: size() }, (_, col) => (
          <button
            class={`sudoku-cell ${cellSize()} ${fontSize()} border-[var(--color-border)] ${cellBorderStyle(row, col)} 
              ${isGiven(row, col) ? "given bg-[var(--color-surface)]" : "user bg-[var(--color-bg)]"}
              ${isSelected(row, col) ? "selected" : ""}
              ${isHighlighted(row, col) && !isSelected(row, col) ? "highlighted" : ""}
              transition-colors duration-75 focus:outline-none cursor-pointer hover:bg-[var(--color-surface-hover)]`}
            onClick={() => props.onSelectCell(row, col)}
          >
            {props.userBoard[row][col]}
          </button>
        ))
      )}
    </div>
  );
}
