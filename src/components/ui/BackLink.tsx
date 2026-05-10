import { createSignal } from "solid-js";

interface BackLinkProps {
  /** Label text next to the chevron icon (e.g. "Games", "Setup"). */
  label: string;
  /** When provided, renders an <a href={href}>. Mutually exclusive with onClick. */
  href?: string;
  /** When provided, renders a <button onClick={onClick}>. Mutually exclusive with href. */
  onClick?: () => void;
}

/**
 * Inline back-navigation control used in top bars and setup screens.
 *
 * - `href` mode:  renders an `<a>` element for page navigation.
 * - `onClick` mode: renders a `<button>` element with press-feedback animation.
 *
 * Visual output and press behaviour match the patterns previously duplicated
 * across every game app and setup screen.
 */
export default function BackLink(props: BackLinkProps) {
  const [pressed, setPressed] = createSignal(false);

  const icon = (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" class="shrink-0">
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );

  const label = <span class="text-sm font-medium hidden sm:inline">{props.label}</span>;

  const commonClasses = "flex items-center gap-1.5 text-fg-tertiary hover:text-fg";

  if (props.href !== undefined) {
    return (
      <a href={props.href} class={`${commonClasses} transition-colors duration-200`}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <button
      onClick={props.onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        transition: "color 0.2s ease, transform 0.1s ease-out",
        transform: pressed() ? "scale(0.93)" : "",
      }}
      class={commonClasses}
      aria-label={`Return to ${props.label.toLowerCase()}`}
    >
      {icon}
      {label}
    </button>
  );
}
