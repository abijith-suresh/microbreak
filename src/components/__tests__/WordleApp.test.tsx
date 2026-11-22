import { render, screen, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import type { PersistedWordleSession } from "@/lib/wordleSession";
import WordleApp from "../WordleApp";

// The saved session is the game's own resume path, so seeding one fixes the answer.
function seedAnswer(answer: string) {
  const session: PersistedWordleSession = {
    status: "playing",
    newBest: false,
    timerSeconds: 7,
    variant: 5,
    answer,
    guesses: [],
    currentInput: "",
    hasStartedPlaying: false,
  };
  localStorage.setItem(STORAGE_KEYS.wordleSession, JSON.stringify(session));
}

function savedSession(): PersistedWordleSession {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.wordleSession) ?? "null");
}

/** Letter and colour face of each tile in a board row. The board's first child is its live region. */
function tiles(board: HTMLElement, row: number) {
  return [...board.children[row + 1].children].map((tile) => {
    const back = tile.firstElementChild?.lastElementChild as HTMLElement;
    return { letter: back.textContent, colour: back.style.backgroundColor };
  });
}

const REVEAL_MS = 5 * 350 + 300;

describe("Wordle", () => {
  afterEach(() => vi.useRealTimers());

  it("plays a word through to the result screen and saves it as won", async () => {
    seedAnswer("crane");
    render(() => <WordleApp />);
    // The clock reads the seeded 0:07 once the save is restored.
    await waitFor(() => expect(screen.getAllByText("0:07").length).toBeGreaterThan(0));
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await user.keyboard("react{Enter}");
    await vi.advanceTimersByTimeAsync(REVEAL_MS);

    const announcement = screen.getByText(/^R wrong spot/);
    expect(announcement.textContent).toBe(
      "R wrong spot, E wrong spot, A correct, C wrong spot, T not in word"
    );
    expect(tiles(announcement.parentElement as HTMLElement, 0)).toEqual([
      { letter: "r", colour: "var(--color-wl-present)" },
      { letter: "e", colour: "var(--color-wl-present)" },
      { letter: "a", colour: "var(--color-wl-correct)" },
      { letter: "c", colour: "var(--color-wl-present)" },
      { letter: "t", colour: "var(--color-wl-absent)" },
    ]);
    expect(savedSession()).toMatchObject({ status: "playing", guesses: [{ word: "react" }] });

    await user.keyboard("crane{Enter}");
    await vi.advanceTimersByTimeAsync(REVEAL_MS);

    expect(screen.getByRole("heading", { name: "Solved" })).toBeTruthy();
    expect(screen.getByText("5 letters · 2 guesses")).toBeTruthy();
    expect(screen.getByText("New personal best")).toBeTruthy();
    expect(screen.getByText("Nice break · Now back to your agents")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Play again" }));
    expect(savedSession()).toMatchObject({
      status: "won",
      newBest: true,
      answer: "crane",
      guesses: [{ word: "react" }, { word: "crane" }],
    });
  });
});
