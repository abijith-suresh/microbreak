/**
 * create2048Game — SolidJS composable for all 2048 game state.
 *
 * Mirrors the sudokuGame.ts / minesweeperGame.ts architecture: encapsulates
 * signals, derived values, actions, timer management, and event listeners so
 * Game2048App.tsx can be a pure layout shell.
 */

import { batch, createSignal, onCleanup, onMount } from "solid-js";
import {
  canMove,
  createEmptyGrid,
  hasWon,
  move,
  resetTileIdCounter,
  spawnTile,
  type Direction,
  type Grid,
  type Tile,
} from "./game2048";

export type Phase = "setup" | "playing";

// ── Best score persistence ────────────────────────────────────────────────────

function loadBestScore(): number {
  try {
    const stored = localStorage.getItem("microbreak-2048-best");
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number) {
  try {
    localStorage.setItem("microbreak-2048-best", String(score));
  } catch {
    // Ignore storage errors
  }
}

export function create2048Game() {
  // ── Raw signals ─────────────────────────────────────────────────────────
  const [phase, setPhase] = createSignal<Phase>("setup");
  const [grid, setGrid] = createSignal<Grid>(createEmptyGrid());
  const [tiles, setTiles] = createSignal<Tile[]>([]);
  const [score, setScore] = createSignal(0);
  const [bestScore, setBestScore] = createSignal(loadBestScore());
  const [hasShownWin, setHasShownWin] = createSignal(false);
  const [gameOver, setGameOver] = createSignal(false);
  const [timerSeconds, setTimerSeconds] = createSignal(0);
  const [scorePopup, setScorePopup] = createSignal<{ value: number; id: number } | null>(null);

  // ── Internal mutable state ──────────────────────────────────────────────
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let popupTimer: ReturnType<typeof setTimeout> | null = null;
  let popupId = 0;
  let hasWonOnce = false;

  // ── Timer ───────────────────────────────────────────────────────────────

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

  // ── Score popup ─────────────────────────────────────────────────────────

  function showScorePopup(value: number) {
    if (popupTimer) clearTimeout(popupTimer);
    const id = ++popupId;
    batch(() => {
      setScorePopup({ value, id });
    });
    popupTimer = setTimeout(() => {
      setScorePopup(null);
      popupTimer = null;
    }, 600);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  function resetState() {
    stopTimer();
    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }
    hasWonOnce = false;
    batch(() => {
      setGrid(createEmptyGrid());
      setTiles([]);
      setScore(0);
      setHasShownWin(false);
      setGameOver(false);
      setTimerSeconds(0);
      setScorePopup(null);
    });
  }

  // ── Public actions ──────────────────────────────────────────────────────

  function startGame() {
    resetTileIdCounter();
    resetState();
    setPhase("playing");

    // Create empty grid and spawn 2 initial tiles
    let g = createEmptyGrid();
    const spawned: Tile[] = [];

    const first = spawnTile(g, 1);
    if (first) {
      g = first.grid;
      spawned.push(first.tile);
    }

    const second = spawnTile(g, 2);
    if (second) {
      g = second.grid;
      spawned.push(second.tile);
    }

    batch(() => {
      setGrid(g);
      setTiles(spawned);
    });
  }

  function restart() {
    resetState();
    setPhase("setup");
  }

  function playAgain() {
    startGame();
  }

  function handleMove(dir: Direction) {
    if (phase() !== "playing") return;
    if (gameOver()) return;

    const currentGrid = grid();
    const result = move(currentGrid, dir);

    if (!result.moved) return;

    // Start timer on first move
    startTimer();

    batch(() => {
      setGrid(result.grid);
      setTiles(result.tiles);
    });

    // Update score
    if (result.score > 0) {
      const newScore = score() + result.score;
      setScore(newScore);
      showScorePopup(result.score);

      if (newScore > bestScore()) {
        setBestScore(newScore);
        saveBestScore(newScore);
      }
    }

    // Check win (only show overlay once)
    if (!hasWonOnce && hasWon(result.grid)) {
      hasWonOnce = true;
      setHasShownWin(true);
    }

    // Check loss
    if (!canMove(result.grid)) {
      stopTimer();
      setGameOver(true);
    }
  }

  function continueAfterWin() {
    setHasShownWin(false);
  }

  // ── Keyboard / swipe handling ───────────────────────────────────────────

  function handleKeydown(e: KeyboardEvent) {
    const dirMap: Record<string, Direction> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    const dir = dirMap[e.key];
    if (dir) {
      e.preventDefault();
      handleMove(dir);
    }
  }

  // ── Visibility handling ─────────────────────────────────────────────────

  function handleVisibility() {
    if (document.visibilityState === "hidden") {
      stopTimer();
    } else if (phase() === "playing" && !gameOver()) {
      startTimer();
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", handleVisibility);
  });

  onCleanup(() => {
    if (typeof window === "undefined") return;
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("visibilitychange", handleVisibility);
    stopTimer();
    if (popupTimer) clearTimeout(popupTimer);
  });

  return {
    // Signals
    phase,
    grid,
    tiles,
    score,
    bestScore,
    hasShownWin,
    gameOver,
    timerSeconds,
    scorePopup,
    // Actions
    startGame,
    restart,
    playAgain,
    handleMove,
    continueAfterWin,
  };
}
