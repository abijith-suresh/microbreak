import { createSignal, createEffect, onCleanup } from "solid-js";
import type { Cell, Board, GridSize } from "@/lib/sudoku";

interface Props {
  puzzle: Board;
  solution: Board;
  size: GridSize;
  onCellChange: (row: number, col: number, value: Cell) => void;
  onComplete: () => void;
}

export default function SudokuBoard(props: Props) {
  const [selectedCell, setSelectedCell] = createSignal<[number, number] | null>(null);
  const [userBoard, setUserBoard] = createSignal<Board>(
    props.puzzle.map((row) => [...row])
  );

  // Reset user board when puzzle changes
  createEffect(() => {
    const _ = props.puzzle;
    setUserBoard(props.puzzle.map((row) => [...row]));
    setSelectedCell(null);
  });

  const size = () => props.size;

  function isGiven(row: number, col: number): boolean {
    return props.puzzle[row][col] !== null;
  }

  function isSelected(row: number, col: number): boolean {
    const sel = selectedCell();
    return sel !== null && sel[0] === row && sel[1] === col;
  }

  function isHighlighted(row: number, col: number): boolean {
    const sel = selectedCell();
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

  function selectCell(row: number, col: number) {
    setSelectedCell([row, col]);
  }

  function setCellValue(row: number, col: number, value: Cell) {
    if (isGiven(row, col)) return;
    const newBoard = userBoard().map((r) => [...r]);
    newBoard[row][col] = value;
    setUserBoard(newBoard);
    props.onCellChange(row, col, value);

    // Check completion
    if (isBoardComplete(newBoard)) {
      props.onComplete();
    }
  }

  function isBoardComplete(board: Board): boolean {
    for (let r = 0; r < size(); r++) {
      for (let c = 0; c < size(); c++) {
        if (board[r][c] === null) return false;
      }
    }
    return true;
  }

  function handleKeyDown(e: KeyboardEvent) {
    const sel = selectedCell();
    if (!sel) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        setSelectedCell([0, 0]);
      }
      return;
    }

    let [row, col] = sel;

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) setSelectedCell([row - 1, col]);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (row < size() - 1) setSelectedCell([row + 1, col]);
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (col > 0) setSelectedCell([row, col - 1]);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (col < size() - 1) setSelectedCell([row, col + 1]);
        break;
      case "Backspace":
      case "Delete":
        e.preventDefault();
        setCellValue(row, col, null);
        break;
      case "Escape":
        e.preventDefault();
        setSelectedCell(null);
        break;
      default: {
        const num = parseInt(e.key);
        if (num >= 1 && num <= size()) {
          e.preventDefault();
          setCellValue(row, col, num);
        }
        break;
      }
    }
  }

  // Expose handleKeyDown and selectedCell for parent components
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__sudokuSelectedCell = selectedCell;
    (window as unknown as Record<string, unknown>).__sudokuSetCellValue = setCellValue;
  }

  onMount(() => {
    (window as unknown as Record<string, unknown>).__sudokuSelectedCell = selectedCell;
    (window as unknown as Record<string, unknown>).__sudokuSetCellValue = setCellValue;
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  // Grid border styles — thicker lines for box boundaries
  function cellBorderStyle(row: number, col: number): string {
    const [boxRows, boxCols] = getBoxDims(size());
    const borders: string[] = [];

    // Right border
    if (col === size() - 1) {
      borders.push("border-r-[2.5px]");
    } else if ((col + 1) % boxCols === 0) {
      borders.push("border-r-[2px]");
    } else {
      borders.push("border-r");
    }

    // Bottom border
    if (row === size() - 1) {
      borders.push("border-b-[2.5px]");
    } else if ((row + 1) % boxRows === 0) {
      borders.push("border-b-[2px]");
    } else {
      borders.push("border-b");
    }

    // Top border
    if (row === 0) borders.push("border-t-[2.5px]");

    // Left border
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
      class="inline-grid border-[var(--color-border-strong)]"
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
            onClick={() => selectCell(row, col)}
          >
            {userBoard()[row][col]}
          </button>
        ))
      )}
    </div>
  );
}
