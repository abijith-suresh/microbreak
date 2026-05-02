/**
 * createMinesweeperGame — SolidJS composable for all Minesweeper game state.
 *
 * Mirrors the sudokuGame.ts architecture: encapsulates signals, derived values,
 * actions, timer management, and event listeners so MinesweeperApp.tsx can be
 * a pure layout shell.
 */

import { batch, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import {
  checkWin,
  countFlags,
  createEmptyBoard,
  generateBoard,
  getDifficultyPreset,
  getWrongFlags,
  isMine,
  revealAllMines,
  revealCell,
  toggleFlag,
  type Board,
  type Difficulty,
} from "./minesweeper";
import {
  isPersistedMinesweeperSession,
  type PersistedMinesweeperSession,
} from "./minesweeperSession";
import { loadStoredJSON, removeStoredValue, saveStoredJSON } from "./storage";
import { STORAGE_KEYS } from "./storageKeys";

export type Phase = "setup" | "playing";
export type { Difficulty };

export function createMinesweeperGame() {
  // ── Raw signals ──────────────────────────────────────────────────────────
  const [phase, setPhase] = createSignal<Phase>("setup");
  const [difficulty, setDifficulty] = createSignal<Difficulty>("beginner");

  const [board, setBoard] = createSignal<Board>([]);
  const [rows, setRows] = createSignal(0);
  const [cols, setCols] = createSignal(0);
  const [mineCount, setMineCount] = createSignal(0);

  const [selectedCell, setSelectedCell] = createSignal<[number, number] | null>(null);
  const [timerSeconds, setTimerSeconds] = createSignal(0);
  const [gameResult, setGameResult] = createSignal<"won" | "lost" | null>(null);
  const [triggeredMine, setTriggeredMine] = createSignal<[number, number] | null>(null);
  const [digMode, setDigMode] = createSignal(true);
  const [wrongFlags, setWrongFlags] = createSignal<[number, number][]>([]);
  const [persistenceReady, setPersistenceReady] = createSignal(false);

  /** True while the pre-result animation is playing (before result screen shows) */
  const [completing, setCompleting] = createSignal(false);
  /** The cell that triggered the end of the game (last reveal for win, mine for loss) */
  const [completionOrigin, setCompletionOrigin] = createSignal<[number, number] | null>(null);

  // ── Internal mutable state ───────────────────────────────────────────────
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let completionTimer: ReturnType<typeof setTimeout> | null = null;
  let hasStartedPlaying = false;
  let boardGenerated = false;

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
  function resetProgress() {
    stopTimer();
    if (completionTimer !== null) {
      clearTimeout(completionTimer);
      completionTimer = null;
    }
    hasStartedPlaying = false;
    boardGenerated = false;
    batch(() => {
      setSelectedCell(null);
      setTimerSeconds(0);
      setGameResult(null);
      setTriggeredMine(null);
      setDigMode(true);
      setWrongFlags([]);
      setCompleting(false);
      setCompletionOrigin(null);
    });
  }

  function persistSession() {
    if (
      phase() !== "playing" ||
      gameResult() !== null ||
      completing() ||
      board().length !== rows() ||
      rows() === 0 ||
      cols() === 0
    ) {
      removeStoredValue(STORAGE_KEYS.minesweeperSession);
      return;
    }

    const session: PersistedMinesweeperSession = {
      phase: "playing",
      difficulty: difficulty(),
      board: board().map((row) => row.map((cell) => ({ ...cell }))),
      rows: rows(),
      cols: cols(),
      mineCount: mineCount(),
      timerSeconds: timerSeconds(),
      selectedCell: selectedCell(),
      digMode: digMode(),
      hasStartedPlaying,
      boardGenerated,
    };

    saveStoredJSON(STORAGE_KEYS.minesweeperSession, session);
  }

  function restoreSession() {
    const session = loadStoredJSON(STORAGE_KEYS.minesweeperSession, isPersistedMinesweeperSession);
    if (!session) return;

    hasStartedPlaying = session.hasStartedPlaying;
    boardGenerated = session.boardGenerated;

    batch(() => {
      setPhase("playing");
      setDifficulty(session.difficulty);
      setBoard(session.board.map((row) => row.map((cell) => ({ ...cell }))));
      setRows(session.rows);
      setCols(session.cols);
      setMineCount(session.mineCount);
      setSelectedCell(session.selectedCell);
      setTimerSeconds(session.timerSeconds);
      setDigMode(session.digMode);
      setGameResult(null);
      setTriggeredMine(null);
      setWrongFlags([]);
      setCompleting(false);
      setCompletionOrigin(null);
    });

    if (hasStartedPlaying && document.visibilityState === "visible") {
      startTimer();
    }
  }

  // ── Completion helper ─────────────────────────────────────────────────────
  /**
   * Plays the pre-result animation then shows the result screen.
   * Mirrors sudokuGame's `setCompleting(true) → setTimeout → setCompleted(true)`.
   *
   * @param result  "won" | "lost"
   * @param originRow  Row of the cell that ended the game (for stagger origin).
   * @param originCol  Col of the cell that ended the game.
   * @param delay  How long (ms) to wait before revealing the result screen.
   *               Defaults to 800 ms — enough for the board animation to land.
   */
  function triggerCompletion(
    result: "won" | "lost",
    originRow: number,
    originCol: number,
    delay = 800
  ) {
    batch(() => {
      setCompletionOrigin([originRow, originCol]);
      setCompleting(true);
    });
    completionTimer = setTimeout(() => {
      completionTimer = null;
      batch(() => {
        setGameResult(result);
        setCompleting(false);
      });
    }, delay);
  }

  // ── Public actions ────────────────────────────────────────────────────────

  function startGame(diff: Difficulty, isMobile = false) {
    const preset = getDifficultyPreset(diff, isMobile);

    batch(() => {
      setDifficulty(diff);
      setRows(preset.rows);
      setCols(preset.cols);
      setMineCount(preset.mines);
      setPhase("playing");
    });

    // Create empty board (mines placed on first click)
    const emptyBoard = createEmptyBoard(preset.rows, preset.cols);
    setBoard(emptyBoard);
    resetProgress();
  }

  function restart() {
    resetProgress();
    setBoard([]);
    setRows(0);
    setCols(0);
    setMineCount(0);
    setPhase("setup");
  }

  function playAgain() {
    startGame(difficulty());
  }

  function handleCellClick(row: number, col: number) {
    const currentBoard = board();
    if (!currentBoard.length) return;
    if (gameResult()) return; // Game is over

    const cell = currentBoard[row][col];

    if (digMode()) {
      // ── Dig mode ────────────────────────────────────────────────────────
      if (cell.state === "flagged") return; // Can't dig a flagged cell
      if (cell.state === "revealed") return; // Already revealed

      // First click: generate the board with safe zone
      if (!boardGenerated) {
        const generated = generateBoard(rows(), cols(), mineCount(), row, col);
        boardGenerated = true;

        // Now reveal the clicked cell on the generated board
        const revealed = revealCell(generated, row, col);
        setBoard(revealed);

        if (!hasStartedPlaying) {
          hasStartedPlaying = true;
          startTimer();
        }

        // Check win (technically impossible on first click, but be safe)
        if (checkWin(revealed)) {
          stopTimer();
          triggerCompletion("won", row, col);
        }
        return;
      }

      // Check if it's a mine
      if (isMine(currentBoard, row, col)) {
        // ── Loss ─────────────────────────────────────────────────────────
        const revealed = revealCell(currentBoard, row, col);
        const allMinesRevealed = revealAllMines(revealed);
        batch(() => {
          setBoard(allMinesRevealed);
          setTriggeredMine([row, col]);
          setWrongFlags(getWrongFlags(currentBoard));
        });
        stopTimer();
        triggerCompletion("lost", row, col);
        return;
      }

      // Normal reveal
      const revealed = revealCell(currentBoard, row, col);
      setBoard(revealed);

      if (!hasStartedPlaying) {
        hasStartedPlaying = true;
        startTimer();
      }

      // Check win
      if (checkWin(revealed)) {
        stopTimer();
        triggerCompletion("won", row, col);
      }
    } else {
      // ── Flag mode ──────────────────────────────────────────────────────
      if (!boardGenerated) return; // Can't flag before first reveal
      if (cell.state === "revealed") return; // Can't flag revealed cell

      const flagged = toggleFlag(currentBoard, row, col);
      setBoard(flagged);
    }
  }

  function toggleMode() {
    setDigMode((prev) => !prev);
  }

  function selectCell(row: number, col: number) {
    setSelectedCell(row === -1 ? null : [row, col]);
  }

  // ── Mine counter (derived) ────────────────────────────────────────────────
  function mineCounter(): number {
    return mineCount() - countFlags(board());
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  function handleMinesweeperAction(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail) handleCellClick(detail.row, detail.col);
  }

  function handleMinesweeperFlag(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail) {
      // Force flag mode for this action
      const currentBoard = board();
      if (!currentBoard.length || gameResult() || !boardGenerated) return;
      const cell = currentBoard[detail.row][detail.col];
      if (cell.state === "revealed") return;
      const flagged = toggleFlag(currentBoard, detail.row, detail.col);
      setBoard(flagged);
    }
  }

  function handleVisibility() {
    if (document.visibilityState === "hidden") {
      stopTimer();
    } else if (hasStartedPlaying && !gameResult() && !completing()) {
      startTimer();
    }
  }

  onMount(() => {
    restoreSession();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("minesweeper-action", handleMinesweeperAction);
    window.addEventListener("minesweeper-flag", handleMinesweeperFlag);
    setPersistenceReady(true);
  });

  createEffect(() => {
    if (!persistenceReady()) return;
    persistSession();
  });

  onCleanup(() => {
    if (typeof window === "undefined") return;
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("minesweeper-action", handleMinesweeperAction);
    window.removeEventListener("minesweeper-flag", handleMinesweeperFlag);
    if (timerInterval) clearInterval(timerInterval);
    if (completionTimer) clearTimeout(completionTimer);
  });

  return {
    // Signals
    phase,
    difficulty,
    board,
    rows,
    cols,
    mineCount,
    selectedCell,
    timerSeconds,
    gameResult,
    triggeredMine,
    digMode,
    wrongFlags,
    completing,
    completionOrigin,
    // Derived
    mineCounter,
    // Actions
    startGame,
    restart,
    playAgain,
    handleCellClick,
    toggleMode,
    selectCell,
  };
}
