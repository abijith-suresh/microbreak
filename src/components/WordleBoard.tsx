import { Index } from "solid-js";
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
  pendingReveal: GuessResult | null;
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
        isRevealing: false,
        isShaking: false,
        isBouncing: false,
      });
    }

    // Current input row — only if game is still playing AND there are guesses remaining
    const canGuessMore = props.guesses.length < maxGuesses();
    if (isPlaying() && canGuessMore) {
      const currentIdx = props.guesses.length;
      const isRevealingCurrent = props.revealRow === currentIdx && props.pendingReveal !== null;

      result.push({
        letters: isRevealingCurrent ? props.pendingReveal!.word : props.currentInput,
        guessResult: isRevealingCurrent ? props.pendingReveal! : undefined,
        isCurrent: !isRevealingCurrent,
        isEmpty: false,
        isRevealing: isRevealingCurrent,
        isShaking: props.shakeRow && !isRevealingCurrent && currentIdx === props.guesses.length,
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
      {/* <Index> keeps each row's DOM element alive across re-renders so the
          CSS flip transition fires correctly (it needs an existing element
          going from rotateX(0°) → rotateX(180°), not a fresh mount at 180°). */}
      <Index each={rows()}>
        {(row) => (
          <WordleRow
            letters={row().letters}
            result={row().guessResult}
            length={props.variant}
            isCurrentRow={row().isCurrent}
            isShaking={row().isShaking}
            isRevealing={row().isRevealing}
            isBouncing={row().isBouncing}
          />
        )}
      </Index>
    </div>
  );
}
