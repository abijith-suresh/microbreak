import type { JSX } from "solid-js";

/**
 * Fills its card's thumbnail frame (a size container) with a square board. Cells size their
 * text from --frame, the board's width.
 */
export function PreviewFrame(props: { children: JSX.Element }) {
  return (
    <div class="aspect-square" style={{ "--frame": "min(66cqw, 86cqh)", width: "var(--frame)" }}>
      {props.children}
    </div>
  );
}
