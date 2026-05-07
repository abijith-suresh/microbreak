import type { GuessResult, LetterState, Variant } from "./wordle";
import { isRecord } from "./storage";

export interface PersistedWordleSession {
  phase: "playing";
  variant: Variant;
  answer: string;
  guesses: GuessResult[];
  currentInput: string;
  timerSeconds: number;
  hasStartedPlaying: boolean;
}

function isLetterState(value: unknown): value is LetterState {
  return value === "correct" || value === "present" || value === "absent";
}

function isGuessResult(value: unknown, variant: Variant): value is GuessResult {
  return (
    isRecord(value) &&
    typeof value.word === "string" &&
    value.word.length === variant &&
    Array.isArray(value.states) &&
    value.states.length === variant &&
    value.states.every(isLetterState)
  );
}

export function isPersistedWordleSession(value: unknown): value is PersistedWordleSession {
  if (!isRecord(value)) return false;
  if (value.phase !== "playing") return false;
  if (value.variant !== 4 && value.variant !== 5 && value.variant !== 6) return false;

  const variant = value.variant;

  return (
    typeof value.answer === "string" &&
    value.answer.length === variant &&
    Array.isArray(value.guesses) &&
    value.guesses.every((guess) => isGuessResult(guess, variant)) &&
    typeof value.currentInput === "string" &&
    value.currentInput.length <= variant &&
    typeof value.timerSeconds === "number" &&
    typeof value.hasStartedPlaying === "boolean"
  );
}
