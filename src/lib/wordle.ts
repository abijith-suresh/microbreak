/**
 * Wordle engine — guess evaluation, word validation, variant config.
 *
 * Pure TypeScript with no framework dependencies. All functions are pure
 * (take data, return data, no side effects).
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type Variant = 4 | 5 | 6;
export type LetterState = "correct" | "present" | "absent";

export interface GuessResult {
  word: string;
  states: LetterState[];
}

export interface WordList {
  solutions: string[];
  guesses: string[];
}

// ── Variant config ─────────────────────────────────────────────────────────────

export function getMaxGuesses(variant: Variant): number {
  return variant + 1; // 4→5, 5→6, 6→7
}

// ── Core evaluation ────────────────────────────────────────────────────────────

/**
 * Evaluate a guess against the answer.
 *
 * Algorithm:
 * 1. First pass: mark exact matches as "correct"
 * 2. Second pass: for remaining letters, check against remaining answer letters
 *    → "present" if found, "absent" otherwise
 *
 * Handles duplicate letters correctly: each answer letter can only match once.
 */
export function computeGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(guess.length).fill("absent");
  const answerLetters = answer.split("");
  const guessLetters = guess.split("");

  // First pass: exact matches
  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = "correct";
      answerLetters[i] = ""; // consume this answer letter
      guessLetters[i] = ""; // mark as handled
    }
  }

  // Second pass: present (wrong position)
  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === "") continue; // already matched
    const idx = answerLetters.indexOf(guessLetters[i]);
    if (idx !== -1) {
      result[i] = "present";
      answerLetters[idx] = ""; // consume this answer letter
    }
  }

  return result;
}

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Check if a word is a valid guess (exists in either solutions or guesses list).
 */
export function isWordValid(word: string, wordList: WordList): boolean {
  // Binary search since lists are sorted
  return binarySearch(wordList.guesses, word) || binarySearch(wordList.solutions, word);
}

function binarySearch(sorted: string[], target: string): boolean {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = sorted[mid];
    if (cmp === target) return true;
    if (cmp < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}

// ── Keyboard state ─────────────────────────────────────────────────────────────

/**
 * Merge a new guess result into the keyboard state map.
 * Letter states are upgraded: correct > present > absent > undefined.
 */
export function mergeKeyboardState(
  current: Record<string, LetterState>,
  result: GuessResult
): Record<string, LetterState> {
  const next = { ...current };
  const priority: Record<LetterState, number> = {
    correct: 3,
    present: 2,
    absent: 1,
  };

  for (let i = 0; i < result.word.length; i++) {
    const letter = result.word[i];
    const newState = result.states[i];
    const existing = next[letter];

    if (!existing || priority[newState] > priority[existing]) {
      next[letter] = newState;
    }
  }

  return next;
}

// ── Random selection ───────────────────────────────────────────────────────────

/**
 * Pick a random solution word from the list.
 * Uses crypto.getRandomValues for better randomness if available.
 */
export function pickRandomSolution(wordList: WordList, recentAnswers: string[] = []): string {
  const recentSet = new Set(recentAnswers);
  const candidates = wordList.solutions.filter((word) => !recentSet.has(word));
  const pool = candidates.length > 0 ? candidates : wordList.solutions;
  const index = secureRandom(pool.length);
  return pool[index];
}

function secureRandom(max: number): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}
