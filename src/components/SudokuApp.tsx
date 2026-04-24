import { createSignal, onMount, onCleanup } from "solid-js";
import { generate, validate, type Board, type Cell, type Difficulty, type GridSize } from "@/lib/sudoku";
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
  let hasStartedFilling = false;

  function handleStartGame(size: GridSize, diff: Difficulty) {
    setGridSize(size);
    setDifficulty(diff);

    const result = generate(size, diff);
    setPuzzle(result.puzzle);
    setSolution(result.solution);
    setUserBoard(result.puzzle.map((row) => [...row]));
    setSelectedCell(null);
    setTimerSeconds(0);
    setCompleted(false);
    hasStartedFilling = false;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;

    setPhase("playing");
  }

  function handleRestart() {
    // Go back to setup
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    setPhase("setup");
  }

  function handlePlayAgain() {
    // Generate a new puzzle with same settings
    const size = gridSize();
    const diff = difficulty();
    const result = generate(size, diff);
    setPuzzle(result.puzzle);
    setSolution(result.solution);
    setUserBoard(result.puzzle.map((row) => [...row]));
    setSelectedCell(null);
    setTimerSeconds(0);
    setCompleted(false);
    hasStartedFilling = false;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function handleSelectCell(row: number, col: number) {
    setSelectedCell(row === -1 ? null : [row, col]);
  }

  function setCellValue(row: number, col: number, value: Cell) {
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
    if (timerInterval) clearInterval(timerInterval);
  });

  function handleBackToGames() {
    window.location.href = "/";
  }

  // ─── Setup Phase ─────────────────────────────────────────────────
  if (phase() === "setup") {
    return <SudokuSetup onStart={handleStartGame} />;
  }

  // ─── Completion Overlay ──────────────────────────────────────────
  if (completed()) {
    return (
      <CompletionScreen
        solveTime={timerSeconds()}
        gridSize={gridSize()}
        difficulty={difficulty()}
        onBackToGames={handleBackToGames}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // ─── Playing Phase ───────────────────────────────────────────────
  const size = gridSize();
  const puz = puzzle();

  return (
    <div class="flex flex-col min-h-screen">
      {/* Top bar */}
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <button
          onClick={handleRestart}
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
          <span class="text-sm font-medium hidden sm:inline">New Game</span>
        </button>

        <div class="flex items-center gap-3">
          <span class="text-sm font-mono text-[var(--color-text-secondary)] tabular-nums tracking-wider">
            {formatTimer(timerSeconds())}
          </span>
        </div>

        <ThemeToggle />
      </div>

      {/* Game info bar */}
      <div class="flex items-center justify-center gap-3 py-2 text-xs text-[var(--color-text-tertiary)]">
        <span>
          {size === 4 ? "4×4" : size === 6 ? "6×6" : "9×9"}
        </span>
        <span>·</span>
        <span class="capitalize">{difficulty()}</span>
      </div>

      {/* Puzzle area */}
      <div class="flex-1 flex flex-col items-center justify-center gap-6 py-4 px-4">
        {puz.length > 0 ? (
          <>
            <SudokuBoard
              puzzle={puz}
              solution={solution()}
              size={size}
              selectedCell={selectedCell()}
              onSelectCell={handleSelectCell}
              userBoard={userBoard()}
            />

            <NumberPad size={size} onNumber={handleNumber} onErase={handleErase} />
          </>
        ) : (
          <div class="text-[var(--color-text-tertiary)] text-sm">Loading puzzle…</div>
        )}
      </div>

      {/* Bottom bar — restart only */}
      <div class="border-t border-[var(--color-border)] px-4 py-3 flex justify-center">
        <button
          onClick={handleRestart}
          class="px-5 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-95"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
