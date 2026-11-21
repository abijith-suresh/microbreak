import { For, type JSX, Match, Switch } from "solid-js";
import type { MinesweeperThumb, SudokuThumb, Thumb, WordleThumb } from "@/lib/cardState";
import { getBoxDims } from "@/lib/sudoku";

/**
 * A board drawn small inside a card's thumbnail frame. The frame is a size container, so
 * the board fits it at any shape (a 4×4 Sudoku or a 30×16 Minesweeper) without moving
 * anything around it.
 */
function boardStyle(cols: number, rows: number, fill = 0.84): JSX.CSSProperties {
  const width = `min(92cqw, ${fill * 100}cqh * ${cols / rows})`;
  return {
    width,
    "aspect-ratio": `${cols} / ${rows}`,
    "font-size": `calc(${width} / ${cols} * 0.55)`,
  };
}

function SudokuBoard(props: { thumb: SudokuThumb }) {
  const size = () => props.thumb.size;
  const box = () => getBoxDims(size());
  return (
    <div
      class="grid overflow-hidden rounded-[3px] border-[1.5px] border-border-strong bg-surface"
      style={{ ...boardStyle(size(), size()), "grid-template-columns": `repeat(${size()}, 1fr)` }}
    >
      <For each={props.thumb.cells}>
        {(cell, i) => {
          const r = Math.floor(i() / size());
          const c = i() % size();
          const right = c < size() - 1 && (c + 1) % box()[1] === 0;
          const bottom = r < size() - 1 && (r + 1) % box()[0] === 0;
          return (
            <div
              class={`flex items-center justify-center leading-none border-border ${
                c < size() - 1 ? "border-r" : ""
              } ${r < size() - 1 ? "border-b" : ""} ${
                cell.given ? "font-bold text-fg" : "font-medium text-accent"
              }`}
              style={{
                ...(right && { "border-right": "1.5px solid var(--color-border-strong)" }),
                ...(bottom && { "border-bottom": "1.5px solid var(--color-border-strong)" }),
              }}
            >
              {cell.value ?? ""}
            </div>
          );
        }}
      </For>
    </div>
  );
}

const WORDLE_TILE: Record<string, string> = {
  correct: "bg-wl-correct text-wl-correct-text border-transparent",
  present: "bg-wl-present text-wl-present-text border-transparent",
  absent: "bg-wl-absent text-wl-absent-text border-transparent",
};

function WordleBoard(props: { thumb: WordleThumb }) {
  const cols = () => props.thumb.length;
  const rows = () => props.thumb.rows.length;
  return (
    <div
      class="grid gap-[4%]"
      style={{ ...boardStyle(cols(), rows()), "grid-template-rows": `repeat(${rows()}, 1fr)` }}
    >
      <For each={props.thumb.rows}>
        {(row) => (
          <div class="grid gap-[4%]" style={{ "grid-template-columns": `repeat(${cols()}, 1fr)` }}>
            <For each={row}>
              {(tile) => (
                <div
                  class={`flex items-center justify-center rounded-[3px] border font-bold uppercase leading-none ${
                    tile.state ? WORDLE_TILE[tile.state] : "border-border bg-surface text-fg"
                  }`}
                >
                  {tile.letter}
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}

function MinesweeperBoard(props: { thumb: MinesweeperThumb }) {
  return (
    <div
      class="grid overflow-hidden rounded-[3px] border-[1.5px] border-border-strong"
      style={{
        ...boardStyle(props.thumb.cols, props.thumb.rows),
        "grid-template-columns": `repeat(${props.thumb.cols}, 1fr)`,
      }}
    >
      <For each={props.thumb.cells}>
        {(cell) => (
          <Switch>
            <Match when={cell.kind === "open" && cell}>
              {(open) => (
                <div
                  class="flex items-center justify-center border-r border-b border-border bg-bg font-bold leading-none"
                  style={{ color: `var(--color-ms-${open().count})` }}
                >
                  {open().count || ""}
                </div>
              )}
            </Match>
            <Match when={cell.kind === "flag"}>
              <div class="flex items-center justify-center border-r border-b border-border bg-surface text-accent">
                <svg viewBox="0 0 24 24" class="size-[62%]" aria-hidden="true">
                  <path
                    d="M6 3v18"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                  />
                  <path d="M7 3.5h12l-3 4.5 3 4.5H7z" fill="currentColor" />
                </svg>
              </div>
            </Match>
            <Match when={cell.kind === "mine" && cell}>
              {(mine) => (
                <div
                  class={`flex items-center justify-center border-r border-b border-border ${
                    mine().hit ? "bg-error" : "bg-bg"
                  }`}
                >
                  <span
                    class={`size-[45%] rounded-full ${mine().hit ? "bg-white" : "bg-fg-secondary"}`}
                  />
                </div>
              )}
            </Match>
            <Match when={cell.kind === "hidden"}>
              <div class="border-r border-b border-border bg-surface" />
            </Match>
          </Switch>
        )}
      </For>
    </div>
  );
}

export default function GameCardThumb(props: { thumb: Thumb }) {
  return (
    <Switch>
      <Match when={props.thumb.kind === "sudoku" && (props.thumb as SudokuThumb)}>
        {(thumb) => <SudokuBoard thumb={thumb()} />}
      </Match>
      <Match when={props.thumb.kind === "wordle" && (props.thumb as WordleThumb)}>
        {(thumb) => <WordleBoard thumb={thumb()} />}
      </Match>
      <Match when={props.thumb.kind === "minesweeper" && (props.thumb as MinesweeperThumb)}>
        {(thumb) => <MinesweeperBoard thumb={thumb()} />}
      </Match>
    </Switch>
  );
}
