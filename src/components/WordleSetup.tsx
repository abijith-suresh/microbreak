import { createSignal, onCleanup, onMount } from "solid-js";
import ThemeToggle from "./ThemeToggle";
import type { Variant } from "@/lib/wordle";
import { loadStoredJSON, saveStoredJSON } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storageKeys";

interface Props {
  onStart: (variant: Variant) => void;
  loading: boolean;
}

const variants: {
  value: Variant;
  label: string;
  description: string;
  guesses: number;
  time: string;
}[] = [
  { value: 4, label: "4 letters", description: "Quick", guesses: 5, time: "~1 min" },
  { value: 5, label: "5 letters", description: "Classic", guesses: 6, time: "~3 min" },
  { value: 6, label: "6 letters", description: "Deep", guesses: 7, time: "~5 min" },
];

const CARD_TRANSITION =
  "border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, transform 0.1s ease-out";

export default function WordleSetup(props: Props) {
  const [selectedVariant, setSelectedVariant] = createSignal<Variant>(5);

  onMount(() => {
    const stored = loadStoredJSON(
      STORAGE_KEYS.wordlePreferences,
      (value): value is { variant: Variant } => {
        return (
          typeof value === "object" &&
          value !== null &&
          "variant" in value &&
          (value.variant === 4 || value.variant === 5 || value.variant === 6)
        );
      }
    );

    if (stored) setSelectedVariant(stored.variant);
  });
  const [isExiting, setIsExiting] = createSignal(false);
  const [pressedVariant, setPressedVariant] = createSignal<Variant | null>(null);
  const [startPressed, setStartPressed] = createSignal(false);

  let exitTimer: ReturnType<typeof setTimeout> | null = null;
  onCleanup(() => {
    if (exitTimer !== null) clearTimeout(exitTimer);
  });

  function handleStart() {
    if (isExiting() || props.loading) return;

    saveStoredJSON(STORAGE_KEYS.wordlePreferences, { variant: selectedVariant() });

    setIsExiting(true);
    exitTimer = setTimeout(() => {
      exitTimer = null;
      props.onStart(selectedVariant());
    }, 280);
  }

  return (
    <div
      class="flex flex-col min-h-screen"
      style={isExiting() ? { animation: "setupExit 0.28s ease-in forwards" } : undefined}
    >
      {/* Top bar */}
      <div class="flex items-center justify-between px-5 py-4">
        <a
          href="/"
          class="flex items-center gap-2 text-fg-tertiary hover:text-fg transition-colors duration-200"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" class="shrink-0">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="text-sm font-medium hidden sm:inline">Games</span>
        </a>
        <ThemeToggle />
      </div>

      {/* Setup area */}
      <div class="flex-1 flex flex-col items-center justify-center px-6 pb-16 gap-12">
        {/* Header */}
        <div class="text-center space-y-2" style={{ animation: "fadeIn 0.5s ease-out both" }}>
          <h1 class="font-display text-5xl md:text-6xl text-fg italic tracking-tight">Wordle</h1>
          <p class="text-sm text-fg-tertiary tracking-wide">Guess the hidden word</p>
          <div class="mx-auto mt-3 h-px w-12 bg-accent opacity-40" />
        </div>

        {/* Variant selection */}
        <div
          class="w-full max-w-md space-y-8"
          style={{ animation: "fadeIn 0.5s ease-out 0.1s both" }}
        >
          <div class="space-y-3">
            <label class="text-[11px] font-medium text-fg-tertiary uppercase tracking-[0.15em]">
              Word length
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              {variants.map((v) => (
                <button
                  onClick={() => setSelectedVariant(v.value)}
                  onPointerDown={() => setPressedVariant(v.value)}
                  onPointerUp={() => setPressedVariant(null)}
                  onPointerLeave={() => setPressedVariant(null)}
                  onPointerCancel={() => setPressedVariant(null)}
                  style={{
                    transition: CARD_TRANSITION,
                    transform: pressedVariant() === v.value ? "scale(0.93)" : "",
                  }}
                  class={`group flex flex-col items-center gap-1 py-4 px-3 rounded-xl border ${
                    selectedVariant() === v.value
                      ? "border-accent bg-accent-light"
                      : "border-border bg-surface hover:border-border-strong"
                  }`}
                >
                  <span
                    class={`text-lg font-bold leading-none transition-colors duration-200 ${
                      selectedVariant() === v.value ? "text-accent" : "text-fg"
                    }`}
                  >
                    {v.label}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedVariant() === v.value
                        ? "text-accent opacity-80"
                        : "text-fg-tertiary group-hover:text-fg-secondary"
                    }`}
                  >
                    {v.description}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedVariant() === v.value
                        ? "text-accent opacity-50"
                        : "text-fg-tertiary opacity-60"
                    }`}
                  >
                    {v.guesses} guesses · {v.time}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <div style={{ animation: "fadeIn 0.4s ease-out 0.2s both" }}>
          <button
            onClick={handleStart}
            disabled={props.loading}
            onPointerDown={() => setStartPressed(true)}
            onPointerUp={() => setStartPressed(false)}
            onPointerLeave={() => setStartPressed(false)}
            onPointerCancel={() => setStartPressed(false)}
            style={{
              transition: "background-color 0.2s ease, transform 0.1s ease-out",
              transform: startPressed() ? "scale(0.93)" : "",
              opacity: props.loading ? "0.7" : "1",
            }}
            class="px-12 py-3.5 rounded-xl bg-accent text-white font-semibold text-base hover:bg-accent-hover shadow-lg shadow-shadow"
          >
            {props.loading ? "Loading..." : "Start Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
