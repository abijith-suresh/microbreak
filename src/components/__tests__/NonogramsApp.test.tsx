import { fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEmptyMarks } from "@/lib/nonogram";
import type { PersistedNonogramSession } from "@/lib/nonogramSession";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import NonogramsApp from "../NonogramsApp";

// A heart. Rows: [1 1] [5] [5] [3] [1]. The saved session is the game's own resume path.
const HEART = [".#.#.", "#####", "#####", ".###.", "..#.."];

function seedHeart() {
  const session: PersistedNonogramSession = {
    status: "playing",
    newBest: false,
    timerSeconds: 3,
    size: 5,
    solution: HEART.map((row) => row.replaceAll("#", "1").replaceAll(".", "0")),
    marks: createEmptyMarks(5),
    mode: "fill",
    selectedCell: null,
    hasStartedPlaying: false,
  };
  localStorage.setItem(STORAGE_KEYS.nonogramSession, JSON.stringify(session));
}

const savedSession = (): PersistedNonogramSession =>
  JSON.parse(localStorage.getItem(STORAGE_KEYS.nonogramSession) ?? "null");

const cell = (row: number, col: number) =>
  document.querySelector(`[data-cell="${row - 1}-${col - 1}"]`) as HTMLElement;
const markOf = (row: number, col: number) => cell(row, col).getAttribute("aria-label");

/** Presses the first cell, moves to the last, and lets go: a tap when they are the same. */
function drag(from: [number, number], to: [number, number] = from) {
  const target = cell(...to);
  const pointAt = vi.spyOn(document, "elementFromPoint").mockReturnValue(target);
  fireEvent.pointerDown(cell(...from), { button: 0, pointerId: 1 });
  fireEvent.pointerMove(window, { pointerId: 1 });
  fireEvent.pointerUp(window, { pointerId: 1 });
  pointAt.mockRestore();
}

describe("Nonograms", () => {
  afterEach(() => vi.restoreAllMocks());

  it("fills, crosses, drags a line, dims solved clues and shows the win", async () => {
    seedHeart();
    render(() => <NonogramsApp />);
    await waitFor(() => expect(cell(1, 1)).toBeTruthy());

    expect(screen.getByRole("table", { name: "Nonogram, 5 by 5" })).toBeTruthy();
    expect(markOf(1, 1)).toBe("Row 1, column 1, empty");
    expect(screen.getByRole("rowheader", { name: "Row 1: 1 1" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Column 3: 4" })).toBeTruthy();

    // A tap fills one cell; tapping again clears it.
    drag([1, 2]);
    expect(markOf(1, 2)).toBe("Row 1, column 2, filled");
    drag([1, 2]);
    expect(markOf(1, 2)).toBe("Row 1, column 2, empty");

    // A drag fills the whole row, and its clue is marked done.
    drag([2, 1], [2, 5]);
    for (let col = 1; col <= 5; col++) expect(markOf(2, col)).toBe(`Row 2, column ${col}, filled`);
    expect(screen.getByRole("rowheader", { name: "Row 2: 5, done" }).dataset.done).toBe("true");

    // Cross mode marks cells as empty.
    fireEvent.click(screen.getByRole("button", { name: "Cross" }));
    expect(screen.getByRole("button", { name: "Cross" }).getAttribute("aria-pressed")).toBe("true");
    drag([1, 1]);
    expect(markOf(1, 1)).toBe("Row 1, column 1, crossed");

    // The keyboard: arrows move, Space fills, X crosses, Backspace clears.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: " " });
    expect(markOf(1, 2)).toBe("Row 1, column 2, filled");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "x" });
    expect(markOf(1, 3)).toBe("Row 1, column 3, crossed");
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(markOf(1, 3)).toBe("Row 1, column 3, empty");

    expect(savedSession()).toMatchObject({
      status: "playing",
      mode: "cross",
      hasStartedPlaying: true,
    });
    expect(savedSession().marks[1]).toEqual(["filled", "filled", "filled", "filled", "filled"]);

    // Fill the rest of the heart.
    fireEvent.click(screen.getByRole("button", { name: "Fill" }));
    drag([1, 4]);
    drag([3, 1], [3, 5]);
    drag([4, 2], [4, 4]);
    drag([5, 3]);

    await waitFor(() => expect(screen.getByRole("heading", { name: "Solved" })).toBeTruthy());
    expect(screen.getByRole("region", { name: "Solved" }).textContent).toContain("5×5 · Easy");
    expect(screen.getByText("New personal best")).toBeTruthy();
    expect(screen.getByText("Nice break · Now back to your agents")).toBeTruthy();
    expect(savedSession()).toMatchObject({ status: "won", newBest: true });
  });
});
