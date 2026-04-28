import { batch, createSignal, onCleanup, onMount } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import {
  canMove,
  createEmptyGrid,
  hasWon,
  moveWithTiles,
  nextTileId,
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
    // ignore
  }
}

export function create2048Game() {
  // ── Signals ─────────────────────────────────────────────────────────────
  const [phase, setPhase] = createSignal<Phase>("setup");
  const [grid, setGrid] = createSignal<Grid>(createEmptyGrid());
  const [tiles, setTiles] = createStore<Tile[]>([]);
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
  let hasStartedPlaying = false;

  // ── Timer ───────────────────────────────────────────────────────────────

  function startTimer() {
    // Don't restart if already running — prevents the interval from being
    // recreated on every move, which would reset the 1-second cadence.
    if (timerInterval) return;
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
    setScorePopup({ value, id });
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
    hasStartedPlaying = false;
    batch(() => {
      setGrid(createEmptyGrid());
      setTiles(reconcile([]));
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

    let g = createEmptyGrid();
    const spawned: Tile[] = [];

    const first = spawnTile(g, nextTileId());
    if (first) {
      g = first.grid;
      spawned.push(first.tile);
    }
    const second = spawnTile(g, nextTileId());
    if (second) {
      g = second.grid;
      spawned.push(second.tile);
    }

    batch(() => {
      setGrid(g);
      setTiles(reconcile(spawned));
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

    const result = moveWithTiles(tiles, dir);
    if (!result.moved) return;

    // Start timer on first move
    if (!hasStartedPlaying) {
      hasStartedPlaying = true;
    }
    startTimer();

    // Build a lookup of the new tile states by ID
    const resultMap = new Map(result.tiles.map((t) => [t.id, t]));

    batch(() => {
      setGrid(result.grid);

      setTiles(
        produce((draft) => {
          // 1. Update every tile that survived in place (same object → same DOM node → CSS transition fires)
          for (const t of draft) {
            const updated = resultMap.get(t.id);
            if (updated) {
              t.row = updated.row;
              t.col = updated.col;
              t.value = updated.value;
              t.isNew = false;
              t.isMerging = updated.isMerging;
            }
          }

          // 2. Remove tiles consumed by a merge
          for (let i = draft.length - 1; i >= 0; i--) {
            if (!resultMap.has(draft[i].id)) {
              draft.splice(i, 1);
            }
          }

          // 3. Add the newly spawned tile
          const existingIds = new Set(draft.map((t) => t.id));
          for (const t of result.tiles) {
            if (!existingIds.has(t.id)) {
              draft.push({ ...t });
            }
          }
        })
      );
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

    // Check win (only once)
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

  // ── Keyboard handling ───────────────────────────────────────────────────

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
    } else if (phase() === "playing" && hasStartedPlaying && !gameOver()) {
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
    phase,
    grid,
    tiles,
    score,
    bestScore,
    hasShownWin,
    gameOver,
    timerSeconds,
    scorePopup,
    startGame,
    restart,
    playAgain,
    handleMove,
    continueAfterWin,
  };
}
