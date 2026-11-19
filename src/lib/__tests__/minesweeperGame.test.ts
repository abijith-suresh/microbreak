import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMinesweeperGame } from "../minesweeperGame";

describe("minesweeper completion window", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps a win when a mine is clicked during the win animation", () => {
    createRoot((dispose) => {
      const game = createMinesweeperGame();
      game.startGame("beginner");
      game.handleCellClick(0, 0);

      for (let r = 0; r < game.rows() && !game.completing(); r++) {
        for (let c = 0; c < game.cols() && !game.completing(); c++) {
          const cell = game.board()[r][c];
          if (!cell.isMine && cell.state === "hidden") game.handleCellClick(r, c);
        }
      }
      expect(game.completing()).toBe(true);

      const mines = game
        .board()
        .flatMap((row, r) => row.flatMap((cell, c) => (cell.isMine ? [[r, c]] : [])));
      const [mr, mc] = mines[0];
      const before = game.board();
      game.handleCellClick(mr, mc);
      game.flagCell(mr, mc);
      expect(game.board()).toBe(before);

      vi.advanceTimersByTime(800);
      expect(game.gameResult()).toBe("won");
      dispose();
    });
  });
});
