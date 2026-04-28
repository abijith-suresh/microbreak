/**
 * createSudokuGame — SolidJS composable for all Sudoku game state.
 *
 * Encapsulates signals, derived values, actions, timer management, and event
 * listeners so SudokuApp.tsx can be a pure layout shell.
 */

import { batch, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import {
  generate,
  getConflictingCells,
  getJustCompletedGroups,
  validate,
  type Board,
  type Cell,
  type CompletingGroup,
  type Difficulty,
  type GridSize,
} from "./sudoku";
import { isPersistedSudokuSession, type PersistedSudokuSession } from "./sudokuSession";
import { loadStoredJSON, removeStoredValue, saveStoredJSON } from "./storage";
import { STORAGE_KEYS } from "./storageKeys";

export type Phase = "setup" | "playing";
export type { CompletingGroup };

export function createSudokuGame() {
  // ── Raw signals ──────────────────────────────────────────────────────────
  const [phase, setPhase] = createSignal<Phase>("setup");
  const [gridSize, setGridSize] = createSignal<GridSize>(9);
  const [difficulty, setDifficulty] = createSignal<Difficulty>("medium");

  const [puzzle, setPuzzle] = createSignal<Board>([]);
  const [solution, setSolution] = createSignal<Board>([]);
  const [userBoard, setUserBoard] = createSignal<Board>([]);

  const [selectedCell, setSelectedCell] = createSignal<[number, number] | null>(null);
  const [timerSeconds, setTimerSeconds] = createSignal(0);
  const [completed, setCompleted] = createSignal(false);
  const [completing, setCompleting] = createSignal(false);
  const [completionOrigin, setCompletionOrigin] = createSignal<[number, number] | null>(null);
  const [conflictedCells, setConflictedCells] = createSignal<Set<string>>(new Set<string>());
  const [persistenceReady, setPersistenceReady] = createSignal(false);

  /** Groups (row/col/box) currently playing the sweep animation */
  const [completingGroups, setCompletingGroups] = createSignal<CompletingGroup[]>([]);

  // ── Internal mutable state ───────────────────────────────────────────────
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let pendingGeneration: number | null = null;
  let groupSweepTimer: ReturnType<typeof setTimeout> | null = null;
  let completionTimer: ReturnType<typeof setTimeout> | null = null;
  let hasStartedFilling = false;

  // ── Derived signals ───────────────────────────────────────────────────────
  /**
   * For each digit 1–N, the number of non-conflicted placements on the board.
   * Used by NumberPad to dim digits whose full set is correctly placed.
   */
  const numberPlacedCounts = createMemo<Record<number, number>>(() => {
    const board = userBoard();
    const conflicts = conflictedCells();
    const size = gridSize();
    const counts: Record<number, number> = {};
    for (let n = 1; n <= size; n++) counts[n] = 0;
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const v = board[r][c];
        if (v !== null && !conflicts.has(`${r},${c}`)) {
          counts[v] = (counts[v] ?? 0) + 1;
        }
      }
    }
    return counts;
  });

  // ── Timer ─────────────────────────────────────────────────────────────────
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => setTimerSeconds((t) => t + 1), 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function isBoardFull(board: Board): boolean {
    return board.every((row) => row.every((cell) => cell !== null));
  }

  function resetProgress() {
    stopTimer();
    hasStartedFilling = false;
    if (groupSweepTimer) {
      clearTimeout(groupSweepTimer);
      groupSweepTimer = null;
    }
    if (completionTimer) {
      clearTimeout(completionTimer);
      completionTimer = null;
    }
    batch(() => {
      setSelectedCell(null);
      setTimerSeconds(0);
      setCompleted(false);
      setCompleting(false);
      setCompletionOrigin(null);
      setConflictedCells(new Set<string>());
      setCompletingGroups([]);
    });
  }

  function clearPendingGeneration() {
    if (pendingGeneration) {
      clearTimeout(pendingGeneration);
      pendingGeneration = null;
    }
  }

  function applyPuzzle(size: GridSize, diff: Difficulty) {
    const result = generate(size, diff);
    batch(() => {
      setPuzzle(result.puzzle);
      setSolution(result.solution);
      setUserBoard(result.puzzle.map((row) => [...row]));
    });
  }

  function prepareLoadingState() {
    resetProgress();
    batch(() => {
      setPuzzle([]);
      setSolution([]);
      setUserBoard([]);
    });
  }

  function persistSession() {
    if (
      phase() !== "playing" ||
      completed() ||
      completing() ||
      puzzle().length !== gridSize() ||
      solution().length !== gridSize() ||
      userBoard().length !== gridSize()
    ) {
      removeStoredValue(STORAGE_KEYS.sudokuSession);
      return;
    }

    const session: PersistedSudokuSession = {
      phase: "playing",
      gridSize: gridSize(),
      difficulty: difficulty(),
      puzzle: puzzle().map((row) => [...row]),
      solution: solution().map((row) => [...row]),
      userBoard: userBoard().map((row) => [...row]),
      timerSeconds: timerSeconds(),
      selectedCell: selectedCell(),
      hasStartedFilling,
    };

    saveStoredJSON(STORAGE_KEYS.sudokuSession, session);
  }

  function restoreSession() {
    const session = loadStoredJSON(STORAGE_KEYS.sudokuSession, isPersistedSudokuSession);
    if (!session) return;

    hasStartedFilling = session.hasStartedFilling;
    const restoredUserBoard = session.userBoard.map((row) => [...row]);

    batch(() => {
      setPhase("playing");
      setGridSize(session.gridSize);
      setDifficulty(session.difficulty);
      setPuzzle(session.puzzle.map((row) => [...row]));
      setSolution(session.solution.map((row) => [...row]));
      setUserBoard(restoredUserBoard);
      setSelectedCell(session.selectedCell);
      setTimerSeconds(session.timerSeconds);
      setConflictedCells(getConflictingCells(restoredUserBoard));
      setCompleted(false);
      setCompleting(false);
      setCompletionOrigin(null);
      setCompletingGroups([]);
    });

    if (hasStartedFilling && document.visibilityState === "visible") {
      startTimer();
    }
  }

  function queuePuzzleGeneration(size: GridSize, diff: Difficulty) {
    clearPendingGeneration();
    prepareLoadingState();
    pendingGeneration = window.setTimeout(() => {
      pendingGeneration = null;
      applyPuzzle(size, diff);
    }, 0);
  }

  // ── Public actions ────────────────────────────────────────────────────────
  function startGame(size: GridSize, diff: Difficulty) {
    batch(() => {
      setGridSize(size);
      setDifficulty(diff);
      setPhase("playing");
    });
    queuePuzzleGeneration(size, diff);
  }

  function restart() {
    clearPendingGeneration();
    prepareLoadingState();
    setPhase("setup");
  }

  function playAgain() {
    queuePuzzleGeneration(gridSize(), difficulty());
  }

  function selectCell(row: number, col: number) {
    setSelectedCell(row === -1 ? null : [row, col]);
  }

  function fillCell(row: number, col: number, value: Cell) {
    const puz = puzzle();
    if (!puz.length) return;
    if (puz[row][col] !== null) return; // given cell — immutable

    const newBoard = userBoard().map((r) => [...r]);
    newBoard[row][col] = value;
    setUserBoard(newBoard);

    if (!hasStartedFilling && value !== null) {
      hasStartedFilling = true;
      startTimer();
    }

    const newConflicts = getConflictingCells(newBoard);
    setConflictedCells(newConflicts);

    if (value !== null && isBoardFull(newBoard) && validate(newBoard)) {
      // Board complete — cancel any pending sweep, trigger completion wave
      if (groupSweepTimer) {
        clearTimeout(groupSweepTimer);
        groupSweepTimer = null;
      }
      setCompletingGroups([]);
      stopTimer();
      setCompletionOrigin([row, col]);
      setCompleting(true);
      completionTimer = setTimeout(() => {
        setCompleted(true);
        completionTimer = null;
      }, 900);
    } else if (value !== null) {
      // Check if any groups just completed
      const justCompleted = getJustCompletedGroups(newBoard, row, col);
      if (justCompleted.length > 0) {
        if (groupSweepTimer) clearTimeout(groupSweepTimer);
        setCompletingGroups(justCompleted);
        groupSweepTimer = setTimeout(() => {
          setCompletingGroups([]);
          groupSweepTimer = null;
        }, 900);
      }
    }
  }

  function eraseCell(row: number, col: number) {
    fillCell(row, col, null);
  }

  function handleKeyboardNumber(num: number) {
    const sel = selectedCell();
    if (!sel) return;
    fillCell(sel[0], sel[1], num);
  }

  function handleKeyboardErase() {
    const sel = selectedCell();
    if (!sel) return;
    fillCell(sel[0], sel[1], null);
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  function handleSudokuNumberInput(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail) fillCell(detail.row, detail.col, detail.num);
  }

  function handleSudokuErase(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail) fillCell(detail.row, detail.col, null);
  }

  function handleVisibility() {
    if (document.visibilityState === "hidden") {
      stopTimer();
    } else if (hasStartedFilling && !completed() && !completing()) {
      startTimer();
    }
  }

  onMount(() => {
    restoreSession();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("sudoku-number-input", handleSudokuNumberInput);
    window.addEventListener("sudoku-erase", handleSudokuErase);
    setPersistenceReady(true);
  });

  createEffect(() => {
    if (!persistenceReady()) return;
    persistSession();
  });

  onCleanup(() => {
    if (typeof window === "undefined") return;
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("sudoku-number-input", handleSudokuNumberInput);
    window.removeEventListener("sudoku-erase", handleSudokuErase);
    clearPendingGeneration();
    if (timerInterval) clearInterval(timerInterval);
    if (groupSweepTimer) clearTimeout(groupSweepTimer);
    if (completionTimer) clearTimeout(completionTimer);
  });

  return {
    // Signals (call to read, reactive)
    phase,
    gridSize,
    difficulty,
    puzzle,
    solution,
    userBoard,
    selectedCell,
    timerSeconds,
    completed,
    completing,
    completionOrigin,
    conflictedCells,
    completingGroups,
    // Derived
    numberPlacedCounts,
    // Actions
    startGame,
    restart,
    playAgain,
    selectCell,
    fillCell,
    eraseCell,
    handleKeyboardNumber,
    handleKeyboardErase,
  };
}
