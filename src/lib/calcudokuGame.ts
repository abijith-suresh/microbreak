/**
 * createCalcudokuGame — SolidJS composable for all Calcudoku game state.
 *
 * Holds the puzzle, the board (digits and notes), selection, notes mode, timer and the saved
 * game, so CalcudokuApp.tsx only lays things out. Mistakes never end a game: a wrong digit
 * shows as a conflict or a broken cage until it is fixed.
 */

import { batch, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { calcudokuVariant, recordBest } from "./bests";
import {
  type CageStatus,
  type CalcudokuBoard,
  type CalcudokuPuzzle,
  clearCell,
  createBoard,
  type Difficulty,
  generate,
  getCageStatuses,
  getConflictingCells,
  isSolved,
  SIZE_FOR_DIFFICULTY,
  setCellValue,
  toggleNote,
} from "./calcudoku";
import { isPersistedCalcudokuSession, type PersistedCalcudokuSession } from "./calcudokuSession";
import { createElapsedTimer } from "./elapsedTimer";
import { loadCalcudokuDifficulty, saveCalcudokuDifficulty } from "./gamePreferences";
import { loadStoredJSON, saveStoredJSON } from "./storage";
import { STORAGE_KEYS } from "./storageKeys";

/** How long the solved board plays its wave before the result screen. */
const COMPLETION_MS = 900;

export function createCalcudokuGame() {
  const [difficulty, setDifficulty] = createSignal<Difficulty>("medium");
  const [puzzle, setPuzzle] = createSignal<CalcudokuPuzzle | null>(null);
  const [board, setBoard] = createSignal<CalcudokuBoard | null>(null);
  const [selectedCell, setSelectedCell] = createSignal<[number, number] | null>(null);
  const [notesMode, setNotesMode] = createSignal(false);
  const [timerSeconds, setTimerSeconds] = createSignal(0);
  const [completing, setCompleting] = createSignal(false);
  const [completed, setCompleted] = createSignal(false);
  const [completionOrigin, setCompletionOrigin] = createSignal<[number, number] | null>(null);
  const [newBest, setNewBest] = createSignal(false);
  const [persistenceReady, setPersistenceReady] = createSignal(false);

  const timer = createElapsedTimer({ getValue: timerSeconds, setValue: setTimerSeconds });
  let hasStartedFilling = false;
  let completionTimer: ReturnType<typeof setTimeout> | null = null;

  const size = () => SIZE_FOR_DIFFICULTY[difficulty()];

  const conflictedCells = createMemo(() => {
    const current = board();
    return current ? getConflictingCells(current.values) : new Set<string>();
  });

  const cageStatuses = createMemo<CageStatus[]>(() => {
    const current = board();
    const p = puzzle();
    return current && p ? getCageStatuses(p, current.values) : [];
  });

  /** For each digit, how many non-conflicted cells hold it. The pad dims digits all placed. */
  const numberPlacedCounts = createMemo<Record<number, number>>(() => {
    const counts: Record<number, number> = {};
    const current = board();
    const conflicts = conflictedCells();
    current?.values.forEach((row, r) => {
      row.forEach((value, c) => {
        if (value !== null && !conflicts.has(`${r},${c}`)) counts[value] = (counts[value] ?? 0) + 1;
      });
    });
    return counts;
  });

  function clearCompletionTimer() {
    if (completionTimer) {
      clearTimeout(completionTimer);
      completionTimer = null;
    }
  }

  function startGame(diff: Difficulty) {
    saveCalcudokuDifficulty(diff);
    timer.stop();
    clearCompletionTimer();
    hasStartedFilling = false;
    const next = generate(diff);
    batch(() => {
      setDifficulty(diff);
      setPuzzle(next);
      setBoard(createBoard(next));
      setSelectedCell(null);
      setTimerSeconds(0);
      setCompleting(false);
      setCompleted(false);
      setCompletionOrigin(null);
      setNewBest(false);
    });
  }

  function playAgain() {
    startGame(difficulty());
  }

  function persistSession() {
    const p = puzzle();
    const current = board();
    if (!p || !current) return;
    const session: PersistedCalcudokuSession = {
      status: completed() || completing() ? "won" : "playing",
      newBest: newBest(),
      timerSeconds: timerSeconds(),
      difficulty: difficulty(),
      puzzle: p,
      values: current.values,
      notes: current.notes,
      selectedCell: selectedCell(),
      notesMode: notesMode(),
      hasStartedFilling,
    };
    saveStoredJSON(STORAGE_KEYS.calcudokuSession, session);
  }

  function restoreSession(): boolean {
    const session = loadStoredJSON(STORAGE_KEYS.calcudokuSession, isPersistedCalcudokuSession);
    if (!session) return false;
    hasStartedFilling = session.hasStartedFilling;
    batch(() => {
      setDifficulty(session.difficulty);
      setPuzzle(session.puzzle);
      setBoard({ values: session.values, notes: session.notes });
      setSelectedCell(session.selectedCell);
      setNotesMode(session.notesMode);
      setTimerSeconds(session.timerSeconds);
      setCompleted(session.status === "won");
      setNewBest(session.newBest);
    });
    if (
      session.status === "playing" &&
      hasStartedFilling &&
      document.visibilityState === "visible"
    ) {
      timer.start();
    }
    return true;
  }

  function isLocked() {
    return completing() || completed() || !puzzle() || !board();
  }

  function markStarted() {
    if (hasStartedFilling) return;
    hasStartedFilling = true;
    timer.start();
  }

  function finishIfSolved(row: number, col: number, next: CalcudokuBoard) {
    const p = puzzle();
    if (!p || !isSolved(p, next.values)) return;
    timer.stop();
    setNewBest(
      recordBest("calcudoku", calcudokuVariant(p.size), { seconds: timerSeconds() }).isNew
    );
    setCompletionOrigin([row, col]);
    setCompleting(true);
    completionTimer = setTimeout(() => {
      completionTimer = null;
      setCompleted(true);
      setCompleting(false);
    }, COMPLETION_MS);
  }

  /** A digit goes in as the value, or as a note in notes mode. */
  function enterDigit(row: number, col: number, digit: number) {
    const p = puzzle();
    const current = board();
    if (isLocked() || !p || !current) return;
    const next = notesMode()
      ? toggleNote(p, current, row, col, digit)
      : setCellValue(p, current, row, col, digit);
    if (next === current) return;
    markStarted();
    setBoard(next);
    if (!notesMode()) finishIfSolved(row, col, next);
  }

  function eraseCell(row: number, col: number) {
    const p = puzzle();
    const current = board();
    if (isLocked() || !p || !current) return;
    const next = clearCell(p, current, row, col);
    if (next !== current) setBoard(next);
  }

  function selectCell(row: number, col: number) {
    setSelectedCell(row === -1 ? null : [row, col]);
  }

  function toggleNotesMode() {
    setNotesMode(!notesMode());
  }

  function handleNumber(digit: number) {
    const sel = selectedCell();
    if (sel) enterDigit(sel[0], sel[1], digit);
  }

  function handleErase() {
    const sel = selectedCell();
    if (sel) eraseCell(sel[0], sel[1]);
  }

  function handleVisibility() {
    if (document.visibilityState === "hidden") timer.stop();
    else if (hasStartedFilling && !completed() && !completing()) timer.start();
  }

  onMount(() => {
    if (!restoreSession()) startGame(loadCalcudokuDifficulty());
    document.addEventListener("visibilitychange", handleVisibility);
    setPersistenceReady(true);
  });

  createEffect(() => {
    if (persistenceReady()) persistSession();
  });

  onCleanup(() => {
    if (typeof document === "undefined") return;
    document.removeEventListener("visibilitychange", handleVisibility);
    timer.stop();
    clearCompletionTimer();
  });

  return {
    difficulty,
    size,
    puzzle,
    board,
    selectedCell,
    notesMode,
    timerSeconds,
    completing,
    completed,
    completionOrigin,
    newBest,
    conflictedCells,
    cageStatuses,
    numberPlacedCounts,
    startGame,
    playAgain,
    selectCell,
    toggleNotesMode,
    enterDigit,
    eraseCell,
    handleNumber,
    handleErase,
  };
}
