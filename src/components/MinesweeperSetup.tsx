import { createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { Difficulty } from "@/lib/minesweeper";
import { getDifficultyPreset } from "@/lib/minesweeper";
import { loadStoredString, saveStoredString } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import ThemeToggle from "./ThemeToggle";
import BackLink from "./ui/BackLink";

interface Props {
  onStart: (difficulty: Difficulty, isMobile: boolean) => void;
}

const DIFFICULTY_VALUES: Difficulty[] = ["beginner", "intermediate", "expert"];

const CARD_TRANSITION =
  "border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, transform 0.1s ease-out";

export default function MinesweeperSetup(props: Props) {
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<Difficulty>("beginner");

  // ── Reactive mobile detection ──────────────────────────────────────────────
  const [isMobile, setIsMobile] = createSignal(false);

  onMount(() => {
    setSelectedDifficulty(
      loadStoredString(
        STORAGE_KEYS.minesweeperPreferences,
        ["beginner", "intermediate", "expert"] as const,
        "beginner"
      )
    );

    const mql = window.matchMedia("(max-width: 480px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    onCleanup(() => mql.removeEventListener("change", handler));
  });

  // ── Reactive difficulty cards data ─────────────────────────────────────────
  const difficulties = createMemo(() =>
    DIFFICULTY_VALUES.map((value) => {
      const preset = getDifficultyPreset(value, isMobile());
      return {
        value,
        label: preset.label,
        description: preset.description,
        time: preset.time,
      };
    })
  );

  // ── Exit animation ─────────────────────────────────────────────────────────
  const [isExiting, setIsExiting] = createSignal(false);
  let exitTimer: ReturnType<typeof setTimeout> | null = null;

  onCleanup(() => {
    if (exitTimer !== null) clearTimeout(exitTimer);
  });

  function handleStart() {
    if (isExiting()) return;

    saveStoredString(STORAGE_KEYS.minesweeperPreferences, selectedDifficulty());

    setIsExiting(true);
    exitTimer = setTimeout(() => {
      exitTimer = null;
      props.onStart(selectedDifficulty(), isMobile());
    }, 280);
  }

  // ── Press feedback signals ─────────────────────────────────────────────────
  const [pressedDiff, setPressedDiff] = createSignal<Difficulty | null>(null);
  const [startPressed, setStartPressed] = createSignal(false);

  return (
    <div
      class="flex flex-col min-h-screen"
      style={isExiting() ? { animation: "setupExit 0.28s ease-in forwards" } : undefined}
    >
      {/* Top bar */}
      <div class="flex items-center justify-between px-5 py-4">
        <BackLink label="Games" href="/" />
        <ThemeToggle />
      </div>

      {/* Setup area */}
      <div class="flex-1 flex flex-col items-center justify-center px-6 pb-16 gap-12">
        {/* Header */}
        <div class="text-center space-y-2" style={{ animation: "fadeIn 0.5s ease-out both" }}>
          <h1 class="font-display text-5xl md:text-6xl text-fg italic tracking-tight">
            Minesweeper
          </h1>
          <p class="text-sm text-fg-tertiary tracking-wide">Choose your challenge</p>
          <div class="mx-auto mt-3 h-px w-12 bg-accent opacity-40" />
        </div>

        {/* Difficulty selection */}
        <div
          class="w-full max-w-md space-y-8"
          style={{ animation: "fadeIn 0.5s ease-out 0.1s both" }}
        >
          <div class="space-y-3">
            <label class="text-[11px] font-medium text-fg-tertiary uppercase tracking-[0.15em]">
              Difficulty
            </label>
            <div class="grid grid-cols-3 gap-2.5">
              {difficulties().map((d) => (
                <button
                  onClick={() => setSelectedDifficulty(d.value)}
                  onPointerDown={() => setPressedDiff(d.value)}
                  onPointerUp={() => setPressedDiff(null)}
                  onPointerLeave={() => setPressedDiff(null)}
                  onPointerCancel={() => setPressedDiff(null)}
                  style={{
                    transition: CARD_TRANSITION,
                    transform: pressedDiff() === d.value ? "scale(0.93)" : "",
                  }}
                  class={`group flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border ${
                    selectedDifficulty() === d.value
                      ? "border-accent bg-accent-light"
                      : "border-border bg-surface hover:border-border-strong"
                  }`}
                >
                  <span
                    class={`text-lg font-bold leading-none transition-colors duration-200 ${
                      selectedDifficulty() === d.value ? "text-accent" : "text-fg"
                    }`}
                  >
                    {d.label}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedDifficulty() === d.value
                        ? "text-accent opacity-80"
                        : "text-fg-tertiary group-hover:text-fg-secondary"
                    }`}
                  >
                    {d.description}
                  </span>
                  <span
                    class={`text-[10px] leading-tight transition-colors duration-200 ${
                      selectedDifficulty() === d.value
                        ? "text-accent opacity-50"
                        : "text-fg-tertiary opacity-60"
                    }`}
                  >
                    {d.time}
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
            onPointerDown={() => setStartPressed(true)}
            onPointerUp={() => setStartPressed(false)}
            onPointerLeave={() => setStartPressed(false)}
            onPointerCancel={() => setStartPressed(false)}
            style={{
              transition: "background-color 0.2s ease, transform 0.1s ease-out",
              transform: startPressed() ? "scale(0.93)" : "",
            }}
            class="px-12 py-3.5 rounded-xl bg-accent text-white font-semibold text-base hover:bg-accent-hover shadow-lg shadow-shadow"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
