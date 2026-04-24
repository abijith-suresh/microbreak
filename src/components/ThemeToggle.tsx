import { onMount } from "solid-js";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "microbreak-theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
}

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
  let theme: Theme = "system";

  onMount(() => {
    theme = getStoredTheme();
    applyTheme(theme);
  });

  function cycleTheme() {
    const order: Theme[] = ["light", "dark", "system"];
    const current = getStoredTheme();
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length];

    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    theme = next;

    // Force re-render by toggling a class briefly
    const el = document.querySelector("[data-theme-toggle]");
    el?.setAttribute("data-current", next);
  }

  const labels: Record<Theme, string> = {
    light: "☀",
    dark: "☾",
    system: "◈",
  };

  return (
    <button
      data-theme-toggle
      onClick={cycleTheme}
      class="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] hover:shadow-sm"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span class="text-base leading-none" id="theme-icon">
        {labels[getStoredTheme()]}
      </span>
    </button>
  );
}
