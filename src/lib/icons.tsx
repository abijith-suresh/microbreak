/**
 * Local Lucide icon wrappers for Solid components.
 *
 * Lucide icon paths extracted from lucide-solid v1.14.0 (ISC license).
 * Using a local module instead of the npm package avoids SSR compatibility
 * issues with Astro's static prerender (lucide-solid eagerly calls client-only
 * solid-js/web APIs at module level).
 *
 * Only the icons used in this project are included — tree-shaking by design.
 *
 * License: ISC (same as Lucide)
 * @see https://lucide.dev
 */

import { type JSX } from "solid-js";

type IconProps = {
  size?: number;
  strokeWidth?: number;
  class?: string;
  style?: JSX.CSSProperties | string;
  fill?: string;
} & JSX.SvgSVGAttributes<SVGSVGElement>;

// ── ChevronLeft ────────────────────────────────────────────────────────────

export function ChevronLeft(props: IconProps) {
  const size = () => props.size ?? 24;
  const sw = () => props.strokeWidth ?? 2;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill={props.fill ?? "none"}
      stroke="currentColor"
      stroke-width={sw()}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

// ── Sun ────────────────────────────────────────────────────────────────────

export function Sun(props: IconProps) {
  const size = () => props.size ?? 24;
  const sw = () => props.strokeWidth ?? 2;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill={props.fill ?? "none"}
      stroke="currentColor"
      stroke-width={sw()}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      style={props.style}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

// ── Moon ───────────────────────────────────────────────────────────────────

export function Moon(props: IconProps) {
  const size = () => props.size ?? 24;
  const sw = () => props.strokeWidth ?? 2;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill={props.fill ?? "none"}
      stroke="currentColor"
      stroke-width={sw()}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class}
      style={props.style}
      aria-hidden="true"
    >
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  );
}

// ── Delete (backspace) ─────────────────────────────────────────────────────

export function Delete(props: IconProps) {
  const size = () => props.size ?? 24;
  const sw = () => props.strokeWidth ?? 2;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill={props.fill ?? "none"}
      stroke="currentColor"
      stroke-width={sw()}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
      <path d="m12 9 6 6" />
      <path d="m18 9-6 6" />
    </svg>
  );
}

// ── Circle ─────────────────────────────────────────────────────────────────

export function Circle(props: IconProps) {
  const size = () => props.size ?? 24;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size()}
      height={size()}
      viewBox="0 0 24 24"
      fill={props.fill ?? "none"}
      stroke="currentColor"
      stroke-width={1.5}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
