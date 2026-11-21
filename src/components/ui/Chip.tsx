import type { JSX } from "solid-js";

// The one chip: a pill. `Chip` toggles a choice; `Tag` labels a state with the same shape.

interface ChipProps {
  pressed: boolean;
  onClick: () => void;
  class?: string;
  children: JSX.Element;
}

export function Chip(props: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={props.pressed}
      onClick={() => props.onClick()}
      class={[
        "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium",
        "transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        props.pressed
          ? "border-accent bg-accent-light text-accent"
          : "border-border bg-surface text-fg-secondary hover:border-border-strong hover:text-fg",
        props.class,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {props.children}
    </button>
  );
}

export type TagTone = "neutral" | "accent" | "success";

const TAG_TONES: Record<TagTone, string> = {
  neutral: "border-border bg-surface text-fg-secondary",
  accent: "border-accent-subtle bg-accent-light text-accent",
  success:
    "border-[color-mix(in_srgb,var(--color-success)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-success",
};

export function Tag(props: { tone?: TagTone; class?: string; children: JSX.Element }) {
  return (
    <span
      class={[
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 text-xs font-medium",
        TAG_TONES[props.tone ?? "neutral"],
        props.class,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {props.children}
    </span>
  );
}
