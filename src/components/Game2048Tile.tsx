import type { JSX } from "solid-js";

interface Props {
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerging: boolean;
  cellSize: number;
  gap: number;
}

function getTileColor(value: number): string {
  if (value <= 2048) return `var(--color-tile-${value})`;
  return "var(--color-tile-super)";
}

function getTextColor(value: number): string {
  return value <= 4 ? "var(--color-tile-text)" : "var(--color-tile-text-light)";
}

function getFontSize(value: number, cellSize: number): string {
  const base = cellSize * 0.45;
  if (value < 100) return `${base}px`;
  if (value < 1000) return `${base * 0.8}px`;
  if (value < 10000) return `${base * 0.65}px`;
  return `${base * 0.55}px`;
}

export default function Game2048Tile(props: Props): JSX.Element {
  const x = () => props.col * (props.cellSize + props.gap) + props.gap;
  const y = () => props.row * (props.cellSize + props.gap) + props.gap;

  // The inner div owns the pop/appear animation (scale only).
  // The outer div owns the positional transform + slide transition.
  // Keeping them on separate elements prevents the animation keyframes from
  // clobbering the translate, which was the root cause of tiles jumping to (0,0).
  const innerAnimationClass = () => {
    if (props.isNew) return "animate-tile-appear-sm";
    if (props.isMerging) return "animate-tile-pop-merge";
    return "";
  };

  return (
    <div
      class="absolute"
      style={{
        width: `${props.cellSize}px`,
        height: `${props.cellSize}px`,
        transform: `translate(${x()}px, ${y()}px)`,
        // New tiles spawn at their target position — no previous position to
        // transition from, so we skip the transition to avoid a flash.
        transition: props.isNew ? "none" : "transform 120ms ease-in-out",
        "z-index": props.isMerging ? 2 : 1,
        "will-change": "transform",
      }}
    >
      <div
        class={
          "w-full h-full flex items-center justify-center rounded-md font-body font-bold select-none" +
          (innerAnimationClass() ? " " + innerAnimationClass() : "")
        }
        style={
          {
            "background-color": getTileColor(props.value),
            color: getTextColor(props.value),
            "font-size": getFontSize(props.value, props.cellSize),
            "--tw-animation-delay": props.isMerging ? "120ms" : undefined,
          } as JSX.CSSProperties & Record<string, string | undefined>
        }
      >
        {props.value}
      </div>
    </div>
  );
}
