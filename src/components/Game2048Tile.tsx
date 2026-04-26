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

  const animation = () => {
    if (props.isNew) return "tileAppear 150ms ease-out both";
    if (props.isMerging) return "tilePop 200ms ease-out both";
    return "none";
  };

  return (
    <div
      class="absolute flex items-center justify-center rounded-md font-body font-bold select-none"
      style={{
        width: `${props.cellSize}px`,
        height: `${props.cellSize}px`,
        "background-color": getTileColor(props.value),
        color: getTextColor(props.value),
        "font-size": getFontSize(props.value, props.cellSize),
        transform: `translate(${x()}px, ${y()}px)`,
        transition: props.isNew || props.isMerging ? "none" : "transform 120ms ease-in-out",
        animation: animation(),
        "z-index": props.isMerging ? 2 : 1,
        "will-change": "transform",
      }}
    >
      {props.value}
    </div>
  );
}
