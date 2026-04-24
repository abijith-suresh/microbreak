import { createSignal, onMount } from "solid-js";

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
      {/* Sun icon */}
      <svg
        class="absolute h-[18px] w-[18px] transition-all duration-300"
        style={{
          opacity: current() === "light" ? 1 : 0,
          transform: current() === "light" ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.5)",
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      {/* Moon icon */}
      <svg
        class="absolute h-[18px] w-[18px] transition-all duration-300"
        style={{
          opacity: current() === "dark" ? 1 : 0,
          transform: current() === "dark" ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
