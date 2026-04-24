import { createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { generate, validate, type Board, type Cell, type Difficulty, type GridSize } from "@/lib/sudoku";
import SudokuBoard from "./SudokuBoard";
import SudokuControls from "./SudokuControls";
import NumberPad from "./NumberPad";
import CompletionScreen from "./CompletionScreen";

const THEME_KEY = "microbreak-theme";
const SIZE_KEY = "microbreak-grid-size";
const DIFF_KEY = "microbreak-difficulty";

function getStoredSize(): GridSize {
  if (typeof window === "undefined") return 9;
  const val = localStorage.getItem(SIZE_KEY);
  if (val === "4") return 4;
  if (val === "6") return 6;
  return 9;
}

function getStoredDifficulty(): Difficulty {
  if (typeof window === "undefined") return "medium";
  const val = localStorage.getItem(DIFF_KEY);
  if (val === "easy" || val === "medium" || val === "hard") return val;
  return "medium";
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SudokuApp() {
  const [gridSize, setGridSize] = createSignal<GridSize>(getStoredSize());
  const [difficulty, setDifficulty] = createSignal<Difficulty>(getStoredDifficulty());

  const initialPuzzle = generate(getStoredSize(), getStoredDifficulty());
  const [puzzle, setPuzzle] = createSignal<Board>(initialPuzzle.puzzle);
  const [solution, setSolution] = createSignal<Board>(initialPuzzle.solution);

  const [timerSeconds, setTimerSeconds] = createSignal(0);
  const [timerRunning, setTimerRunning] = createSignal(false);
  const [completed, setCompleted] = createSignal(false);

  let timerInterval: ReturnType<typeof setInterval> | undefined;
  let hasStartedFilling = false;

  function newPuzzle(size?: GridSize, diff?: Difficulty) {
    const s = size || gridSize();
    const d = diff || difficulty();
    const result = generate(s, d);
    setPuzzle(result.puzzle);
    setSolution(result.solution);
    setTimerSeconds(0);
    setTimerRunning(false);
    setCompleted(false);
    hasStartedFilling = false;
    clearInterval(timerInterval);
  }

  function handleSizeChange(newSize: GridSize) {
    setGridSize(newSize);
    localStorage.setItem(SIZE_KEY, String(newSize));
    newPuzzle(newSize);
  }

  function handleDifficultyChange(newDiff: Difficulty) {
    setDifficulty(newDiff);
    localStorage.setItem(DIFF_KEY, newDiff);
    newPuzzle(undefined, newDiff);
  }

  function handleCellChange(row: number, col: number, value: Cell) {
    if (!hasStartedFilling && value !== null) {
      hasStartedFilling = true;
      setTimerRunning(true);
    }
  }

  function handleComplete() {
    // Validate the current board
    const board = getCurrentBoard();
    if (validate(board)) {
      setTimerRunning(false);
      clearInterval(timerInterval);
      setCompleted(true);
    }
  }

  function getCurrentBoard(): Board {
    // Access the user board from SudokuBoard via DOM
    // We'll reconstruct from the rendered cells
    const s = gridSize();
    const board: Board = Array.from({ length: s }, () => Array(s).fill(null));
    const gridEl = document.querySelector("[data-sudoku-board]");
    if (!gridEl) return board;

    const cells = gridEl.querySelectorAll(".sudoku-cell");
    cells.forEach((cell, idx) => {
      const r = Math.floor(idx / s);
      const c = idx % s;
      const val = cell.textContent?.trim();
      board[r][c] = val ? parseInt(val) : null;
    });
    return board;
  }

  // Timer logic
  createEffect(() => {
    if (timerRunning()) {
      timerInterval = setInterval(() => {
        setTimerSeconds((t) => t + 1);
      }, 1000);
    } else {
      clearInterval(timerInterval);
    }
  });

  // Visibility-based pause
  function handleVisibility() {
    if (typeof document === "undefined") return;
    if (document.visibilityState === "hidden") {
      setTimerRunning(false);
    } else if (hasStartedFilling && !completed()) {
      setTimerRunning(true);
    }
  }

  onMount(() => {
    document.addEventListener("visibilitychange", handleVisibility);
  });

  onCleanup(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibility);
    }
    clearInterval(timerInterval);
  });

  // Number pad handler
  function handleNumber(num: number) {
    const selFn = (window as unknown as Record<string, unknown>).__sudokuSelectedCell as
      | (() => [number, number] | null)
      | undefined;
    const setFn = (window as unknown as Record<string, unknown>).__sudokuSetCellValue as
      | ((r: number, c: number, v: Cell) => void)
      | undefined;
    if (!selFn || !setFn) return;

    const sel = selFn();
    if (!sel) return;
    setFn(sel[0], sel[1], num);
  }

  function handleErase() {
    const selFn = (window as unknown as Record<string, unknown>).__sudokuSelectedCell as
      | (() => [number, number] | null)
      | undefined;
    const setFn = (window as unknown as Record<string, unknown>).__sudokuSetCellValue as
      | ((r: number, c: number, v: Cell) => void)
      | undefined;
    if (!selFn || !setFn) return;

    const sel = selFn();
    if (!sel) return;
    setFn(sel[0], sel[1], null);
  }

  function handleBackToGames() {
    window.location.href = "/";
  }

  function handlePlayAgain() {
    newPuzzle();
  }

  // Theme toggle clone for completion screen
  let themeToggleEl: HTMLElement | undefined;

  onMount(() => {
    themeToggleEl = document.querySelector("[data-theme-toggle]")?.cloneNode(true) as HTMLElement;
    if (themeToggleEl) {
      themeToggleEl.addEventListener("click", () => {
        const toggle = document.querySelector("[data-theme-toggle]");
        if (toggle) (toggle as HTMLButtonElement).click();
      });
    }
  });

  return (
    <div class="flex flex-col min-h-screen">
      {completed() ? (
        <CompletionScreen
          solveTime={timerSeconds()}
          gridSize={gridSize()}
          difficulty={difficulty()}
          onBackToGames={handleBackToGames}
          onPlayAgain={handlePlayAgain}
          themeToggle={themeToggleEl!}
        />
      ) : (
        <>
          {/* Top bar */}
          <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <a
              href="/"
              class="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="shrink-0">
                <path
                  d="M12.5 15L7.5 10L12.5 5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span class="text-sm font-medium hidden sm:inline">Back</span>
            </a>

            <div class="flex items-center gap-3">
              <span class="text-sm font-mono text-[var(--color-text-secondary)] tabular-nums">
                {formatTimer(timerSeconds())}
              </span>
            </div>

            <div class="w-9">
              {/* Spacer for balance — theme toggle is in layout */}
            </div>
          </div>

          {/* Puzzle area */}
          <div class="flex-1 flex flex-col items-center justify-center gap-6 py-6 px-4">
            <div data-sudoku-board>
              <SudokuBoard
                puzzle={puzzle()}
                solution={solution()}
                size={gridSize()}
                onCellChange={handleCellChange}
                onComplete={handleComplete}
              />
            </div>

            <NumberPad size={gridSize()} onNumber={handleNumber} onErase={handleErase} />
          </div>

          {/* Bottom bar */}
          <div class="border-t border-[var(--color-border)] px-4 py-3">
            <SudokuControls
              currentSize={gridSize()}
              currentDifficulty={difficulty()}
              onSizeChange={handleSizeChange}
              onDifficultyChange={handleDifficultyChange}
              onNewPuzzle={() => newPuzzle()}
            />
          </div>
        </>
      )}
    </div>
  );
}
