import { CURATED_WORDLE_SOLUTIONS } from "@/data/wordleSolutionPools";
import type { Variant, WordList } from "./wordle";

export function buildWordList(variant: Variant, baseWordList: WordList): WordList {
  if (variant === 5) {
    return {
      solutions: [...baseWordList.solutions],
      guesses: [...baseWordList.guesses],
    };
  }

  const solutions = [...CURATED_WORDLE_SOLUTIONS[variant]];
  const guesses = Array.from(
    new Set([...baseWordList.guesses, ...baseWordList.solutions, ...solutions])
  ).sort();

  return {
    solutions,
    guesses,
  };
}
