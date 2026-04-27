import { For, createSignal, onCleanup, onMount } from "solid-js";
import type { Direction, Tile } from "@/lib/game2048";
import Game2048Tile from "./Game2048Tile";

interface Props {
  tiles: Tile[];
  onMove: (dir: Direction) => void;
}

export default function Game2048Board(props: Props) {
  const GAP = 8;
  const CELLS = 4;

  let containerRef: HTMLDivElement | undefined;
  const [cellSize, setCellSize] = createSignal(80);

  function recalcCellSize() {
    if (!containerRef) return;
    const w = containerRef.clientWidth;
    setCellSize(Math.floor((w - GAP * (CELLS + 1)) / CELLS));
  }

  onMount(() => {
    recalcCellSize();
    window.addEventListener("resize", recalcCellSize);
  });

  onCleanup(() => {
    window.removeEventListener("resize", recalcCellSize);
  });

  // ── Swipe detection ─────────────────────────────────────────────────────

  let touchStartX = 0;
  let touchStartY = 0;
  const MIN_SWIPE = 30;

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < MIN_SWIPE) return;

    let dir: Direction;
    if (absDx > absDy) {
      dir = dx > 0 ? "right" : "left";
    } else {
      dir = dy > 0 ? "down" : "up";
    }

    props.onMove(dir);
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const boardWidth = () => GAP * (CELLS + 1) + cellSize() * CELLS;

  return (
    <div
      ref={(el) => {
        containerRef = el;
        // Attach touch handlers
        el.addEventListener("touchstart", handleTouchStart, { passive: true });
        el.addEventListener("touchend", handleTouchEnd, { passive: true });
      }}
      class="relative select-none touch-none"
      style={{
        width: `${boardWidth()}px`,
        height: `${boardWidth()}px`,
      }}
    >
      {/* Background grid of empty cells */}
      <div
        class="absolute inset-0 rounded-lg bg-surface border border-border overflow-hidden"
        style={{ padding: `${GAP}px` }}
      >
        <div
          class="grid"
          style={{
            "grid-template-columns": `repeat(${CELLS}, 1fr)`,
            gap: `${GAP}px`,
          }}
        >
          {Array.from({ length: CELLS * CELLS }, () => (
            <div
              class="rounded-md"
              style={{
                "aspect-ratio": "1",
                "background-color": "var(--color-surface-hover)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Animated tiles layer */}
      <For each={props.tiles}>
        {(tile) => (
          <Game2048Tile
            value={tile.value}
            row={tile.row}
            col={tile.col}
            isNew={tile.isNew}
            isMerging={tile.isMerging}
            cellSize={cellSize()}
            gap={GAP}
          />
        )}
      </For>
    </div>
  );
}
