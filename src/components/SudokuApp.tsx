import { batch, createSignal, onMount, onCleanup, Show } from "solid-js";
import {
  generate,
  validate,
  type Board,
  type Cell,
  type Difficulty,
  type GridSize,
} from "@/lib/sudoku";
import SudokuBoard from "./SudokuBoard";
import SudokuSetup from "./SudokuSetup";
import NumberPad from "./NumberPad";
import CompletionScreen from "./CompletionScreen";
import ThemeToggle from "./ThemeToggle";

type Phase = "setup" | "playing";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function sizeLabel(size: GridSize): string {
  if (size === 4) return "4×4";
  if (size === 6) return "6×6";
  return "9×9";
}

export default function SudokuApp() {
  const [phase, setPhase] = createSignal<Phase>("setup");
  const [gridSize, setGridSize] = createSignal<GridSize>(9);
  const [difficulty, setDifficulty] = createSignal<Difficulty>("medium");

  const [puzzle, setPuzzle] = createSignal<Board>([]);
  const [solution, setSolution] = createSignal<Board>([]);
  const [userBoard, setUserBoard] = createSignal<Board>([]);

  const [selectedCell, setSelectedCell] = createSignal<[number, number] | null>(null);
  const [timerSeconds, setTimerSeconds] = createSignal(0);
  const [completed, setCompleted] = createSignal(false);

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let pendingGeneration: number | null = null;
  let hasStartedFilling = false;

  function resetProgress() {
    stopTimer();
    hasStartedFilling = false;
    batch(() => {
      setSelectedCell(null);
      setTimerSeconds(0);
      setCompleted(false);
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

  function queuePuzzleGeneration(size: GridSize, diff: Difficulty) {
    clearPendingGeneration();
    prepareLoadingState();

    pendingGeneration = window.setTimeout(() => {
      pendingGeneration = null;
      applyPuzzle(size, diff);
    }, 0);
  }

  function handleStartGame(size: GridSize, diff: Difficulty) {
    batch(() => {
      setGridSize(size);
      setDifficulty(diff);
      setPhase("playing");
    });

    queuePuzzleGeneration(size, diff);
  }

  function handleRestart() {
    clearPendingGeneration();
    prepareLoadingState();
    setPhase("setup");
  }

  function handlePlayAgain() {
    queuePuzzleGeneration(gridSize(), difficulty());
  }

  function handleSelectCell(row: number, col: number) {
    setSelectedCell(row === -1 ? null : [row, col]);
  }

  function setCellValue(row: number, col: number, value: Cell) {
    const puz = puzzle();
    if (!puz.length) return;
    if (puz[row][col] !== null) return;

    const newBoard = userBoard().map((r) => [...r]);
    newBoard[row][col] = value;
    setUserBoard(newBoard);

    if (!hasStartedFilling && value !== null) {
      hasStartedFilling = true;
      startTimer();
    }

    if (value !== null && isBoardFull(newBoard) && validate(newBoard)) {
      stopTimer();
      setCompleted(true);
    }
  }

  function isBoardFull(board: Board): boolean {
    for (const row of board) {
      for (const cell of row) {
        if (cell === null) return false;
      }
    }
    return true;
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      setTimerSeconds((t) => t + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function handleNumber(num: number) {
    const sel = selectedCell();
    if (!sel) return;
    setCellValue(sel[0], sel[1], num);
  }

  function handleErase() {
    const sel = selectedCell();
    if (!sel) return;
    setCellValue(sel[0], sel[1], null);
  }

  function handleSudokuNumberInput(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail) setCellValue(detail.row, detail.col, detail.num);
  }

  function handleSudokuErase(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail) setCellValue(detail.row, detail.col, null);
  }

  function handleVisibility() {
    if (document.visibilityState === "hidden") {
      stopTimer();
    } else if (hasStartedFilling && !completed()) {
      startTimer();
    }
  }

  onMount(() => {
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("sudoku-number-input", handleSudokuNumberInput);
    window.addEventListener("sudoku-erase", handleSudokuErase);
  });

  onCleanup(() => {
    if (typeof window === "undefined") return;
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("sudoku-number-input", handleSudokuNumberInput);
    window.removeEventListener("sudoku-erase", handleSudokuErase);
    clearPendingGeneration();
    if (timerInterval) clearInterval(timerInterval);
  });

  function handleBackToGames() {
    window.location.href = "/";
  }

  return (
    <>
      {/* ── Setup Phase ──────────────────────────────────────────── */}
      <Show when={phase() === "setup"}>
        <SudokuSetup onStart={handleStartGame} />
      </Show>

      {/* ── Completion Overlay ───────────────────────────────────── */}
      <Show when={phase() === "playing" && completed()}>
        <CompletionScreen
          solveTime={timerSeconds()}
          gridSize={gridSize()}
          difficulty={difficulty()}
          onBackToGames={handleBackToGames}
          onPlayAgain={handlePlayAgain}
        />
      </Show>

      {/* ── Playing Phase ────────────────────────────────────────── */}
      <Show when={phase() === "playing" && !completed()}>
        <div class="flex flex-col min-h-screen">
          {/* Top bar */}
          <div class="flex items-center justify-between px-5 py-3">
            <button
              onClick={handleRestart}
              class="flex items-center gap-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" class="shrink-0">
                <path
                  d="M12.5 15L7.5 10L12.5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span class="text-sm font-medium hidden sm:inline">New Game</span>
            </button>

            <div class="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
              <span>{sizeLabel(gridSize())}</span>
              <span class="opacity-40">·</span>
              <span class="capitalize">{difficulty()}</span>
              <span class="opacity-40 mx-1">|</span>
              <span class="font-mono tabular-nums tracking-wider text-[var(--color-text-secondary)]">
                {formatTimer(timerSeconds())}
              </span>
            </div>

            <ThemeToggle />
          </div>

          {/* Thin separator */}
          <div class="h-px bg-[var(--color-border)]" />

          {/* Puzzle area */}
          <div class="flex-1 flex flex-col items-center justify-center gap-6 py-6 px-4">
            <Show
              when={
                puzzle().length === gridSize() &&
                solution().length === gridSize() &&
                userBoard().length === gridSize()
              }
              fallback={
                <div class="text-[var(--color-text-tertiary)] text-sm">Loading puzzle…</div>
              }
            >
              <SudokuBoard
                puzzle={puzzle()}
                solution={solution()}
                size={gridSize()}
                selectedCell={selectedCell()}
                onSelectCell={handleSelectCell}
                userBoard={userBoard()}
              />

              <NumberPad size={gridSize()} onNumber={handleNumber} onErase={handleErase} />
            </Show>
          </div>

          {/* Bottom bar */}
          <div class="px-4 pb-5 flex justify-center">
            <button
              onClick={handleRestart}
              class="px-5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-tertiary)] transition-all duration-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-95"
            >
              Restart
            </button>
          </div>
        </div>
      </Show>
    </>
  );
}
