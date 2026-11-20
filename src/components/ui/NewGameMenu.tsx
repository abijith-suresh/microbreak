import { createEffect, createSignal, createUniqueId, For, onCleanup, Show } from "solid-js";
import { ChevronDown } from "@/lib/icons";
import Button, { buttonVariants } from "./Button";
import { Chip } from "./Chip";

export type MenuValue = string | number;

export interface MenuGroup {
  id: string;
  label: string;
  options: { value: MenuValue; label: string }[];
  /** The value the current game uses; the menu opens with it selected. */
  value: MenuValue;
}

interface Props {
  groups: MenuGroup[];
  onStart: (values: Record<string, MenuValue>) => void;
  /** Shown under the start button, e.g. a warning that the board will be replaced. */
  note?: string;
}

/**
 * "New game ▾" in the top bar. A popover from the sm breakpoint up, a bottom sheet below it.
 * Choices stay a draft until "Start new game", so closing the menu changes nothing.
 */
export default function NewGameMenu(props: Props) {
  const [open, setOpen] = createSignal(false);
  const [draft, setDraft] = createSignal<Record<string, MenuValue>>({});
  const panelId = createUniqueId();
  let buttonRef: HTMLButtonElement | undefined;
  let panelRef: HTMLDivElement | undefined;

  function show() {
    setDraft(Object.fromEntries(props.groups.map((group) => [group.id, group.value])));
    setOpen(true);
    queueMicrotask(() => panelRef?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus());
  }

  function hide(returnFocus = true) {
    setOpen(false);
    if (returnFocus) buttonRef?.focus();
  }

  function start() {
    const values = draft();
    hide();
    props.onStart(values);
  }

  createEffect(() => {
    if (!open()) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKey);
    onCleanup(() => document.removeEventListener("keydown", onKey));
  });

  return (
    <div class="relative" data-game-menu>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open()}
        aria-controls={open() ? panelId : undefined}
        onClick={() => (open() ? hide() : show())}
        class={buttonVariants({ variant: "secondary" })}
      >
        <span class="hidden sm:inline">New game</span>
        <span class="sm:hidden">New</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          class={`hidden transition-transform duration-200 min-[360px]:block ${open() ? "rotate-180" : ""}`}
        />
      </button>

      <Show when={open()}>
        <div
          class="fixed inset-0 z-40 bg-black/35 animate-in fade-in duration-200 sm:bg-transparent"
          aria-hidden="true"
          onClick={() => hide(false)}
        />
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="New game"
          class={[
            "fixed inset-x-0 bottom-0 z-50 flex flex-col gap-4.5 rounded-t-[20px] border border-border bg-surface px-5 pt-3 pb-7",
            "shadow-[0_-12px_40px_-12px_var(--color-shadow-strong)] animate-in slide-in-from-bottom-4 fade-in duration-200",
            "sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-[calc(100%+8px)] sm:w-80 sm:gap-4 sm:rounded-2xl sm:p-4.5",
            "sm:shadow-[0_24px_48px_-16px_var(--color-shadow-strong)] sm:slide-in-from-top-1 sm:slide-in-from-bottom-0",
          ].join(" ")}
        >
          <div class="flex flex-col items-center gap-3 sm:hidden">
            <span class="h-1 w-9 rounded-full bg-border-strong" aria-hidden="true" />
            <span class="self-start font-display text-2xl italic text-fg">New game</span>
          </div>

          <For each={props.groups}>
            {(group) => (
              <fieldset class="m-0 min-w-0 border-0 p-0">
                <legend class="mb-2.5 p-0 text-[11px] font-medium uppercase tracking-[0.12em] text-fg-tertiary">
                  {group.label}
                </legend>
                <div class="flex gap-1.5">
                  <For each={group.options}>
                    {(option) => (
                      <Chip
                        pressed={draft()[group.id] === option.value}
                        onClick={() => setDraft({ ...draft(), [group.id]: option.value })}
                        class="h-10 flex-1 sm:h-8 sm:flex-none"
                      >
                        {option.label}
                      </Chip>
                    )}
                  </For>
                </div>
              </fieldset>
            )}
          </For>

          <Button size="lg" onClick={start} class="w-full">
            Start new game
          </Button>
          <Show when={props.note}>
            <p class="text-xs text-fg-tertiary">{props.note}</p>
          </Show>
        </div>
      </Show>
    </div>
  );
}
