import { ChevronLeft } from "@/lib/icons";
import { buttonVariants } from "./Button";

/** The top bar's way home: the same icon button as the theme toggle. */
export default function BackLink() {
  return (
    <a
      href="/"
      aria-label="Back to games"
      title="Back to games"
      class={buttonVariants({ variant: "secondary", size: "icon" })}
    >
      <ChevronLeft size={18} strokeWidth={1.5} />
    </a>
  );
}
