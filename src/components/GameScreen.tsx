import type { JSX } from "solid-js";

interface Props {
  left: JSX.Element;
  center: JSX.Element;
  right: JSX.Element;
  children: JSX.Element;
  belowContent?: JSX.Element;
  footer?: JSX.Element;
  contentClass?: string;
}

const DEFAULT_CONTENT_CLASS =
  "flex-1 flex flex-col items-center justify-center gap-6 py-4 px-2 md:px-4 overflow-auto";

export default function GameScreen(props: Props) {
  return (
    <div class="flex flex-col min-h-screen animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      <div class="flex items-center justify-between px-5 py-3">
        {props.left}
        {props.center}
        {props.right}
      </div>

      <div class="h-px bg-border" />

      <div class={props.contentClass ?? DEFAULT_CONTENT_CLASS}>{props.children}</div>

      {props.belowContent}

      {props.footer ? <div class="px-4 pb-5 flex justify-center">{props.footer}</div> : null}
    </div>
  );
}
