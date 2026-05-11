import { Show } from "solid-js";
import { gameIcons } from "@/data/previewGrids";

export function GameIcon(props: { name: string }) {
  const path = () => gameIcons[props.name];
  return (
    <Show when={path()}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-fg-tertiary"
      >
        <path d={path()} />
      </svg>
    </Show>
  );
}
