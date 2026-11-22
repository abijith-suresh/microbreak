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

/** A non-interactive pill in the accent tone, e.g. "New personal best". */
export function Tag(props: { class?: string; children: JSX.Element }) {
  return (
    <span
      class={[
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full border border-accent-subtle bg-accent-light px-2.5 text-xs font-medium text-accent",
        props.class,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {props.children}
    </span>
  );
}
