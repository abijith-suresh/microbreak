import type { JSX } from "solid-js";
import ThemeToggle from "./ThemeToggle";
import BackLink from "./ui/BackLink";

interface Props {
  /** Game name, shown in the display face. */
  title: string;
  /** Current settings, e.g. "9×9 · Medium". */
  meta: string;
  /** The formatted clock. Sits under the name on phones, at the right from sm up. */
  timer: string;
  /** Other live readouts, e.g. 2048's score. */
  stats?: JSX.Element;
  /** The new-game control. */
  menu?: JSX.Element;
  children: JSX.Element;
  belowContent?: JSX.Element;
  contentClass?: string;
}

const DEFAULT_CONTENT_CLASS =
  "flex-1 flex flex-col items-center justify-center gap-6 py-4 px-2 md:px-4 overflow-auto";

/**
 * Every game screen: the same top bar (back, name, settings, timer, new game, theme) as the
 * page banner, then the board as the page's one main landmark.
 */
export default function GameScreen(props: Props) {
  return (
    <div class="flex flex-col min-h-dvh">
      <header class="border-b border-border">
        <div class="page-frame flex h-14 items-center gap-1.5 min-[360px]:gap-2 sm:h-15 sm:gap-3">
          <BackLink />
          <div class="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2.5">
            <h1 class="font-display text-[22px] leading-none text-fg italic sm:text-[26px]">
              {props.title}
            </h1>
            <span class="truncate text-[11px] text-fg-tertiary sm:text-[13px]">
              {props.meta}
              <span class="sm:hidden">
                {" · "}
                <span class="font-mono tabular-nums">{props.timer}</span>
              </span>
            </span>
          </div>
          <div class="ml-auto flex shrink-0 items-center gap-1.5 min-[360px]:gap-2 sm:gap-3">
            {props.stats}
            <span class="hidden font-mono text-sm tabular-nums tracking-wider text-fg-secondary sm:inline">
              {props.timer}
            </span>
            <span class="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            {props.menu}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main class="flex flex-1 flex-col">
        <div
          class={`${props.contentClass ?? DEFAULT_CONTENT_CLASS} animate-in fade-in duration-300`}
        >
          {props.children}
        </div>

        {props.belowContent}
      </main>
    </div>
  );
}
