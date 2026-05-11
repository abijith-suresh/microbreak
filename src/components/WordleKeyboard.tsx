import { For } from "solid-js";
import type { LetterState } from "@/lib/wordle";

interface Props {
  keyboardState: Record<string, LetterState>;
  onType: (letter: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
}

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["Enter", "z", "x", "c", "v", "b", "n", "m", "Backspace"],
];

const stateStyles: Record<string, { bg: string; text: string }> = {
  correct: { bg: "var(--color-wl-correct)", text: "var(--color-wl-correct-text)" },
  present: { bg: "var(--color-wl-present)", text: "var(--color-wl-present-text)" },
  absent: { bg: "var(--color-wl-absent)", text: "var(--color-wl-absent-text)" },
};

export default function WordleKeyboard(props: Props) {
  function handleKey(key: string) {
    if (key === "Enter") {
      props.onSubmit();
    } else if (key === "Backspace") {
      props.onDelete();
    } else {
      props.onType(key);
    }
  }

  return (
    <div class="flex flex-col items-center gap-1.5 w-full max-w-keyboard">
      <For each={KEYBOARD_ROWS}>
        {(row) => (
          <div class="flex gap-1 sm:gap-1.5 w-full justify-center">
            <For each={row}>
              {(key) => {
                const isSpecial = key === "Enter" || key === "Backspace";
                const letterState = () => (!isSpecial ? props.keyboardState[key] : undefined);
                const s = () => (letterState() ? stateStyles[letterState()!] : null);

                return (
                  <button
                    onClick={() => handleKey(key)}
                    class="flex items-center justify-center rounded-md font-bold uppercase select-none transition-colors duration-150"
                    style={{
                      "background-color": s()?.bg ?? "var(--color-surface)",
                      color: s()?.text ?? "var(--color-wl-key-text)",
                      "min-width": isSpecial ? "52px" : "28px",
                      height: "48px",
                      flex: isSpecial ? "1.5" : "1",
                      "font-size": isSpecial ? "0.65rem" : "0.8rem",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {key === "Backspace" ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
                        <line x1="18" y1="9" x2="12" y2="15" />
                        <line x1="12" y1="9" x2="18" y2="15" />
                      </svg>
                    ) : key === "Enter" ? (
                      "Enter"
                    ) : (
                      key
                    )}
                  </button>
                );
              }}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
