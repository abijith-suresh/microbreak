import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { getShownGames } from "@/data/games";
import { type CardState, type CardStatus, placeholderCards, readCards } from "@/lib/cardState";
import GameCardThumb from "./GameCardThumb";
import { Tag, type TagTone } from "./ui/Chip";

const STATUS: Record<CardStatus, { label: string; tone: TagTone; action: string }> = {
  new: { label: "New game", tone: "neutral", action: "Play" },
  playing: { label: "In progress", tone: "accent", action: "Resume" },
  won: { label: "Solved", tone: "success", action: "See result" },
  lost: { label: "Game over", tone: "neutral", action: "See result" },
};

function accessibleName(name: string, card: CardState): string {
  const parts = [STATUS[card.status].label, card.settings.replace(" · ", " ")];
  if (card.time) parts.push(card.time);
  const best = card.best
    ? `Best ${card.best}${card.status === "won" && card.newBest ? ", new personal best" : ""}`
    : "No best yet";
  return `${name}: ${parts.join(", ")}. ${best}.`;
}

/**
 * The home page's game cards. Saves live in this browser only, so the server renders empty
 * boards at default settings and the cards read the real state on mount. Every card keeps
 * its size when that happens; only the text fades in.
 */
export default function GameGrid() {
  const shown = new Set(getShownGames().map((game) => game.name.toLowerCase()));
  const hrefs = Object.fromEntries(getShownGames().map((g) => [g.name.toLowerCase(), g.href]));
  const names = Object.fromEntries(getShownGames().map((g) => [g.name.toLowerCase(), g.name]));
  const visible = (cards: CardState[]) => cards.filter((card) => shown.has(card.game));

  const [cards, setCards] = createSignal(visible(placeholderCards()));
  const [ready, setReady] = createSignal(false);

  onMount(() => {
    const refresh = () => setCards(visible(readCards()));
    refresh();
    setReady(true);

    // Coming back from a game (including the back/forward cache) or from another tab.
    const onShow = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onShow);
    onCleanup(() => {
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onShow);
    });
  });

  const fade = () => `transition-opacity duration-300 ${ready() ? "opacity-100" : "opacity-0"}`;

  return (
    <ul class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5" data-ready={ready()}>
      <For each={cards()}>
        {(card) => (
          <li>
            <a
              href={hrefs[card.game]}
              aria-label={accessibleName(names[card.game], card)}
              class="group flex h-full gap-3.5 rounded-[14px] border border-border bg-surface p-2.5 transition duration-200 hover:border-accent hover:shadow-[0_16px_32px_-12px_var(--color-shadow-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-col sm:rounded-2xl sm:p-3.5 sm:pb-4 sm:hover:-translate-y-0.5"
            >
              <div class="flex aspect-square w-27 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-surface-hover [container-type:size] sm:aspect-[4/3] sm:w-full">
                <GameCardThumb thumb={card.thumb} />
              </div>

              <div class="flex min-w-0 flex-1 flex-col justify-center gap-1.5 sm:gap-2 sm:px-1">
                <div class="flex items-center justify-between gap-2">
                  <h2 class="font-display text-[26px] leading-none text-fg italic sm:text-[28px] lg:text-[32px]">
                    {names[card.game]}
                  </h2>
                  <svg
                    class="size-4.5 shrink-0 text-fg-tertiary sm:hidden"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>

                <div
                  class={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-secondary tabular-nums sm:text-[13px] ${fade()}`}
                >
                  <Tag tone={STATUS[card.status].tone}>{STATUS[card.status].label}</Tag>
                  <span>
                    {card.settings}
                    {card.time ? ` · ${card.time}` : ""}
                  </span>
                </div>

                <div
                  class={`flex items-center justify-between sm:mt-1 sm:border-t sm:border-border sm:pt-3 ${fade()}`}
                >
                  <span class="flex items-baseline gap-1.5 text-xs text-fg-tertiary sm:text-[13px]">
                    <Show when={card.best} fallback="No best yet">
                      Best
                      <b class="text-[13px] font-semibold text-fg tabular-nums sm:text-[15px]">
                        {card.best}
                      </b>
                      <Show when={card.status === "won" && card.newBest}>
                        <span class="font-medium text-accent">New best</span>
                      </Show>
                    </Show>
                  </span>
                  <span class="hidden text-[13px] font-medium text-accent sm:inline">
                    {STATUS[card.status].action} →
                  </span>
                </div>
              </div>
            </a>
          </li>
        )}
      </For>
    </ul>
  );
}
