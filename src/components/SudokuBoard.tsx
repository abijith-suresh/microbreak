import { For, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import {
  getBoxDims,
  type Board,
  type Cell,
  type CompletingGroup,
  type GridSize,
} from "@/lib/sudoku";
import SudokuCell, { type CellHighlight } from "./SudokuCell";

interface Props {
  puzzle: Board;
  solution: Board;
  size: GridSize;
  selectedCell: [number, number] | null;
  onSelectCell: (row: number, col: number) => void;
  userBoard: Board;
  conflictedCells: Set<string>;
  completing: boolean;
  completionOrigin: [number, number] | null;
  completingGroups: CompletingGroup[];
}

export default function SudokuBoard(props: Props) {
  const size = () => props.size;

  // ── Entrance animation ─────────────────────────────────────────────────────
  /**
   * `entering` is true from mount until the last cell's entrance animation
   * finishes. While true, cells play the `cellReveal` keyframe and skip
   * highlight / press feedback (animation takes visual precedence).
   *
   * Max Manhattan distance from centre = size - 1.
   * Each step adds 28 ms of delay; the keyframe itself runs for 500 ms.
   */
  const [entering, setEntering] = createSignal(true);
  onMount(() => {
    const maxDelay = (props.size - 1) * 28; // ms
    const timer = setTimeout(() => setEntering(false), maxDelay + 520);
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
        props.onSelectCell(-1, -1);
        break;
      default: {
        const num = parseInt(e.key);
        if (num >= 1 && num <= size()) {
          e.preventDefault();
          window.dispatchEvent(
            new CustomEvent("sudoku-number-input", { detail: { row, col, num } })
          );
        }
        break;
      }
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  // ── Per-cell helpers ───────────────────────────────────────────────────────

  function cellBorderClasses(row: number, col: number): string {
    const [boxRows, boxCols] = getBoxDims(size());
    const borders: string[] = [];

    if (col === size() - 1) borders.push("border-r-strong");
    else if ((col + 1) % boxCols === 0) borders.push("border-r-2");
    else borders.push("border-r");

    if (row === size() - 1) borders.push("border-b-strong");
    else if ((row + 1) % boxRows === 0) borders.push("border-b-2");
    else borders.push("border-b");

    if (row === 0) borders.push("border-t-strong");
    if (col === 0) borders.push("border-l-strong");

    return borders.join(" ");
  }

  function computeHighlight(row: number, col: number, value: Cell): CellHighlight {
    const sel = props.selectedCell;
    if (!sel) return null;

    const [sr, sc] = sel;
    if (row === sr && col === sc) return "selected";
    if (row === sr || col === sc) return "row-col";

    const [boxRows, boxCols] = getBoxDims(size());
    const bsr = Math.floor(sr / boxRows) * boxRows;
    const bsc = Math.floor(sc / boxCols) * boxCols;
    if (row >= bsr && row < bsr + boxRows && col >= bsc && col < bsc + boxCols) return "box";

    const selValue = props.userBoard[sr][sc];
    if (selValue !== null && value === selValue) return "number";

    return null;
  }

  function computeSweepDelay(row: number, col: number): number | null {
    const groups = props.completingGroups;
    if (!groups.length) return null;

    const [boxRows, boxCols] = getBoxDims(size());
    const numBoxCols = size() / boxCols;
    let minDelay: number | null = null;

    for (const group of groups) {
      let delay: number | null = null;

      if (group.type === "row" && row === group.index) {
        delay = Math.abs(col - group.origin[1]) * 45;
      } else if (group.type === "col" && col === group.index) {
        delay = Math.abs(row - group.origin[0]) * 45;
      } else if (group.type === "box") {
        const br = Math.floor(group.index / numBoxCols) * boxRows;
        const bc = (group.index % numBoxCols) * boxCols;
        if (row >= br && row < br + boxRows && col >= bc && col < bc + boxCols) {
          delay = (Math.abs(row - group.origin[0]) + Math.abs(col - group.origin[1])) * 45;
        }
      }

      if (delay !== null && (minDelay === null || delay < minDelay)) {
        minDelay = delay;
      }
    }

    return minDelay;
  }

  function fontSize(): string {
    if (size() === 4) return "text-3xl md:text-4xl";
    if (size() === 6) return "text-2xl md:text-3xl";
    return "text-lg md:text-xl";
  }

  function cellSize(): string {
    if (size() === 4) return "w-16 h-16 md:w-20 md:h-20";
    if (size() === 6) return "w-13 h-13 md:w-16 md:h-16";
    return "w-9 h-9 md:w-12 md:h-12";
  }

  // ── Flat cell index list ───────────────────────────────────────────────────
  /**
   * A memoised flat array of indices 0 … size²-1.
   * Using <For> over this stable array means SolidJS never recreates cell DOM
   * nodes when unrelated signals change (e.g. selectedCell). Each cell's
   * reactive computations are isolated in their own scope, so a selection
   * change only re-runs `computeHighlight` — not `computeSweepDelay` — which
   * prevents CSS animations from restarting mid-play.
   */
  const cellIndices = createMemo(() => Array.from({ length: size() * size() }, (_, i) => i));

  return (
    <div
      class="inline-grid border-border-strong rounded-sm overflow-hidden shadow-md shadow-shadow"
      style={{ "grid-template-columns": `repeat(${size()}, auto)` }}
    >
      <For each={cellIndices()}>
        {(idx) => {
          const row = Math.floor(idx / size());
          const col = idx % size();

          // ── Reactive per-cell getters ──────────────────────────────────────
          // Each getter has its own reactive dependency set. Changing
          // `selectedCell` only re-runs `highlight` (which reads
          // `props.selectedCell`). `sweepDelay` only re-runs when
          // `props.completingGroups` or `props.completing` changes — keeping
          // the group-sweep animation stable across selection changes.
          const value = () => props.userBoard[row]?.[col] ?? null;
          const isGiven = () => !!props.puzzle[row]?.[col];
          const isError = () => props.conflictedCells.has(`${row},${col}`);
          const highlight = () => computeHighlight(row, col, value());

          const completingDelay = () => {
            const origin = props.completionOrigin;
            return props.completing && origin
              ? (Math.abs(row - origin[0]) + Math.abs(col - origin[1])) * 50
              : 0;
          };

          const sweepDelay = () => (props.completing ? null : computeSweepDelay(row, col));

          // ── Static per-cell values (stable for the lifetime of this board) ─
          const centerRow = (size() - 1) / 2;
          const centerCol = (size() - 1) / 2;
          const entranceDelay = Math.round(
            (Math.abs(row - centerRow) + Math.abs(col - centerCol)) * 28
          );
          const borders = cellBorderClasses(row, col);
          const cs = cellSize();
          const fs = fontSize();

          return (
            <SudokuCell
              value={value()}
              isGiven={isGiven()}
              highlight={highlight()}
              isError={isError()}
              isCompleting={props.completing}
              completingDelay={completingDelay()}
              sweepDelay={sweepDelay()}
              entering={entering()}
              entranceDelay={entranceDelay}
              borderClasses={borders}
              cellSize={cs}
              fontSize={fs}
              onSelect={() => props.onSelectCell(row, col)}
            />
          );
        }}
      </For>
    </div>
  );
}
