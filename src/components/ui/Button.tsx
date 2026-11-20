import type { JSX } from "solid-js";

// One control set: two roles, one radius, two heights.
//   primary   the one action a screen is about
//   secondary everything else
// Sizes: md (36px) for bars and menus, lg (44px) for screen actions, icon (36px square).
// Pass layout classes (width, margin) through `class`, never another height or padding.

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "md" | "lg" | "icon";

interface ButtonVariantsProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  class?: string;
}

export function buttonVariants({
  variant = "primary",
  size = "md",
  class: className,
}: ButtonVariantsProps = {}) {
  const base =
    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border font-medium " +
    "active:scale-[0.96] transition duration-100 ease-out " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
    "disabled:pointer-events-none disabled:opacity-50";

  const variants: Record<ButtonVariant, string> = {
    primary: "border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover",
    secondary:
      "border-border bg-surface text-fg-secondary hover:border-accent hover:text-accent aria-expanded:border-accent aria-expanded:text-accent",
  };

  const sizes: Record<ButtonSize, string> = {
    // md and icon are 36px; the ::after box widens their hit area to 44px.
    md: "relative h-9 px-3.5 text-[13px] after:absolute after:-inset-1",
    lg: "h-11 px-5.5 text-sm",
    icon: "relative size-9 after:absolute after:-inset-1",
  };

  return [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");
}

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
  "aria-pressed"?: boolean;
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
      aria-pressed={props["aria-pressed"]}
    >
      {props.children}
    </button>
  );
}
