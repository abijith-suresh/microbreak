import { ChevronLeft } from "@/lib/icons";

/** The top bar's way home: a chevron, plus "Games" from the sm breakpoint up. */
export default function BackLink() {
  return (
    <a
      href="/"
      aria-label="Back to games"
      class="relative -ml-1.5 inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1 rounded-[10px] pr-2 pl-1 text-[13px] font-medium text-fg-tertiary transition-colors after:absolute after:-inset-1 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:justify-start"
    >
      <ChevronLeft size={18} strokeWidth={1.5} />
      <span class="hidden sm:inline">Games</span>
    </a>
  );
}
