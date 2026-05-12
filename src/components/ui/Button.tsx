import type { JSX } from "solid-js";

// ── Types ──────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonVariantsProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  class?: string;
}

// ── buttonVariants ──────────────────────────────────────────
// Standalone function so any element can use the same styling.
// Follows the shadcn/ui pattern of separating variant definition
// from the component shell.

export function buttonVariants({
  variant = "primary",
  size = "md",
  class: className,
}: ButtonVariantsProps = {}) {
  const base = [
    // Layout
    "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap",
    // Press feedback via CSS — no JS signals needed
    "active:scale-[0.93] transition duration-100 ease-out",
    // Focus ring
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    // Disabled state
    "disabled:pointer-events-none disabled:opacity-50",
  ];

  const variants: Record<ButtonVariant, string> = {
    primary: "rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover",
    secondary:
      "rounded-xl bg-surface border border-border text-fg-secondary font-medium text-sm hover:border-accent hover:text-accent",
    ghost:
      "rounded-lg bg-surface border border-border text-sm font-medium text-fg-tertiary hover:border-accent hover:text-accent",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "px-4 py-2 text-xs",
    md: "px-8 py-3 text-sm",
    lg: "px-10 py-4 text-base",
  };

  return [base.join(" "), variants[variant], sizes[size], className].filter(Boolean).join(" ");
}

// ── Button ──────────────────────────────────────────────────
// Thin component for the common case. Use `buttonVariants()`
// directly when you need a different element (e.g. <a>).

interface ButtonProps {
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  class?: string;
  style?: JSX.CSSProperties;
  type?: "button" | "submit" | "reset";
  children?: JSX.Element;
  "aria-label"?: string;
}

export default function Button(props: ButtonProps) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      type={props.type ?? "button"}
      class={buttonVariants({
        variant: props.variant,
        size: props.size,
        class: props.class,
      })}
      style={props.style}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </button>
  );
}
