import { describe, expect, it } from "vitest";
import { createBoard, generate, setCellValue, toggleNote } from "../calcudoku";
import { isPersistedCalcudokuSession, type PersistedCalcudokuSession } from "../calcudokuSession";
import { createSeededRandom } from "../random";

function session(): PersistedCalcudokuSession {
  const puzzle = generate("medium", createSeededRandom(3));
  let board = createBoard(puzzle);
  const open = puzzle.cages.find((cage) => cage.operation !== "given");
  const [row, col] = open?.cells[0] ?? [0, 0];
  board = setCellValue(puzzle, board, row, col, puzzle.solution[row][col]);
  const [noteRow, noteCol] = open?.cells[1] ?? [0, 1];
  board = toggleNote(puzzle, board, noteRow, noteCol, 2);
  board = toggleNote(puzzle, board, noteRow, noteCol, 5);
  return {
    status: "playing",
    newBest: false,
    timerSeconds: 73,
    difficulty: "medium",
    puzzle,
    values: board.values,
    notes: board.notes,
    selectedCell: [noteRow, noteCol],
    notesMode: true,
    hasStartedFilling: true,
  };
}

const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value));

describe("Calcudoku save", () => {
  it("survives a JSON round trip unchanged", () => {
    const saved = session();
    const restored = roundTrip(saved);
    expect(isPersistedCalcudokuSession(restored)).toBe(true);
    expect(restored).toEqual(saved);
  });

  it("accepts a won game with a new best", () => {
    expect(isPersistedCalcudokuSession({ ...session(), status: "won", newBest: true })).toBe(true);
  });

  it("rejects a lost game, since mistakes never end one", () => {
    expect(isPersistedCalcudokuSession({ ...session(), status: "lost" })).toBe(false);
  });

  it("rejects a broken header", () => {
    expect(isPersistedCalcudokuSession({ ...session(), timerSeconds: -1 })).toBe(false);
    const { newBest: _, ...noFlag } = session();
    expect(isPersistedCalcudokuSession(noFlag)).toBe(false);
  });

  it("rejects a difficulty that does not match the grid", () => {
    expect(isPersistedCalcudokuSession({ ...session(), difficulty: "hard" })).toBe(false);
    expect(isPersistedCalcudokuSession({ ...session(), difficulty: "extreme" })).toBe(false);
  });

  it("rejects cages that overlap, leave gaps or miss their target", () => {
    const overlap = roundTrip(session());
    overlap.puzzle.cages[0].cells.push(overlap.puzzle.cages[1].cells[0]);
    expect(isPersistedCalcudokuSession(overlap)).toBe(false);

    const gap = roundTrip(session());
    gap.puzzle.cages.pop();
    expect(isPersistedCalcudokuSession(gap)).toBe(false);

    const wrongTarget = roundTrip(session());
    wrongTarget.puzzle.cages[0].target += 100;
    expect(isPersistedCalcudokuSession(wrongTarget)).toBe(false);

    const badOperation = roundTrip(session());
    badOperation.puzzle.cages[0].operation = "modulo";
    expect(isPersistedCalcudokuSession(badOperation)).toBe(false);
  });

  it("rejects a solution that is not a Latin square", () => {
    const saved = roundTrip(session());
    saved.puzzle.solution[1] = [...saved.puzzle.solution[0]];
    expect(isPersistedCalcudokuSession(saved)).toBe(false);
  });

  it("rejects digits and notes outside 1–N, and a misshapen board", () => {
    const digit = roundTrip(session());
    digit.values[0][0] = 6;
    expect(isPersistedCalcudokuSession(digit)).toBe(false);

    const note = roundTrip(session());
    note.notes[0][0] = [0];
    expect(isPersistedCalcudokuSession(note)).toBe(false);

    const short = roundTrip(session());
    short.values.pop();
    expect(isPersistedCalcudokuSession(short)).toBe(false);
  });

  it("rejects a selected cell off the board or a missing flag", () => {
    expect(isPersistedCalcudokuSession({ ...session(), selectedCell: [5, 0] })).toBe(false);
    expect(isPersistedCalcudokuSession({ ...session(), notesMode: "yes" })).toBe(false);
    expect(isPersistedCalcudokuSession(null)).toBe(false);
  });
});
