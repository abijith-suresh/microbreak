import { Index } from "solid-js";
import WordleTile from "./WordleTile";
import type { GuessResult, LetterState } from "@/lib/wordle";

interface Props {
  letters: string;
  result?: GuessResult;
  length: number;
  isCurrentRow?: boolean;
  isShaking?: boolean;
  isRevealing?: boolean;
  isBouncing?: boolean;
}

export default function WordleRow(props: Props) {
  const tiles = () => {
    const arr: { letter: string; state: LetterState | undefined; index: number }[] = [];
    for (let i = 0; i < props.length; i++) {
      arr.push({
        letter: props.letters[i] ?? "",
        state: props.result?.states[i],
        index: i,
      });
    }
    return arr;
  };

  return (
    <div class={"flex gap-1.5 sm:gap-2" + (props.isShaking ? " animate-row-shake" : "")}>
      {/* <Index> (not <For>) is used here so that each tile DOM element is
          reused by index rather than by object identity. New plain objects
          are created on every render, so <For> would remount every tile,
          killing the CSS transitions that drive the card-flip animation. */}
      <Index each={tiles()}>
        {(tile) => (
          <WordleTile
            letter={tile().letter}
            state={tile().state}
            isRevealing={props.isRevealing && tile().state !== undefined}
            revealDelay={tile().index * 300}
            isPopping={props.isCurrentRow && tile().letter !== ""}
            isBouncing={props.isBouncing && tile().state === "correct"}
            bounceDelay={tile().index * 100}
          />
        )}
      </Index>
    </div>
  );
}
