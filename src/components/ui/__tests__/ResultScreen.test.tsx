import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import ResultScreen from "../ResultScreen";

function renderResult(props: { type: "won" | "lost"; best?: string | null; isNewBest?: boolean }) {
  return render(() => (
    <ResultScreen
      solveTime={42}
      difficulty="9×9 · Easy"
      onBackToGames={() => {}}
      onPlayAgain={() => {}}
      {...props}
    />
  ));
}

describe("ResultScreen", () => {
  it("marks a new personal best", () => {
    renderResult({ type: "won", best: "42s", isNewBest: true });

    expect(screen.getByRole("heading", { name: "Solved" })).toBeTruthy();
    expect(screen.getByText("New personal best")).toBeTruthy();
    expect(screen.queryByText(/^Best:/)).toBeNull();
    expect(screen.getByText("Nice break · Now back to your agents")).toBeTruthy();
  });

  it("shows the standing best when this game did not beat it", () => {
    renderResult({ type: "won", best: "1m 42s", isNewBest: false });

    expect(screen.getByText("Best: 1m 42s")).toBeTruthy();
    expect(screen.queryByText("New personal best")).toBeNull();
  });

  it("shows no best before any win, and the loss tagline", () => {
    renderResult({ type: "lost", best: null });

    expect(screen.getByRole("heading", { name: "Game over" })).toBeTruthy();
    expect(screen.queryByText(/^Best:/)).toBeNull();
    expect(screen.queryByText("New personal best")).toBeNull();
    expect(screen.getByText("Shake it off · Now back to your agents")).toBeTruthy();
  });

  it("moves focus to the first action", () => {
    renderResult({ type: "won" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Play again" }));
  });
});
