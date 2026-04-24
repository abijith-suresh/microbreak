import { createSignal, onMount, onCleanup } from "solid-js";
import { generate, validate, type Board, type Cell, type Difficulty, type GridSize } from "@/lib/sudoku";
import SudokuBoard from "./SudokuBoard";
import SudokuControls from "./SudokuControls";
import NumberPad from "./NumberPad";
import CompletionScreen from "./CompletionScreen";
import ThemeToggle from "./ThemeToggle";

const SIZE_KEY = "microbreak-grid-size";
const DIFF_KEY = "microbreak-difficulty";

function getStoredSize(): GridSize {
  const val = localStorage.getItem(SIZE_KEY);
  if (val === "4") return 4;
  if (val === "6") return 6;
  return 9;
}

function getStoredDifficulty(): Difficulty {
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
  const [gridSize, setGridSize] = createSignal<GridSize>(9);
  const [difficulty, setDifficulty] = createSignal<Difficulty>("medium");

  const [puzzle, setPuzzle] = createSignal<Board>([]);
  const [solution, setSolution] = createSignal<Board>([]);
  const [userBoard, setUserBoard] = createSignal<Board>([]);

  const [selectedCell, setSelectedCell] = createSignal<[number, number] | null>(null);
  const [timerSeconds, setTimerSeconds] = createSignal(0);
  const [timerRunning, setTimerRunning] = createSignal(false);
  const [completed, setCompleted] = createSignal(false);

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let hasStartedFilling = false;

  function newPuzzle(size?: GridSize, diff?: Difficulty) {
    const s = size || gridSize();
    const d = diff || difficulty();
    const result = generate(s, d);
    setPuzzle(result.puzzle);
    setSolution(result.solution);
    setUserBoard(result.puzzle.map((row) => [...row]));
    setSelectedCell(null);
    setTimerSeconds(0);
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    setTimerRunning(false);
    setCompleted(false);
    hasStartedFilling = false;
  }

  function handleSelectCell(row: number, col: number) {
    if (row === -1 && col === -1) {
      setSelectedCell(null);
    } else {
      setSelectedCell([row, col]);
    }
  }

  function setCellValue(row: number, col: number, value: Cell) {
    const puz = puzzle();
    if (!puz.length) return;
    if (puz[row][col] !== null) return; // given cell

    const newBoard = userBoard().map((r) => [...r]);
    newBoard[row][col] = value;
    setUserBoard(newBoard);

    if (!hasStartedFilling && value !== null) {
      hasStartedFilling = true;
      startTimer();
    }

    // Check completion
    if (value !== null && isBoardFull(newBoard) && validate(newBoard)) {
      stopTimer();
      setCompleted(true);
    }
  }

  function isBoardFull(board: Board): boolean {
    const s = gridSize();
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (board[r][c] === null) return false;
      }
    }
    return true;
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      setTimerSeconds((t) => t + 1);
    }, 1000);
    setTimerRunning(true);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    setTimerRunning(false);
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

  // Listen for keyboard inputs from SudokuBoard
  function handleSudokuNumberInput(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail) {
      setCellValue(detail.row, detail.col, detail.num);
    }
  }

  function handleSudokuErase(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail) {
      setCellValue(detail.row, detail.col, null);
    }
  }

  // Timer logic is handled in startTimer/stopTimer directly
  // No createEffect needed since we manage the interval manually

  // Visibility-based pause
  function handleVisibility() {
    if (document.visibilityState === "hidden") {
      stopTimer();
    } else if (hasStartedFilling && !completed()) {
      startTimer();
    }
  }

  onMount(() => {
    // Load stored preferences
    const storedSize = getStoredSize();
    const storedDiff = getStoredDifficulty();
    setGridSize(storedSize);
    setDifficulty(storedDiff);
    newPuzzle(storedSize, storedDiff);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("sudoku-number-input", handleSudokuNumberInput);
    window.addEventListener("sudoku-erase", handleSudokuErase);
  });

  onCleanup(() => {
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("sudoku-number-input", handleSudokuNumberInput);
    window.removeEventListener("sudoku-erase", handleSudokuErase);
    if (timerInterval) clearInterval(timerInterval);
  });

  function handleBackToGames() {
    window.location.href = "/";
  }

  function handlePlayAgain() {
    newPuzzle();
  }

  return (
    <div class="flex flex-col min-h-screen">
      {completed() ? (
        <CompletionScreen
          solveTime={timerSeconds()}
          gridSize={gridSize()}
          difficulty={difficulty()}
          onBackToGames={handleBackToGames}
          onPlayAgain={handlePlayAgain}
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
              <span class="text-sm font-mono text-[var(--color-text-secondary)] tabular-nums tracking-wider">
                {formatTimer(timerSeconds())}
              </span>
            </div>

            <ThemeToggle />
          </div>

          {/* Puzzle area */}
          <div class="flex-1 flex flex-col items-center justify-center gap-6 py-6 px-4">
            <SudokuBoard
              puzzle={puzzle()}
              solution={solution()}
              size={gridSize()}
              selectedCell={selectedCell()}
              onSelectCell={handleSelectCell}
              userBoard={userBoard()}
            />

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
