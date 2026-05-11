import type { JSX } from "solid-js";

export function PreviewFrame(props: { children: JSX.Element }) {
  return <div class="w-full max-w-[160px] mx-auto">{props.children}</div>;
}
