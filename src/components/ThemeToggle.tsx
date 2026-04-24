import { createSignal, onMount } from "solid-js";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "microbreak-theme";

const icons: Record<Theme, string> = {
  light: "☀",
  dark: "☾",
  system: "◈",
};

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute("data-theme", resolved);
}

export default function ThemeToggle() {
  const [current, setCurrent] = createSignal<Theme>("system");

  onMount(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const theme = stored || "system";
    setCurrent(theme);
    applyTheme(theme);
  });

  function cycleTheme() {
    const order: Theme[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(current()) + 1) % order.length];
    localStorage.setItem(STORAGE_KEY, next);
    setCurrent(next);
    applyTheme(next);
  }

  return (
    <button
      data-theme-toggle
      onClick={cycleTheme}
      class="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] hover:shadow-sm"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span class="text-base leading-none">{icons[current()]}</span>
    </button>
  );
}
