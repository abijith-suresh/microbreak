import { For, createSignal, onCleanup, onMount } from "solid-js";
import { getOrderedGames } from "@/data/games";
import GamePreview from "@/components/previews/GamePreview";
import { GameIcon } from "@/components/previews/GameIcon";

export default function GameGrid() {
  const [animationsEnabled, setAnimationsEnabled] = createSignal(false);

  onMount(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setAnimationsEnabled(document.visibilityState === "visible" && !mediaQuery.matches);
    };

    update();
    document.addEventListener("visibilitychange", update);
    mediaQuery.addEventListener("change", update);

    onCleanup(() => {
      document.removeEventListener("visibilitychange", update);
      mediaQuery.removeEventListener("change", update);
    });
  });

  return (
    <div class="grid grid-cols-1 gap-4 px-4 mx-auto max-w-4xl sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
      <For each={getOrderedGames()}>
        {(game) => {
          const isAvailable = game.status === "available";

          return isAvailable ? (
            <a
              href={game.href}
              class="group relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 pb-4 transition-all duration-300 hover:border-accent hover:shadow-xl hover:shadow-shadow-strong hover:-translate-y-1"
            >
              <h3 class="font-display text-3xl text-fg italic">{game.name}</h3>
              <GamePreview game={game} animated={animationsEnabled()} />
              <span class="text-xs text-fg-tertiary transition-colors group-hover:text-accent">
                Play now →
              </span>
            </a>
          ) : (
            <div class="relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 opacity-40 cursor-default select-none">
              <h3 class="font-display text-3xl text-fg-tertiary italic">{game.name}</h3>
              <div class="flex items-center justify-center w-full aspect-[4/3] max-h-[100px]">
                <GameIcon name={game.name} />
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
