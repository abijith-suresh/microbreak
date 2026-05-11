import { createSignal, type JSX } from "solid-js";

export type PressableVariant = "primary" | "secondary" | "ghost";

interface PressableButtonProps {
  onClick?: () => void;
  variant?: PressableVariant;
  disabled?: boolean;
  class?: string;
  style?: JSX.CSSProperties;
  type?: "button" | "submit" | "reset";
  children?: JSX.Element;
  "aria-label"?: string;
}

const variantStyles: Record<
  PressableVariant,
  {
    base: string;
    transition: string;
  }
> = {
  primary: {
    base: "px-8 py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-hover",
    transition: "background-color 0.2s ease, transform 0.1s ease-out",
  },
  secondary: {
    base: "px-8 py-3 rounded-xl bg-surface border border-border text-fg-secondary font-medium text-sm hover:border-accent hover:text-accent",
    transition:
      "border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease, transform 0.1s ease-out",
  },
  ghost: {
    base: "px-5 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-fg-tertiary hover:border-accent hover:text-accent",
    transition:
      "border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease, transform 0.1s ease-out",
  },
};

/**
 * Reusable pressable button with consistent pointer-press feedback.
 *
 * Handles the 6-event pattern (onPointerDown/Up/Leave/Cancel + transition +
 * scale transform) used across all game pages, so individual components
 * don't need to duplicate it.
 *
 * Supports "primary", "secondary", and "ghost" variants. Pass additional
 * Tailwind classes via `class` to override or extend the variant styles.
 */
export default function PressableButton(props: PressableButtonProps) {
  const [pressed, setPressed] = createSignal(false);

  const variant = (): PressableVariant => props.variant ?? "primary";
  const styles = () => variantStyles[variant()];

  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      type={props.type ?? "button"}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        transition: styles().transition,
        transform: pressed() ? "scale(0.93)" : "",
        ...(props.style as JSX.CSSProperties),
      }}
      class={[styles().base, props.class].filter(Boolean).join(" ")}
      aria-label={props["aria-label"]}
    >
      {props.children}
    </button>
  );
}
