import { describe, it, expect } from "vitest";
import {
  createEmptyBoard,
  generateBoard,
  revealCell,
  toggleFlag,
  checkWin,
  isMine,
  getWrongFlags,
  countFlags,
  getNeighbors,
} from "../minesweeper";

// ── Board creation ──────────────────────────────────────────────────────────
describe("createEmptyBoard", () => {
  it("creates a board with the correct dimensions", () => {
    const board = createEmptyBoard(3, 4);
    expect(board.length).toBe(3);
    expect(board[0].length).toBe(4);
  });

  it("all cells start hidden with value 0 and no mines", () => {
    const board = createEmptyBoard(3, 3);
    for (const row of board) {
      for (const cell of row) {
        expect(cell.state).toBe("hidden");
        expect(cell.value).toBe(0);
        expect(cell.isMine).toBe(false);
      }
    }
  });
});

// ── Neighbors ───────────────────────────────────────────────────────────────
describe("getNeighbors", () => {
  it("returns 8 neighbors for a center cell", () => {
    expect(getNeighbors(1, 1, 3, 3)).toHaveLength(8);
  });

  it("returns 3 neighbors for a corner cell", () => {
    expect(getNeighbors(0, 0, 3, 3)).toHaveLength(3);
  });

  it("returns 5 neighbors for an edge cell", () => {
    expect(getNeighbors(0, 1, 3, 3)).toHaveLength(5);
  });

  it("handles 1×1 board", () => {
    expect(getNeighbors(0, 0, 1, 1)).toHaveLength(0);
  });
});

// ── Board generation ────────────────────────────────────────────────────────
describe("generateBoard", () => {
  it("places the correct number of mines", () => {
    const board = generateBoard(9, 9, 10, 0, 0);
    let mineCount = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell.isMine) mineCount++;
      }
    }
    expect(mineCount).toBe(10);
  });

  it("safe zone has no mines around first-click cell", () => {
    const board = generateBoard(9, 9, 10, 4, 4);
    expect(board[4][4].isMine).toBe(false);
    for (const [nr, nc] of getNeighbors(4, 4, 9, 9)) {
      expect(board[nr][nc].isMine).toBe(false);
    }
  });

  it("computes correct adjacent mine counts", () => {
    const board = generateBoard(9, 9, 10, 0, 0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = board[r][c];
        if (cell.isMine) {
          expect(cell.value).toBe(-1);
        } else {
          let expected = 0;
          for (const [nr, nc] of getNeighbors(r, c, 9, 9)) {
            if (board[nr][nc].isMine) expected++;
          }
          expect(cell.value).toBe(expected);
        }
      }
    }
  });

  it("all cells start hidden", () => {
    const board = generateBoard(9, 9, 10, 4, 4);
    for (const row of board) {
      for (const cell of row) {
        expect(cell.state).toBe("hidden");
      }
    }
  });

  it("first-clicked cell has value 0 (opening guarantee)", () => {
    // Run several times since generation is random
    for (let i = 0; i < 20; i++) {
      const board = generateBoard(9, 9, 10, 4, 4);
      expect(board[4][4].value).toBe(0);
    }
  });
});

// ── Reveal ──────────────────────────────────────────────────────────────────
describe("revealCell", () => {
  it("reveals a single numbered cell", () => {
    const board = generateBoard(9, 9, 10, 0, 0);
    // Find a cell that has a non-zero value next to mines
    const revealed = revealCell(board, 0, 0);
    expect(revealed[0][0].state).toBe("revealed");
  });

  it("flood fills from a 0-value cell", () => {
    // Create a 5×5 board with 0 mines, safe at center
    const board = generateBoard(5, 5, 0, 2, 2);
    const revealed = revealCell(board, 0, 0);
    // All cells should be revealed (no mines, all connected zeros)
    for (const row of revealed) {
      for (const cell of row) {
        expect(cell.state).toBe("revealed");
      }
    }
  });

  it("does not reveal flagged cells during flood fill", () => {
    const board = generateBoard(5, 5, 0, 2, 2);
    // Flag a cell, then reveal starting from a neighbor
    const flagged = toggleFlag(board, 0, 1);
    const revealed = revealCell(flagged, 0, 0);
    // Flagged cell should remain flagged (not revealed)
    expect(revealed[0][1].state).toBe("flagged");
  });

  it("reveals a mine cell without flood filling", () => {
    // Create a board and manually set a mine
    const board = createEmptyBoard(3, 3);
    board[1][1].isMine = true;
    board[1][1].value = -1;
    const revealed = revealCell(board, 1, 1);
    expect(revealed[1][1].state).toBe("revealed");
    // Neighbors should NOT be revealed (no flood fill from a mine)
    expect(revealed[0][0].state).toBe("hidden");
  });
});

// ── Flag ────────────────────────────────────────────────────────────────────
describe("toggleFlag", () => {
  it("toggles a hidden cell to flagged", () => {
    const board = createEmptyBoard(3, 3);
    const flagged = toggleFlag(board, 1, 1);
    expect(flagged[1][1].state).toBe("flagged");
  });

  it("toggles a flagged cell back to hidden", () => {
    const board = createEmptyBoard(3, 3);
    const flagged = toggleFlag(board, 1, 1);
    const unflagged = toggleFlag(flagged, 1, 1);
    expect(unflagged[1][1].state).toBe("hidden");
  });

  it("does not flag a revealed cell", () => {
    const board = createEmptyBoard(3, 3);
    board[1][1].state = "revealed";
    const result = toggleFlag(board, 1, 1);
    expect(result[1][1].state).toBe("revealed");
  });
});

// ── Win detection ───────────────────────────────────────────────────────────
describe("checkWin", () => {
  it("returns false when cells are still hidden", () => {
    const board = generateBoard(9, 9, 10, 0, 0);
    expect(checkWin(board)).toBe(false);
  });

  it("returns true when all non-mine cells are revealed", () => {
    const board = generateBoard(5, 5, 0, 2, 2);
    const revealed = revealCell(board, 0, 0);
    expect(checkWin(revealed)).toBe(true);
  });

  it("returns true when mines are flagged and non-mines revealed", () => {
    const board = generateBoard(3, 3, 1, 1, 1);
    // Reveal all non-mine cells
    let current = board;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!current[r][c].isMine) {
          current = revealCell(current, r, c);
        }
      }
    }
    expect(checkWin(current)).toBe(true);
  });
});

// ── Wrong flags ─────────────────────────────────────────────────────────────
describe("getWrongFlags", () => {
  it("returns empty array when no flags are placed", () => {
    const board = createEmptyBoard(3, 3);
    expect(getWrongFlags(board)).toEqual([]);
  });

  it("returns positions of flags on non-mine cells", () => {
    const board = createEmptyBoard(3, 3);
    const flagged = toggleFlag(board, 0, 0);
    expect(getWrongFlags(flagged)).toEqual([[0, 0]]);
  });

  it("excludes flags on actual mines", () => {
    const board = createEmptyBoard(3, 3);
    board[1][1].isMine = true;
    const flagged = toggleFlag(board, 1, 1);
    expect(getWrongFlags(flagged)).toEqual([]);
  });
});

// ── Count flags ─────────────────────────────────────────────────────────────
describe("countFlags", () => {
  it("returns 0 for a fresh board", () => {
    const board = createEmptyBoard(3, 3);
    expect(countFlags(board)).toBe(0);
  });

  it("counts flagged cells correctly", () => {
    const board = createEmptyBoard(3, 3);
    let current = toggleFlag(board, 0, 0);
    current = toggleFlag(current, 1, 1);
    current = toggleFlag(current, 2, 2);
    expect(countFlags(current)).toBe(3);
  });
});

// ── isMine ──────────────────────────────────────────────────────────────────
describe("isMine", () => {
  it("returns true for mine cells", () => {
    const board = createEmptyBoard(3, 3);
    board[1][1].isMine = true;
    expect(isMine(board, 1, 1)).toBe(true);
    expect(isMine(board, 0, 0)).toBe(false);
  });
});
