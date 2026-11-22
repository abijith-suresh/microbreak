import { render, screen, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { CalcudokuPuzzle } from "@/lib/calcudoku";
import type { PersistedCalcudokuSession } from "@/lib/calcudokuSession";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import CalcudokuApp from "../CalcudokuApp";

const solution = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

const pair = (a: [number, number], b: [number, number]): [number, number][] => [a, b];

const puzzle: CalcudokuPuzzle = {
  size: 4,
  solution,
  cages: [
    { cells: pair([0, 0], [1, 0]), operation: "subtract", target: 2 },
    { cells: pair([0, 1], [0, 2]), operation: "multiply", target: 6 },
    { cells: [[0, 3]], operation: "given", target: 4 },
    { cells: pair([1, 1], [1, 2]), operation: "divide", target: 4 },
    { cells: pair([1, 3], [2, 3]), operation: "add", target: 5 },
    {
      cells: [
        [2, 0],
        [3, 0],
        [3, 1],
      ],
      operation: "add",
      target: 9,
    },
    { cells: pair([2, 1], [2, 2]), operation: "subtract", target: 3 },
    { cells: pair([3, 2], [3, 3]), operation: "divide", target: 2 },
  ],
};

/** Everything solved but the bottom-right 2÷ cage. The save is the game's own resume path. */
function seedAlmostSolved() {
  const values = solution.map((row, r) => row.map((v, c) => (r === 3 && c >= 2 ? null : v)));
  const session: PersistedCalcudokuSession = {
    status: "playing",
    newBest: false,
    timerSeconds: 12,
    difficulty: "easy",
    puzzle,
    values,
    notes: values.map((row) => row.map(() => [])),
    selectedCell: null,
    notesMode: false,
    hasStartedFilling: true,
  };
  localStorage.setItem(STORAGE_KEYS.calcudokuSession, JSON.stringify(session));
}

function saved(): PersistedCalcudokuSession {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.calcudokuSession) ?? "null");
}

const cell = (row: number, col: number) =>
  screen.getByRole("gridcell", { name: new RegExp(`^Row ${row}, column ${col},`) });

describe("Calcudoku", () => {
  it("takes notes, shows a conflict and a broken cage, then wins", async () => {
    seedAlmostSolved();
    render(() => <CalcudokuApp />);
    const user = userEvent.setup();
    await waitFor(() => expect(cell(4, 3)).toBeTruthy());

    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("Calcudoku board, 4 by 4");
    expect(cell(1, 4).getAttribute("aria-label")).toBe("Row 1, column 4, given 4");
    expect(cell(4, 3).getAttribute("aria-label")).toBe(
      "Row 4, column 3, cage 2 divided by, 2 cells, empty"
    );

    // Notes: N switches the pad to pencil marks.
    await user.click(cell(4, 3));
    await user.keyboard("n21");
    const notes = screen.getByRole("button", { name: "Notes" });
    expect(notes.getAttribute("aria-pressed")).toBe("true");
    expect(cell(4, 3).getAttribute("aria-label")).toBe(
      "Row 4, column 3, cage 2 divided by, 2 cells, empty, notes 1 and 2"
    );
    expect(saved().notesMode).toBe(true);
    expect(saved().notes[3][2]).toEqual([1, 2]);

    // A wrong digit repeats a 4 in the row and breaks the cage once it is full.
    await user.click(notes);
    expect(notes.getAttribute("aria-pressed")).toBe("false");
    await user.keyboard("4");
    await user.click(cell(4, 4));
    await user.keyboard("3");
    expect(cell(4, 3).getAttribute("aria-label")).toBe(
      "Row 4, column 3, cage 2 divided by, 2 cells, 4, repeats in its row or column, cage not met"
    );
    expect(cell(4, 1).getAttribute("aria-label")).toContain("repeats in its row or column");
    expect(cell(4, 4).getAttribute("aria-label")).toContain("cage not met");
    expect(screen.getByRole("heading", { level: 1, name: "Calcudoku" })).toBeTruthy();

    // Erase and fix it: the board is solved.
    await user.click(cell(4, 3));
    await user.keyboard("{Backspace}");
    expect(cell(4, 3).getAttribute("aria-label")).toMatch(/, empty$/);
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(cell(4, 4));
    await user.keyboard("{Backspace}1");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Solved" })).toBeTruthy(), {
      timeout: 2000,
    });
    const result = screen.getByRole("region", { name: "Solved" });
    expect(result.textContent).toContain("4×4 · Easy");
    expect(result.textContent).toContain("New personal best");
    expect(result.textContent).toContain("Nice break · Now back to your agents");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Play again" }));
    expect(saved()).toMatchObject({ status: "won", newBest: true });
  });
});
