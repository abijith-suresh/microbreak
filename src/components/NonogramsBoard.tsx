import { createEffect, For, Index, onCleanup, onMount } from "solid-js";
import { shouldIgnoreGameKey } from "@/lib/keyboard";
import type { CellMark, Clue, Marks, NonogramSize } from "@/lib/nonogram";

interface Props {
  size: NonogramSize;
  rowClues: Clue[];
  colClues: Clue[];
  marks: Marks;
  satisfiedRows: boolean[];
  satisfiedCols: boolean[];
  selectedCell: [number, number] | null;
  /** True while the win wave plays, before the result screen. */
  isCompleting: boolean;
  onSelectCell: (row: number, col: number) => void;
  /** A press on a cell. `mark` is set for a right-click, which always crosses. */
  onBeginStroke: (row: number, col: number, mark?: "crossed") => void;
  onExtendStroke: (row: number, col: number) => void;
  onEndStroke: () => void;
  /** A key press or assistive-technology click on a cell. */
  onMarkCell: (row: number, col: number, action: CellMark | "mode") => void;
}

/**
 * Per size: the largest cell, and the clue text. Cells shrink below the largest size to fit
 * the screen; the clue text keeps its size, so at 15×15 on a 320px phone the clues stay at
 * 10px and the cells give up the room (about 17px each).
 */
const SIZING: Record<NonogramSize, { cell: string; clue: string }> = {
  5: { cell: "3.25rem", clue: "text-base" },
  10: { cell: "2.25rem", clue: "text-[13px] md:text-sm" },
  15: { cell: "1.875rem", clue: "text-[10px] min-[400px]:text-[11px] md:text-[13px]" },
};

const MARK_LABEL: Record<CellMark, string> = {
  empty: "empty",
  filled: "filled",
  crossed: "crossed",
};

const clueText = (clue: Clue) => (clue.length ? clue.join(" ") : "0");

function cellAt(x: number, y: number): [number, number] | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-cell]");
  if (!el?.dataset.cell) return null;
  const [row, col] = el.dataset.cell.split("-").map(Number);
  return [row, col];
}

export default function NonogramsBoard(props: Props) {
  const n = () => props.size;
  let boardRef!: HTMLTableElement;

  // ── Pointer: tap marks a cell, drag paints a row or column ───────────────
  function stopDrag() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  }

  function onPointerMove(e: PointerEvent) {
    const cell = cellAt(e.clientX, e.clientY);
    if (cell) props.onExtendStroke(cell[0], cell[1]);
  }

  function onPointerUp() {
    stopDrag();
    props.onEndStroke();
  }

  function onPointerDown(e: PointerEvent, row: number, col: number) {
    if (e.button !== 0 && e.button !== 2) return;
    // Touch captures the pointer to the first cell; release it so moves reach other cells.
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture?.(e.pointerId)) target.releasePointerCapture(e.pointerId);
    stopDrag();
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    props.onBeginStroke(row, col, e.button === 2 ? "crossed" : undefined);
  }

  onCleanup(stopDrag);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  function handleKeyDown(e: KeyboardEvent) {
    if (shouldIgnoreGameKey(e) || props.isCompleting) return;
    const sel = props.selectedCell;
    const arrows: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (e.key in arrows) {
      e.preventDefault();
      if (!sel) {
        props.onSelectCell(0, 0);
        return;
      }
      const [dr, dc] = arrows[e.key];
      const row = Math.min(Math.max(sel[0] + dr, 0), n() - 1);
      const col = Math.min(Math.max(sel[1] + dc, 0), n() - 1);
      props.onSelectCell(row, col);
      return;
    }
    if (!sel) return;

    const [row, col] = sel;
    switch (e.key) {
      case " ":
      case "Enter":
        e.preventDefault();
        props.onMarkCell(row, col, "filled");
        break;
      case "x":
      case "X":
        e.preventDefault();
        props.onMarkCell(row, col, "crossed");
        break;
      case "Backspace":
      case "Delete":
        e.preventDefault();
        props.onMarkCell(row, col, "empty");
        break;
      case "Escape":
        e.preventDefault();
        props.onSelectCell(-1, -1);
        break;
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  // ── Roving tabindex: the board is one tab stop, arrows carry focus ───────
  createEffect(() => {
    const sel = props.selectedCell;
    if (sel && boardRef.contains(document.activeElement)) {
      boardRef.querySelector<HTMLElement>(`[data-cell="${sel[0]}-${sel[1]}"]`)?.focus();
    }
  });
  const isTabStop = (row: number, col: number) => {
    const sel = props.selectedCell;
    return sel ? sel[0] === row && sel[1] === col : row === 0 && col === 0;
  };

  const isSelectedRow = (row: number) => props.selectedCell?.[0] === row;
  const isSelectedCol = (col: number) => props.selectedCell?.[1] === col;

  /** Every fifth line is drawn darker, so long clues are easier to count out. */
  const blockEdge = (index: number) => (index + 1) % 5 === 0 && index < n() - 1;

  const clueClass = (done: boolean, selected: boolean) =>
    [
      "flex font-medium tabular-nums leading-none transition-colors duration-150",
      done ? "text-fg-tertiary opacity-45" : "text-fg",
      selected ? "bg-accent-light" : "",
    ].join(" ");

  /** The board's frame: the edge cells' borders plus one more pixel drawn outside them. */
  const frameShadow = (row: number, col: number) => {
    const edge = "var(--color-border-strong)";
    const shadows = [
      row === 0 && `0 -1px 0 ${edge}`,
      row === n() - 1 && `0 1px 0 ${edge}`,
      col === 0 && `-1px 0 0 ${edge}`,
      col === n() - 1 && `1px 0 0 ${edge}`,
    ].filter(Boolean);
    return shadows.length ? shadows.join(", ") : undefined;
  };

  const indices = () => Array.from({ length: n() }, (_, i) => i);

  return (
    <table
      ref={boardRef}
      aria-label={`Nonogram, ${n()} by ${n()}`}
      data-game-keys
      data-nonogram-board
      class={`grid w-full max-w-max select-none ${SIZING[n()].clue}`}
      style={{
        "grid-template-columns": `auto repeat(${n()}, minmax(0, ${SIZING[n()].cell}))`,
        "grid-template-rows": `auto repeat(${n()}, auto)`,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <thead class="contents">
        {/* Column clues, read top to bottom. */}
        <tr class="contents">
          <td aria-hidden="true" style={{ "grid-area": "1 / 1" }} />
          <For each={indices()}>
            {(col) => {
              const done = () => props.satisfiedCols[col] ?? false;
              return (
                <th
                  scope="col"
                  aria-label={`Column ${col + 1}: ${clueText(props.colClues[col] ?? [])}${done() ? ", done" : ""}`}
                  data-col-clue={col}
                  data-done={done()}
                  class={`${clueClass(done(), isSelectedCol(col))} flex-col items-center justify-end gap-[0.35em] rounded-t-sm pb-[0.45em] pt-[0.3em]`}
                  style={{ "grid-area": `1 / ${col + 2}` }}
                >
                  <For each={props.colClues[col]?.length ? props.colClues[col] : [0]}>
                    {(value) => <span aria-hidden="true">{value}</span>}
                  </For>
                </th>
              );
            }}
          </For>
        </tr>
      </thead>

      <tbody class="contents">
        <For each={indices()}>
          {(row) => {
            const done = () => props.satisfiedRows[row] ?? false;
            return (
              <tr class="contents">
                <th
                  scope="row"
                  aria-label={`Row ${row + 1}: ${clueText(props.rowClues[row] ?? [])}${done() ? ", done" : ""}`}
                  data-row-clue={row}
                  data-done={done()}
                  class={`${clueClass(done(), isSelectedRow(row))} items-center justify-end gap-[0.4em] rounded-l-sm pl-[0.3em] pr-[0.55em]`}
                  style={{ "grid-area": `${row + 2} / 1` }}
                >
                  <For each={props.rowClues[row]?.length ? props.rowClues[row] : [0]}>
                    {(value) => <span aria-hidden="true">{value}</span>}
                  </For>
                </th>
                <Index each={indices()}>
                  {(colAccessor) => {
                    const col = colAccessor();
                    const mark = () => props.marks[row]?.[col] ?? "empty";
                    const selected = () => isSelectedRow(row) && isSelectedCol(col);
                    const delay = Math.round(((row + col) * 420) / Math.max(2 * n() - 2, 1));
                    return (
                      <td class="contents">
                        <button
                          type="button"
                          data-cell={`${row}-${col}`}
                          data-mark={mark()}
                          aria-label={`Row ${row + 1}, column ${col + 1}, ${MARK_LABEL[mark()]}`}
                          tabIndex={isTabStop(row, col) ? 0 : -1}
                          class={[
                            "nonogram-cell relative flex aspect-square w-full touch-none items-center justify-center border-r border-b border-border focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                            col === 0 ? "border-l border-l-border-strong" : "",
                            row === 0 ? "border-t border-t-border-strong" : "",
                            blockEdge(col) || col === n() - 1 ? "border-r-border-strong" : "",
                            blockEdge(row) || row === n() - 1 ? "border-b-border-strong" : "",
                            mark() === "filled" ? "bg-fg" : "bg-surface hover:bg-surface-hover",
                            selected() ? "outline-2 -outline-offset-2 outline-accent" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={{
                            "grid-area": `${row + 2} / ${col + 2}`,
                            "box-shadow": frameShadow(row, col),
                          }}
                          onPointerDown={(e) => onPointerDown(e, row, col)}
                          onFocus={() => {
                            // Tabbing onto the board selects the cell, so arrows start from it.
                            if (!selected() && !props.isCompleting) props.onSelectCell(row, col);
                          }}
                          onClick={(e) => {
                            // Pointer clicks were handled on press; this is a screen reader's click.
                            if (e.detail === 0) props.onMarkCell(row, col, "mode");
                          }}
                        >
                          {mark() === "crossed" && (
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              class="size-[55%] text-fg-tertiary"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                            >
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          )}
                          {props.isCompleting && (
                            <span
                              aria-hidden="true"
                              class="pointer-events-none absolute inset-0 animate-completion-wave"
                              style={{ "--tw-animation-delay": `${delay}ms` }}
                            />
                          )}
                        </button>
                      </td>
                    );
                  }}
                </Index>
              </tr>
            );
          }}
        </For>
      </tbody>
    </table>
  );
}
