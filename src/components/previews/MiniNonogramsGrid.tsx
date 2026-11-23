import { createEffect, createMemo, createSignal, For, Index, onCleanup } from "solid-js";
import { NONOGRAM_PREVIEW_PICTURE, NONOGRAM_RESTING_MARKS } from "@/data/previewGrids";
import { type CellMark, deriveClues, lineClue } from "@/lib/nonogram";
import { PreviewFrame } from "./PreviewFrame";

const SIZE = NONOGRAM_PREVIEW_PICTURE.length;
const { rowClues, colClues } = deriveClues(NONOGRAM_PREVIEW_PICTURE);
/** Ticks the finished picture holds before starting over. */
const HOLD_TICKS = 8;

const sameClue = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);

export function MiniNonogramsGrid(props: { animated: boolean }) {
  const [marks, setMarks] = createSignal<CellMark[][]>(NONOGRAM_RESTING_MARKS);

  // Marks the rest of the resting board, holds the finished picture, then starts over from
  // rest. Stopping puts it back.
  createEffect(() => {
    if (!props.animated) {
      setMarks(NONOGRAM_RESTING_MARKS);
      return;
    }

    const order: [number, number][] = [];
    NONOGRAM_RESTING_MARKS.forEach((row, r) => {
      row.forEach((mark, c) => {
        if (mark === "empty") order.push([r, c]);
      });
    });
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    let idx = 0;
    const batchSize = 3;
    const interval = setInterval(() => {
      if (idx >= order.length + HOLD_TICKS * batchSize) {
        setMarks(NONOGRAM_RESTING_MARKS);
        idx = 0;
        return;
      }
      const next = marks().map((row) => [...row]);
      for (let b = 0; b < batchSize; b++, idx++) {
        const cell = order[idx];
        if (!cell) continue;
        const [r, c] = cell;
        next[r][c] = NONOGRAM_PREVIEW_PICTURE[r][c] ? "filled" : "crossed";
      }
      setMarks(next);
    }, 150);

    onCleanup(() => clearInterval(interval));
  });

  const done = createMemo(() => {
    const filled = marks().map((row) => row.map((mark) => mark === "filled"));
    return {
      rows: rowClues.map((clue, r) => sameClue(clue, lineClue(filled[r]))),
      cols: colClues.map((clue, c) => sameClue(clue, lineClue(filled.map((row) => row[c])))),
    };
  });

  const clueStyle = (isDone: boolean) => ({
    color: "var(--color-fg)",
    opacity: isDone ? 0.3 : 0.85,
    "font-size": "calc(var(--frame) * 0.042)",
  });

  return (
    <PreviewFrame>
      <div
        class="grid size-full font-medium tabular-nums leading-none"
        style={{
          "grid-template-columns": "24% repeat(10, 1fr)",
          "grid-template-rows": "24% repeat(10, 1fr)",
        }}
      >
        <div />
        <For each={colClues}>
          {(clue, c) => (
            <div
              class="flex flex-col items-center justify-end pb-[12%]"
              style={{ ...clueStyle(done().cols[c()]), gap: "calc(var(--frame) * 0.008)" }}
            >
              <For each={clue}>{(value) => <span>{value}</span>}</For>
            </div>
          )}
        </For>
        <Index each={marks()}>
          {(row, r) => (
            <>
              <div
                class="flex items-center justify-end pr-[6%]"
                style={{ ...clueStyle(done().rows[r]), gap: "calc(var(--frame) * 0.018)" }}
              >
                <For each={rowClues[r]}>{(value) => <span>{value}</span>}</For>
              </div>
              <Index each={row()}>
                {(mark, c) => (
                  <div
                    data-mark={mark()}
                    class="flex items-center justify-center border-border"
                    style={{
                      "background-color":
                        mark() === "filled" ? "var(--color-fg)" : "var(--color-surface)",
                      "border-right-width": c === SIZE - 1 ? "0" : "1px",
                      "border-bottom-width": r === SIZE - 1 ? "0" : "1px",
                      "border-right-color":
                        c === 4 ? "var(--color-border-strong)" : "var(--color-border)",
                      "border-bottom-color":
                        r === 4 ? "var(--color-border-strong)" : "var(--color-border)",
                      "border-style": "solid",
                      "outline-offset": "-1px",
                    }}
                  >
                    {mark() === "crossed" && (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        class="size-[60%]"
                        fill="none"
                        stroke="var(--color-fg-tertiary)"
                        stroke-width="3"
                        stroke-linecap="round"
                      >
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    )}
                  </div>
                )}
              </Index>
            </>
          )}
        </Index>
      </div>
    </PreviewFrame>
  );
}
