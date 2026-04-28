import { For } from "solid-js";
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
    <div
      class="flex gap-1.5 sm:gap-2"
      style={{
        animation: props.isShaking ? "rowShake 600ms ease-out both" : undefined,
      }}
    >
      <For each={tiles()}>
        {(tile) => (
          <WordleTile
            letter={tile.letter}
            state={tile.state}
            isRevealing={props.isRevealing && tile.state !== undefined}
            revealDelay={tile.index * 300}
            isPopping={props.isCurrentRow && tile.letter !== ""}
            isBouncing={props.isBouncing && tile.state === "correct"}
            bounceDelay={tile.index * 100}
          />
        )}
      </For>
    </div>
  );
}
