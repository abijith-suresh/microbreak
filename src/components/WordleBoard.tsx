import { For } from "solid-js";
import WordleRow from "./WordleRow";
import { getMaxGuesses } from "@/lib/wordle";
import type { GuessResult, Variant } from "@/lib/wordle";

interface Props {
  variant: Variant;
  guesses: GuessResult[];
  currentInput: string;
  revealRow: number;
  shakeRow: boolean;
  gameResult: "won" | "lost" | null;
}

export default function WordleBoard(props: Props) {
  const maxGuesses = () => getMaxGuesses(props.variant);
  const isPlaying = () => props.gameResult === null;

  const rows = () => {
    const result: {
      letters: string;
      guessResult?: GuessResult;
      isCurrent: boolean;
      isEmpty: boolean;
      isRevealing: boolean;
      isShaking: boolean;
      isBouncing: boolean;
    }[] = [];

    // Completed guesses
    for (let i = 0; i < props.guesses.length; i++) {
      result.push({
        letters: props.guesses[i].word,
        guessResult: props.guesses[i],
        isCurrent: false,
        isEmpty: false,
        isRevealing: props.revealRow === i,
        isShaking: false,
        isBouncing: false,
      });
    }

    // Current input row (only if game is still playing)
    if (isPlaying()) {
      const currentIdx = props.guesses.length;
      result.push({
        letters: props.currentInput,
        isCurrent: true,
        isEmpty: false,
        isRevealing: false,
        isShaking: props.shakeRow && currentIdx === props.guesses.length,
        isBouncing: false,
      });
    }

    // Empty rows to fill remaining space
    const remaining = maxGuesses() - result.length;
    for (let i = 0; i < remaining; i++) {
      result.push({
        letters: "",
        isCurrent: false,
        isEmpty: true,
        isRevealing: false,
        isShaking: false,
        isBouncing: false,
      });
    }

    return result;
  };

  return (
    <div class="flex flex-col items-center gap-1.5 sm:gap-2">
      <For each={rows()}>
        {(row) => (
          <WordleRow
            letters={row.letters}
            result={row.guessResult}
            length={props.variant}
            isCurrentRow={row.isCurrent}
            isShaking={row.isShaking}
            isRevealing={row.isRevealing}
            isBouncing={row.isBouncing}
          />
        )}
      </For>
    </div>
  );
}
