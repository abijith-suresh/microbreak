import { ChevronLeft } from "@/lib/icons";

interface BackLinkProps {
  /** Label text next to the chevron icon (e.g. "Games", "Setup"). */
  label: string;
  /** When provided, renders an <a href={href}>. Mutually exclusive with onClick. */
  href?: string;
  /** When provided, renders a <button onClick={onClick}>. Mutually exclusive with href. */
  onClick?: () => void;
}

/**
 * Back-navigation control used in top bars and setup screens.
 *
 * - `href` mode:  renders an `<a>` element for page navigation.
 * - `onClick` mode: renders a `<button>` element with press-feedback animation.
 *
 * Visual output and press behaviour match the patterns previously duplicated
 * across every game app and setup screen.
 */
export default function BackLink(props: BackLinkProps) {
  const icon = <ChevronLeft size={18} strokeWidth={1.5} class="shrink-0" />;

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
      class={`${commonClasses} active:scale-[0.93] transition duration-100 ease-out`}
      aria-label={`Return to ${props.label.toLowerCase()}`}
    >
      {icon}
      {label}
    </button>
  );
}
