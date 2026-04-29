/**
 * createWordleGame — SolidJS composable for all Wordle game state.
 *
 * Mirrors the sudokuGame.ts / minesweeperGame.ts architecture:
 * encapsulates signals, derived values, actions, keyboard listeners,
 * timer management, and lazy word-list loading so WordleApp.tsx can be
 * a pure layout shell.
 */

import { batch, createSignal, onCleanup, onMount } from "solid-js";
import { loadStoredJSON, saveStoredJSON } from "./storage";
import { STORAGE_KEYS } from "./storageKeys";
import {
  addRecentWordleAnswer,
  createEmptyRecentWordleAnswers,
  isRecentWordleAnswers,
} from "./wordlePersistence";
import {
  computeGuess,
  getMaxGuesses,
  isWordValid,
  mergeKeyboardState,
  pickRandomSolution,
  type GuessResult,
  type LetterState,
  type Variant,
  type WordList,
} from "./wordle";

export type Phase = "setup" | "playing";
export type { Variant, LetterState, GuessResult };

const wordListCache = new Map<Variant, Promise<WordList>>();

export function createWordleGame() {
  // ── Raw signals ──────────────────────────────────────────────────────────
  const [phase, setPhase] = createSignal<Phase>("setup");
  const [variant, setVariant] = createSignal<Variant>(5);

  const [answer, setAnswer] = createSignal("");
  const [guesses, setGuesses] = createSignal<GuessResult[]>([]);
  const [currentInput, setCurrentInput] = createSignal("");
  const [gameResult, setGameResult] = createSignal<"won" | "lost" | null>(null);
  const [keyboardState, setKeyboardState] = createSignal<Record<string, LetterState>>({});
  const [shakeRow, setShakeRow] = createSignal(false);
  const [revealRow, setRevealRow] = createSignal(-1); // index of row currently revealing
  const [pendingReveal, setPendingReveal] = createSignal<GuessResult | null>(null); // result during flip animation
  const [loading, setLoading] = createSignal(false);
  const [timerSeconds, setTimerSeconds] = createSignal(0);
  const [toastMessage, setToastMessage] = createSignal("");

  // ── Internal mutable state ───────────────────────────────────────────────
  let wordList: WordList | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let shakeTimer: ReturnType<typeof setTimeout> | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  let revealTimer: ReturnType<typeof setTimeout> | null = null;
  let hasStartedPlaying = false;
  let startRequestId = 0;

  // ── Timer ─────────────────────────────────────────────────────────────────
  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => setTimerSeconds((t) => t + 1), 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(message: string, duration = 1500) {
    if (toastTimer) clearTimeout(toastTimer);
    setToastMessage(message);
    toastTimer = setTimeout(() => {
      setToastMessage("");
      toastTimer = null;
    }, duration);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function resetProgress() {
    stopTimer();
    if (shakeTimer) {
      clearTimeout(shakeTimer);
      shakeTimer = null;
    }
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
    hasStartedPlaying = false;
    batch(() => {
      setCurrentInput("");
      setGuesses([]);
      setGameResult(null);
      setKeyboardState({});
      setShakeRow(false);
      setRevealRow(-1);
      setPendingReveal(null);
      setTimerSeconds(0);
      setToastMessage("");
    });
  }

  function loadRecentAnswers() {
    return (
      loadStoredJSON(STORAGE_KEYS.wordleRecentAnswers, isRecentWordleAnswers) ??
      createEmptyRecentWordleAnswers()
    );
  }

  // ── Word list loading ─────────────────────────────────────────────────────
  async function loadWordList(v: Variant): Promise<WordList> {
    const cached = wordListCache.get(v);
    if (cached) return cached;

    const modules: Record<number, () => Promise<{ default: WordList }>> = {
      4: () => import("@/data/words-4.json"),
      5: () => import("@/data/words-5.json"),
      6: () => import("@/data/words-6.json"),
    };

    const promise = modules[v]().then((mod) => mod.default);
    wordListCache.set(v, promise);
    return promise;
  }

  // ── Public actions ────────────────────────────────────────────────────────

  async function startGame(v: Variant) {
    const requestId = ++startRequestId;
    setLoading(true);
    try {
      const loadedWordList = await loadWordList(v);
      if (requestId !== startRequestId) return;

      const recentAnswers = loadRecentAnswers();
      const word = pickRandomSolution(loadedWordList, recentAnswers[v]);
      saveStoredJSON(
        STORAGE_KEYS.wordleRecentAnswers,
        addRecentWordleAnswer(recentAnswers, v, word)
      );

      wordList = loadedWordList;
      resetProgress();
      batch(() => {
        setVariant(v);
        setAnswer(word);
        setPhase("playing");
      });
    } finally {
      if (requestId === startRequestId) {
        setLoading(false);
      }
    }
  }

  function restart() {
    startRequestId++;
    setLoading(false);
    resetProgress();
    setPhase("setup");
  }

  function playAgain() {
    startGame(variant());
  }

  function typeLetter(letter: string) {
    if (phase() !== "playing") return;
    if (gameResult() !== null) return;
    if (revealRow() >= 0) return; // still revealing
    const maxLen = variant();
    setCurrentInput((prev) => (prev.length < maxLen ? prev + letter.toLowerCase() : prev));
  }

  function deleteLetter() {
    if (phase() !== "playing") return;
    if (gameResult() !== null) return;
    if (revealRow() >= 0) return;
    setCurrentInput((prev) => prev.slice(0, -1));
  }

  function submitGuess() {
    if (phase() !== "playing") return;
    if (gameResult() !== null) return;
    if (revealRow() >= 0) return;

    const input = currentInput();
    const v = variant();

    // Check length
    if (input.length !== v) return;

    // Check valid word
    if (!wordList || !isWordValid(input, wordList)) {
      showToast("Not in word list");
      setShakeRow(true);
      if (shakeTimer) clearTimeout(shakeTimer);
      shakeTimer = setTimeout(() => {
        setShakeRow(false);
        shakeTimer = null;
      }, 600);
      return;
    }

    // Compute result
    const states = computeGuess(input, answer());
    const result: GuessResult = { word: input, states };

    // Start timer on first valid guess
    if (!hasStartedPlaying) {
      hasStartedPlaying = true;
      startTimer();
    }

    // Set the pending reveal — tile components will delay color changes
    // to the midpoint of their flip animation
    const rowIndex = guesses().length;
    batch(() => {
      setPendingReveal(result);
      setRevealRow(rowIndex);
    });

    // After reveal animation completes, commit the guess
    const revealDelay = v * 350 + 300; // per-tile flip time + buffer
    revealTimer = setTimeout(() => {
      const newGuesses = [...guesses(), result];
      const newKeyboard = mergeKeyboardState(keyboardState(), result);
      const didWin = states.every((s) => s === "correct");
      const didLose = !didWin && newGuesses.length >= getMaxGuesses(v);

      batch(() => {
        setGuesses(newGuesses);
        setKeyboardState(newKeyboard);
        setCurrentInput("");
        setRevealRow(-1);
        setPendingReveal(null);

        if (didWin || didLose) {
          stopTimer();
          setGameResult(didWin ? "won" : "lost");
        }
      });

      revealTimer = null;
    }, revealDelay);
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  function handleKeydown(e: KeyboardEvent) {
    if (phase() !== "playing") return;
    if (gameResult() !== null) return;

    if (e.key === "Enter") {
      e.preventDefault();
      submitGuess();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      deleteLetter();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      typeLetter(e.key);
    }
  }

  function handleVisibility() {
    if (document.visibilityState === "hidden") {
      stopTimer();
    } else if (hasStartedPlaying && !gameResult()) {
      startTimer();
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", handleVisibility);
  });

  onCleanup(() => {
    if (typeof window === "undefined") return;
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("visibilitychange", handleVisibility);
    stopTimer();
    if (shakeTimer) clearTimeout(shakeTimer);
    if (toastTimer) clearTimeout(toastTimer);
    if (revealTimer) clearTimeout(revealTimer);
  });

  return {
    // Signals
    phase,
    variant,
    answer,
    guesses,
    currentInput,
    gameResult,
    keyboardState,
    shakeRow,
    revealRow,
    pendingReveal,
    loading,
    timerSeconds,
    toastMessage,
    // Actions
    startGame,
    restart,
    playAgain,
    typeLetter,
    deleteLetter,
    submitGuess,
  };
}
