import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import {
  type CalcudokuBoard as Board,
  type CageStatus,
  type CalcudokuPuzzle,
  cageLabel,
  calcudokuCellSize,
  describeCell,
  getCageIndexGrid,
} from "@/lib/calcudoku";
import { shouldIgnoreGameKey } from "@/lib/keyboard";

interface Props {
  puzzle: CalcudokuPuzzle;
  board: Board;
  selectedCell: [number, number] | null;
  conflictedCells: Set<string>;
  cageStatuses: CageStatus[];
  completing: boolean;
  completionOrigin: [number, number] | null;
  onSelectCell: (row: number, col: number) => void;
  onDigit: (row: number, col: number, digit: number) => void;
  onErase: (row: number, col: number) => void;
  onToggleNotes: () => void;
}

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export default function CalcudokuBoard(props: Props) {
  const size = () => props.puzzle.size;
  const cageIndex = createMemo(() => getCageIndexGrid(props.puzzle));
  /** The cell that prints each cage's clue: its top row, then its leftmost cell. */
  const clueCells = createMemo(() => {
    const keys = new Set<string>();
    for (const cage of props.puzzle.cages) {
      const [row, col] = [...cage.cells].sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
      keys.add(`${row},${col}`);
    }
    return keys;
  });

  // ── Entrance animation (as Sudoku's: cells materialise centre-outward) ──────
  const [entering, setEntering] = createSignal(true);
  onMount(() => {
    const timer = setTimeout(() => setEntering(false), (size() - 1) * 28 + 520);
    onCleanup(() => clearTimeout(timer));
  });

  // ── Keyboard ───────────────────────────────────────────────────────────────
  function handleKeyDown(e: KeyboardEvent) {
    if (shouldIgnoreGameKey(e)) return;
    if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      props.onToggleNotes();
      return;
    }
    const sel = props.selectedCell;
    const step = ARROWS[e.key];
    if (!sel) {
      if (step) {
        e.preventDefault();
        props.onSelectCell(0, 0);
      }
      return;
    }
    const [row, col] = sel;
    if (step) {
      e.preventDefault();
      const r = row + step[0];
      const c = col + step[1];
      if (r >= 0 && r < size() && c >= 0 && c < size()) props.onSelectCell(r, c);
      return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      props.onErase(row, col);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      props.onSelectCell(-1, -1);
      return;
    }
    const digit = Number.parseInt(e.key, 10);
    if (digit >= 1 && digit <= size()) {
      e.preventDefault();
      props.onDigit(row, col, digit);
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  // ── Roving tabindex: the board is one tab stop, arrows carry focus ─────────
  let boardRef!: HTMLDivElement;
  createEffect(() => {
    const sel = props.selectedCell;
    if (sel && boardRef.contains(document.activeElement)) {
      boardRef.querySelector<HTMLElement>(`[data-cell="${sel[0]},${sel[1]}"]`)?.focus();
    }
  });
  const isTabStop = (row: number, col: number) => {
    const sel = props.selectedCell;
    return sel ? sel[0] === row && sel[1] === col : row === 0 && col === 0;
  };

  // ── Per-cell styling ───────────────────────────────────────────────────────
  /** Thick lines between cages, hairlines inside one. The board's own border is the edge. */
  function borderClasses(row: number, col: number): string {
    const grid = cageIndex();
    const classes: string[] = [];
    if (col < size() - 1) {
      classes.push(
        grid[row][col] === grid[row][col + 1]
          ? "border-r border-r-border"
          : "border-r-2 border-r-cage"
      );
    }
    if (row < size() - 1) {
      classes.push(
        grid[row][col] === grid[row + 1][col]
          ? "border-b border-b-border"
          : "border-b-2 border-b-cage"
      );
    }
    return classes.join(" ");
  }

  const valueFont = () =>
    size() === 4 ? "text-3xl md:text-4xl" : size() === 5 ? "text-2xl md:text-3xl" : "text-2xl";
  const noteColumns = () => (size() === 4 ? "grid-cols-2" : "grid-cols-3");
  const noteFont = () =>
    size() === 4 ? "text-[11px] md:text-xs" : "text-[9px] min-[375px]:text-[10px] md:text-[11px]";
  const rows = createMemo(() => Array.from({ length: size() }, (_, i) => i));

  return (
    // biome-ignore lint/a11y/useSemanticElements: an ARIA grid of flex rows, so each cell can draw its own cage borders
    <div
      ref={boardRef}
      role="grid"
      aria-label={`Calcudoku board, ${size()} by ${size()}`}
      class="flex flex-col overflow-hidden rounded-sm border-2 border-cage shadow-md shadow-shadow"
    >
      <For each={rows()}>
        {(row) => (
          // biome-ignore lint/a11y/useSemanticElements: see the grid above
          // biome-ignore lint/a11y/useFocusableInteractive: grid rows aren't focusable; their cells are
          <div role="row" class="flex">
            <For each={rows()}>
              {(col) => {
                const key = `${row},${col}`;
                const cageId = () => cageIndex()[row][col];
                const cage = () => props.puzzle.cages[cageId()];
                const isGiven = () => cage().operation === "given";
                const value = () => props.board.values[row][col];
                const notes = () => props.board.notes[row][col];
                const conflict = () => props.conflictedCells.has(key);
                const status = () => props.cageStatuses[cageId()] ?? "incomplete";
                const violated = () => status() === "violated";

                const highlight = () => {
                  const sel = props.selectedCell;
                  if (!sel) return null;
                  if (sel[0] === row && sel[1] === col) return "selected";
                  if (sel[0] === row || sel[1] === col) return "row-col";
                  const selValue = props.board.values[sel[0]][sel[1]];
                  if (selValue !== null && value() === selValue) return "number";
                  return null;
                };

                const background = () => {
                  if (props.completing || entering()) return isGiven() ? "bg-surface" : "bg-bg";
                  switch (highlight()) {
                    case "selected":
                      return "bg-selected";
                    case "row-col":
                      return violated() ? "bg-error/14" : "bg-highlight";
                    case "number":
                      return "bg-number-highlight";
                    default:
                      if (violated()) return "bg-error/10";
                      return isGiven() ? "bg-surface" : "bg-bg hover:bg-surface-hover";
                  }
                };

                const text = () => {
                  if (conflict()) return "text-error font-medium";
                  if (isGiven()) return "text-fg font-bold";
                  return "text-accent font-medium";
                };

                const animation = () => {
                  if (entering()) return "animate-cell-reveal";
                  if (props.completing) return "animate-completion-wave";
                  if (conflict()) return "animate-error-appear";
                  return "";
                };

                const delay = () => {
                  if (entering()) {
                    const centre = (size() - 1) / 2;
                    return `${Math.round((Math.abs(row - centre) + Math.abs(col - centre)) * 28)}ms`;
                  }
                  const origin = props.completionOrigin;
                  if (props.completing && origin) {
                    const distance = Math.abs(row - origin[0]) + Math.abs(col - origin[1]);
                    return `${Math.round((distance * 300) / (2 * (size() - 1)))}ms`;
                  }
                  return undefined;
                };

                return (
                  // biome-ignore lint/a11y/useSemanticElements: see the grid above
                  // biome-ignore lint/a11y/useKeyWithClickEvents: the board's window key handler drives cells by keyboard
                  <div
                    role="gridcell"
                    data-cell={key}
                    tabIndex={isTabStop(row, col) ? 0 : -1}
                    aria-selected={highlight() === "selected"}
                    aria-label={describeCell({
                      row,
                      col,
                      cage: cage(),
                      value: value(),
                      notes: notes(),
                      conflict: conflict(),
                      cageStatus: status(),
                    })}
                    onClick={() => props.onSelectCell(row, col)}
                    onFocus={() => {
                      if (highlight() !== "selected") props.onSelectCell(row, col);
                    }}
                    class={[
                      "calcudoku-cell relative flex cursor-pointer items-center justify-center pt-1.5",
                      calcudokuCellSize(size()),
                      valueFont(),
                      borderClasses(row, col),
                      background(),
                      text(),
                      conflict() ? "ring-2 ring-inset ring-error" : "",
                      animation(),
                    ].join(" ")}
                    style={{ "--tw-animation-delay": delay() }}
                  >
                    <Show when={clueCells().has(key)}>
                      <span
                        aria-hidden="true"
                        class={`pointer-events-none absolute top-0.5 left-1 text-[10px] leading-none font-semibold md:top-1 md:left-1.5 md:text-xs ${
                          violated() ? "text-error" : "text-fg-secondary"
                        }`}
                      >
                        {cageLabel(cage())}
                      </span>
                    </Show>
                    <Show
                      when={value() !== null}
                      fallback={
                        <Show when={notes().length > 0}>
                          <span
                            aria-hidden="true"
                            class={`pointer-events-none absolute inset-x-1 top-[34%] bottom-0.5 grid ${noteColumns()} place-items-center ${noteFont()} leading-none font-medium text-fg-secondary`}
                          >
                            <For each={rows()}>
                              {(i) => <span>{notes().includes(i + 1) ? i + 1 : ""}</span>}
                            </For>
                          </span>
                        </Show>
                      }
                    >
                      <span aria-hidden="true">{value()}</span>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
