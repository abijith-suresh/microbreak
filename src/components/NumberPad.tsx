import { createSignal, Show } from "solid-js";
import { Pencil } from "@/lib/icons";

interface Props {
  /** Digits 1 to size. */
  size: number;
  onNumber: (num: number) => void;
  onErase: () => void;
  /** Reactive accessor: count of non-conflicted placements per digit */
  placedCounts: () => Record<number, number>;
  /** Shows a Notes toggle beside Erase. While on, digits go in as pencil notes. */
  notes?: { on: boolean; onToggle: () => void };
}

/** Shared transition string — fast press-in, slightly slower release */
const PRESS_TRANSITION =
  "border-color 0.15s ease-out, color 0.15s ease-out, background-color 0.15s ease-out, transform 0.1s ease-out";

export default function NumberPad(props: Props) {
  const numbers = () => Array.from({ length: props.size }, (_, i) => i + 1);

  // ── Press state ────────────────────────────────────────────────────────────
  // A single signal tracks which button is currently pressed (if any): a digit, or a name.
  const [pressed, setPressed] = createSignal<number | string | null>(null);
  const press = (key: number | string) => ({
    onPointerDown: () => setPressed(key),
    onPointerUp: () => setPressed(null),
    onPointerLeave: () => setPressed(null),
    onPointerCancel: () => setPressed(null),
    style: { transition: PRESS_TRANSITION, transform: pressed() === key ? "scale(0.93)" : "" },
  });

  // ── Layout helpers ─────────────────────────────────────────────────────────
  const buttonSize = () => {
    switch (props.size) {
      case 4:
        return "w-14 h-14 text-xl";
      case 5:
        return "w-12 h-12 text-lg";
      case 6:
        return props.notes ? "w-11 h-12 text-lg sm:w-12" : "w-12 h-12 text-lg";
      default:
        return "w-12 h-12 md:w-11 md:h-11 text-lg md:text-base";
    }
  };

  const cols = () => {
    switch (props.size) {
      case 4:
        return "grid-cols-4";
      case 5:
        return "grid-cols-5";
      case 6:
        return "grid-cols-6";
      default:
        return "grid-cols-3 sm:grid-cols-9";
    }
  };

  const isDone = (num: number) => (props.placedCounts()[num] ?? 0) >= props.size;

  return (
    <div class="flex flex-col items-center gap-2">
      <div class={`grid ${cols()} gap-1.5 justify-items-center`}>
        {numbers().map((num) => (
          <button
            type="button"
            onClick={() => props.onNumber(num)}
            disabled={isDone(num)}
            aria-label={props.notes?.on ? `Note ${num}` : undefined}
            {...press(num)}
            class={[
              buttonSize(),
              "relative flex items-center justify-center rounded-lg bg-surface border font-medium",
              props.notes?.on ? "border-accent-subtle" : "border-border",
              isDone(num)
                ? "opacity-35 pointer-events-none text-fg-tertiary"
                : "text-fg hover:border-accent hover:text-accent hover:bg-accent-light",
            ].join(" ")}
          >
            {num}
          </button>
        ))}
      </div>

      <div class="flex gap-2">
        <Show when={props.notes}>
          {(notes) => (
            <button
              type="button"
              aria-pressed={notes().on}
              onClick={() => notes().onToggle()}
              {...press("notes")}
              class={[
                "flex items-center gap-1.5 px-5 py-2 rounded-lg border text-sm font-medium",
                notes().on
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-fg-secondary hover:border-accent hover:text-accent hover:bg-accent-light",
              ].join(" ")}
            >
              <Pencil size={14} strokeWidth={1.75} />
              Notes
            </button>
          )}
        </Show>
        <button
          type="button"
          onClick={() => props.onErase()}
          {...press("erase")}
          class="px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-fg-secondary hover:border-error hover:text-error hover:bg-accent-light"
        >
          Erase
        </button>
      </div>
    </div>
  );
}
