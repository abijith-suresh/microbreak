import { createSignal, onCleanup, onMount } from "solid-js";
import ThemeToggle from "./ThemeToggle";
import BackLink from "./ui/BackLink";
import type { Variant } from "@/lib/wordle";
import { loadStoredJSON, saveStoredJSON } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import Button from "./ui/Button";

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
      class={
        "flex flex-col min-h-screen" +
        (isExiting()
          ? " animate-out fade-out slide-out-to-top-3.5 duration-300 ease-in fill-mode-forwards"
          : "")
      }
    >
      {/* Top bar */}
      <div class="flex items-center justify-between px-5 py-4">
        <BackLink label="Games" href="/" />
        <ThemeToggle />
      </div>

      {/* Setup area */}
      <div class="flex-1 flex flex-col items-center justify-center px-6 pb-16 gap-12">
        {/* Header */}
        <div
          class="text-center space-y-2"
          class="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
        >
          <h1 class="font-display text-5xl md:text-6xl text-fg italic tracking-tight">Wordle</h1>
          <p class="text-sm text-fg-tertiary tracking-wide">Guess the hidden word</p>
          <div class="mx-auto mt-3 h-px w-12 bg-accent opacity-40" />
        </div>

        {/* Variant selection */}
        <div
          class="w-full max-w-md space-y-8"
          class="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both"
        >
          <div class="space-y-3">
            <label class="text-xs font-medium text-fg-tertiary uppercase tracking-widest">
              Word length
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              {variants.map((v) => (
                <Button
                  variant="ghost"
                  class={`group flex flex-col items-center gap-1 py-4 px-3 rounded-xl border ${
                    selectedVariant() === v.value
                      ? "border-accent bg-accent-light"
                      : "border-border bg-surface hover:border-border-strong"
                  }`}
                  onClick={() => setSelectedVariant(v.value)}
                >
                  <span
                    class={`text-lg font-bold leading-none transition-colors duration-200 ${
                      selectedVariant() === v.value ? "text-accent" : "text-fg"
                    }`}
                  >
                    {v.label}
                  </span>
                  <span
                    class={`text-xs leading-tight transition-colors duration-200 ${
                      selectedVariant() === v.value
                        ? "text-accent opacity-80"
                        : "text-fg-tertiary group-hover:text-fg-secondary"
                    }`}
                  >
                    {v.description}
                  </span>
                  <span
                    class={`text-xs leading-tight transition-colors duration-200 ${
                      selectedVariant() === v.value
                        ? "text-accent opacity-50"
                        : "text-fg-tertiary opacity-60"
                    }`}
                  >
                    {v.guesses} guesses · {v.time}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <div class="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
          <Button
            class="px-12 py-3.5 font-semibold text-base shadow-lg shadow-shadow"
            onClick={handleStart}
            disabled={props.loading}
            style={{ opacity: props.loading ? "0.7" : "1" }}
          >
            {props.loading ? "Loading..." : "Start Game"}
          </Button>
        </div>
      </div>
    </div>
  );
}
