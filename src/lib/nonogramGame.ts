/**
 * createNonogramGame — SolidJS composable for all Nonograms game state.
 *
 * Holds the puzzle, marks, mode, timer and result, saves on every change and resumes the
 * save on mount. NonogramsApp.tsx stays a layout shell.
 */

import { batch, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { nonogramVariant, recordBest } from "./bests";
import { createElapsedTimer } from "./elapsedTimer";
import { loadNonogramSize, saveNonogramSize } from "./gamePreferences";
import {
  applyStroke,
  type CellMark,
  createEmptyMarks,
  generatePuzzle,
  isSolved,
  type Marks,
  type NonogramPuzzle,
  type NonogramSize,
  puzzleFromSolution,
  type Stroke,
  satisfiedClues,
  setMark,
  startStroke,
} from "./nonogram";
import {
  decodeSolution,
  encodeSolution,
  isPersistedNonogramSession,
  type PersistedNonogramSession,
} from "./nonogramSession";
import { loadStoredJSON, removeStoredValue, saveStoredJSON } from "./storage";
import { STORAGE_KEYS } from "./storageKeys";

export type Mode = "fill" | "cross";

/** How long the board's win wave plays before the result screen. */
const COMPLETION_MS = 700;

export function createNonogramGame() {
  const [size, setSize] = createSignal<NonogramSize>(10);
  const [puzzle, setPuzzle] = createSignal<NonogramPuzzle | null>(null);
  const [marks, setMarks] = createSignal<Marks>([]);
  const [mode, setMode] = createSignal<Mode>("fill");
  const [selectedCell, setSelectedCell] = createSignal<[number, number] | null>(null);
  const [timerSeconds, setTimerSeconds] = createSignal(0);
  const [gameResult, setGameResult] = createSignal<"won" | null>(null);
  const [completing, setCompleting] = createSignal(false);
  const [newBest, setNewBest] = createSignal(false);
  const [persistenceReady, setPersistenceReady] = createSignal(false);

  const timer = createElapsedTimer({ getValue: timerSeconds, setValue: setTimerSeconds });
  let hasStartedPlaying = false;
  let completionTimer: ReturnType<typeof setTimeout> | null = null;

  /** The drag in progress: the marks it started from, where it started, and what it paints. */
  let stroke: { base: Marks; from: [number, number]; stroke: Stroke } | null = null;

  const satisfied = createMemo(() => {
    const p = puzzle();
    const m = marks();
    if (!p || m.length !== p.size) return { rows: [], cols: [] };
    return satisfiedClues(p, m);
  });

  const isPlayable = () => puzzle() !== null && gameResult() === null && !completing();

  // ── Saving ────────────────────────────────────────────────────────────────

  function persistSession() {
    const p = puzzle();
    if (!p) {
      removeStoredValue(STORAGE_KEYS.nonogramSession);
      return;
    }
    // A won board stays saved as won until the next game starts.
    const session: PersistedNonogramSession = {
      status: gameResult() ?? (completing() ? "won" : "playing"),
      newBest: newBest(),
      timerSeconds: timerSeconds(),
      size: p.size,
      solution: encodeSolution(p.solution),
      marks: marks(),
      mode: mode(),
      selectedCell: selectedCell(),
      hasStartedPlaying,
    };
    saveStoredJSON(STORAGE_KEYS.nonogramSession, session);
  }

  function restoreSession(): boolean {
    const session = loadStoredJSON(STORAGE_KEYS.nonogramSession, isPersistedNonogramSession);
    if (!session) return false;

    hasStartedPlaying = session.hasStartedPlaying;
    batch(() => {
      setSize(session.size);
      setPuzzle(puzzleFromSolution(decodeSolution(session.solution)));
      setMarks(session.marks.map((row) => [...row]));
      setMode(session.mode);
      setSelectedCell(session.selectedCell);
      setTimerSeconds(session.timerSeconds);
      setGameResult(session.status === "won" ? "won" : null);
      setNewBest(session.newBest);
    });

    if (
      session.status === "playing" &&
      hasStartedPlaying &&
      document.visibilityState === "visible"
    ) {
      timer.start();
    }
    return true;
  }

  // ── Moves ─────────────────────────────────────────────────────────────────

  function commit(next: Marks) {
    if (next === marks()) return;
    setMarks(next);
    if (!hasStartedPlaying) {
      hasStartedPlaying = true;
      timer.start();
    }
  }

  function checkWin() {
    const p = puzzle();
    if (!p || gameResult() || completing() || !isSolved(p, marks())) return;
    timer.stop();
    setSelectedCell(null);
    setNewBest(recordBest("nonograms", nonogramVariant(p.size), { seconds: timerSeconds() }).isNew);
    setCompleting(true);
    completionTimer = setTimeout(() => {
      completionTimer = null;
      batch(() => {
        setGameResult("won");
        setCompleting(false);
      });
    }, COMPLETION_MS);
  }

  /** Starts a tap or drag on a cell. `mark` overrides the mode (a right-click crosses). */
  function beginStroke(row: number, col: number, mark: Stroke["mark"] = markForMode()) {
    if (!isPlayable()) return;
    const current = marks();
    const base = switchOtherMark(current, row, col, mark);
    // After a switch the stroke paints, even though its first cell now holds the mark.
    const paint = base === current ? startStroke(base, row, col, mark) : { mark, erase: false };
    stroke = { base, from: [row, col], stroke: paint };
    setSelectedCell([row, col]);
    commit(applyStroke(base, [row, col], [row, col], paint));
  }

  /**
   * A press on a cell holding the other mark switches it: a fill over a cross, or a cross
   * over a fill. Cells the drag passes over still keep their marks.
   */
  function switchOtherMark(current: Marks, row: number, col: number, mark: Stroke["mark"]) {
    const other = mark === "filled" ? "crossed" : "filled";
    return current[row]?.[col] === other ? setMark(current, row, col, mark) : current;
  }

  /** Moves the drag to a cell. The line is redrawn from where it started, so it can shrink. */
  function extendStroke(row: number, col: number) {
    if (!stroke || !isPlayable()) return;
    setSelectedCell([row, col]);
    commit(applyStroke(stroke.base, stroke.from, [row, col], stroke.stroke));
  }

  function endStroke() {
    if (!stroke) return;
    stroke = null;
    checkWin();
  }

  function markForMode(): Stroke["mark"] {
    return mode() === "fill" ? "filled" : "crossed";
  }

  /**
   * One keyboard or screen-reader action on a cell. "filled" and "crossed" toggle that mark,
   * "mode" toggles the current mode's mark, and "empty" clears the cell.
   */
  function markCell(row: number, col: number, action: CellMark | "mode") {
    if (!isPlayable()) return;
    setSelectedCell([row, col]);
    const current = marks();
    if (action === "empty") {
      commit(setMark(current, row, col, "empty"));
    } else {
      const mark = action === "mode" ? markForMode() : action;
      const switched = switchOtherMark(current, row, col, mark);
      commit(
        switched === current
          ? applyStroke(current, [row, col], [row, col], startStroke(current, row, col, mark))
          : switched
      );
    }
    checkWin();
  }

  function selectCell(row: number, col: number) {
    setSelectedCell(row < 0 ? null : [row, col]);
  }

  // ── New games ─────────────────────────────────────────────────────────────

  function startGame(nextSize: NonogramSize) {
    saveNonogramSize(nextSize);
    timer.stop();
    if (completionTimer !== null) {
      clearTimeout(completionTimer);
      completionTimer = null;
    }
    hasStartedPlaying = false;
    stroke = null;
    const next = generatePuzzle(nextSize);
    batch(() => {
      setSize(nextSize);
      setPuzzle(next);
      setMarks(createEmptyMarks(nextSize));
      setSelectedCell(null);
      setTimerSeconds(0);
      setGameResult(null);
      setCompleting(false);
      setNewBest(false);
    });
  }

  function playAgain() {
    startGame(size());
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  function handleVisibility() {
    if (document.visibilityState === "hidden") {
      timer.stop();
    } else if (hasStartedPlaying && isPlayable()) {
      timer.start();
    }
  }

  onMount(() => {
    if (!restoreSession()) startGame(loadNonogramSize());
    document.addEventListener("visibilitychange", handleVisibility);
    setPersistenceReady(true);
  });

  createEffect(() => {
    if (!persistenceReady()) return;
    persistSession();
  });

  onCleanup(() => {
    if (typeof window === "undefined") return;
    document.removeEventListener("visibilitychange", handleVisibility);
    timer.stop();
    if (completionTimer !== null) clearTimeout(completionTimer);
  });

  return {
    size,
    puzzle,
    marks,
    mode,
    selectedCell,
    timerSeconds,
    gameResult,
    completing,
    newBest,
    satisfied,
    setMode,
    beginStroke,
    extendStroke,
    endStroke,
    markCell,
    selectCell,
    startGame,
    playAgain,
  };
}
