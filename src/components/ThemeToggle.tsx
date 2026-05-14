import { createSignal, onMount } from "solid-js";
import { Sun, Moon } from "@/lib/icons";

const STORAGE_KEY = "microbreak-theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
}

export function initTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
  const theme = stored || getSystemTheme();
  applyTheme(theme);
  return theme;
}

export default function ThemeToggle() {
  const [current, setCurrent] = createSignal<"light" | "dark">("light");

  onMount(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null;
    const theme = stored || getSystemTheme();
    setCurrent(theme);
    applyTheme(theme);
  });

  function toggle() {
    const next = current() === "light" ? "dark" : "light";
    localStorage.setItem(STORAGE_KEY, next);
    setCurrent(next);
    applyTheme(next);
  }

  return (
    <button
      data-theme-toggle
      onClick={toggle}
      class="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-secondary transition-all hover:border-border-strong hover:text-fg hover:shadow-sm"
      aria-label={`Switch to ${current() === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${current() === "light" ? "dark" : "light"} mode`}
    >
      <Sun
        class="absolute size-4.5 transition-all duration-300"
        style={{
          opacity: current() === "light" ? 1 : 0,
          transform: current() === "light" ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.5)",
        }}
        size={18}
        strokeWidth={1.5}
      />
      <Moon
        class="absolute size-4.5 transition-all duration-300"
        style={{
          opacity: current() === "dark" ? 1 : 0,
          transform: current() === "dark" ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
        }}
        size={18}
        strokeWidth={1.5}
      />
    </button>
  );
}
