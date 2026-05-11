import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { STATIC_2048_TILES } from "@/data/previewGrids";
import { PreviewFrame } from "./PreviewFrame";

const tileColors: Record<number, string> = {
  2: "var(--color-tile-2)",
  4: "var(--color-tile-4)",
  8: "var(--color-tile-8)",
  16: "var(--color-tile-16)",
  32: "var(--color-tile-32)",
  64: "var(--color-tile-64)",
  128: "var(--color-tile-128)",
  256: "var(--color-tile-256)",
  512: "var(--color-tile-512)",
  1024: "var(--color-tile-1024)",
  2048: "var(--color-tile-2048)",
};

export function Mini2048Grid(props: { animated: boolean }) {
  const [tiles, setTiles] =
    createSignal<{ value: number; row: number; col: number; id: number }[]>(STATIC_2048_TILES);

  createEffect(() => {
    if (!props.animated) {
      setTiles(STATIC_2048_TILES);
      return;
    }

    const values = [2, 4, 8, 16, 32, 64, 128, 256];
    let nextId = 0;

    const initial: typeof STATIC_2048_TILES = [];
    for (let i = 0; i < 5; i++) {
      initial.push({
        value: values[Math.floor(Math.random() * values.length)],
        row: Math.floor(Math.random() * 4),
        col: Math.floor(Math.random() * 4),
        id: nextId++,
      });
    }
    setTiles(initial);

    const interval = setInterval(() => {
      setTiles((prev) => {
        const next = [...prev];
        if (next.length > 0) {
          next.splice(Math.floor(Math.random() * next.length), 1);
        }
        next.push({
          value: values[Math.floor(Math.random() * values.length)],
          row: Math.floor(Math.random() * 4),
          col: Math.floor(Math.random() * 4),
          id: nextId++,
        });
        return next;
      });
    }, 500);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <PreviewFrame>
      <div class="aspect-square w-full p-2">
        <div class="grid h-full w-full grid-cols-4 grid-rows-4 gap-1">
          <For each={Array.from({ length: 16 })}>
            {(_, idx) => {
              const row = Math.floor(idx() / 4);
              const col = idx() % 4;
              const tile = () => tiles().find((entry) => entry.row === row && entry.col === col);
              return (
                <div class="flex items-center justify-center rounded-sm bg-surface-hover">
                  <Show when={tile()}>
                    {(entry) => (
                      <div
                        class={
                          "flex h-full w-full items-center justify-center rounded-sm text-micro font-bold" +
                          (props.animated ? " animate-tile-appear" : "")
                        }
                        style={{
                          "background-color":
                            tileColors[entry().value] || "var(--color-tile-super)",
                          color:
                            entry().value <= 4
                              ? "var(--color-tile-text)"
                              : "var(--color-tile-text-light)",
                        }}
                      >
                        {entry().value}
                      </div>
                    )}
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </PreviewFrame>
  );
}
