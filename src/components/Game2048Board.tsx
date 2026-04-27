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

  // ── Swipe / drag detection (pointer events: unified mouse + touch) ──────
  //
  // Using PointerEvents instead of TouchEvents means the same swipe code works
  // for a mouse drag on desktop AND a finger swipe on mobile (including Safari).
  // We also attach a non-passive touchmove listener so we can call
  // preventDefault() and stop iOS Safari from scrolling the page during a swipe.

  let pStartX = 0;
  let pStartY = 0;
  let pActive = false;
  const MIN_SWIPE = 30;

  function handlePointerDown(e: PointerEvent) {
    // Only track the primary pointer (first finger, or left mouse button).
    if (!e.isPrimary) return;
    pStartX = e.clientX;
    pStartY = e.clientY;
    pActive = true;
  }

  function handlePointerUp(e: PointerEvent) {
    if (!e.isPrimary || !pActive) return;
    pActive = false;

    const dx = e.clientX - pStartX;
    const dy = e.clientY - pStartY;
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

  function handlePointerCancel(e: PointerEvent) {
    if (!e.isPrimary) return;
    pActive = false;
  }

  // Non-passive: lets us call preventDefault() to block iOS Safari page scroll
  // while the user is swiping on the board.
  function handleTouchMove(e: TouchEvent) {
    e.preventDefault();
  }

  onMount(() => {
    recalcCellSize();
    window.addEventListener("resize", recalcCellSize);
    if (containerRef) {
      containerRef.addEventListener("pointerdown", handlePointerDown);
      containerRef.addEventListener("pointerup", handlePointerUp);
      containerRef.addEventListener("pointercancel", handlePointerCancel);
      containerRef.addEventListener("touchmove", handleTouchMove, { passive: false });
    }
  });

  onCleanup(() => {
    window.removeEventListener("resize", recalcCellSize);
    if (containerRef) {
      containerRef.removeEventListener("pointerdown", handlePointerDown);
      containerRef.removeEventListener("pointerup", handlePointerUp);
      containerRef.removeEventListener("pointercancel", handlePointerCancel);
      containerRef.removeEventListener("touchmove", handleTouchMove);
    }
  });

  // ── Render ──────────────────────────────────────────────────────────────

  const boardWidth = () => GAP * (CELLS + 1) + cellSize() * CELLS;

  return (
    <div
      ref={(el) => {
        containerRef = el;
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
