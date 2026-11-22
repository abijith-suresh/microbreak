import { render, screen, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NewGameMenu, { type MenuGroup } from "../NewGameMenu";

const groups: MenuGroup[] = [
  {
    id: "difficulty",
    label: "Difficulty",
    options: [
      { value: "easy", label: "Easy" },
      { value: "hard", label: "Hard" },
    ],
    value: "easy",
  },
];

function setup() {
  const onStart = vi.fn();
  render(() => (
    <>
      <NewGameMenu groups={groups} onStart={onStart} />
      <main tabIndex={-1}>board</main>
    </>
  ));
  const user = userEvent.setup();
  const trigger = screen.getByRole("button", { name: /New game/ });
  return { onStart, user, trigger };
}

describe("NewGameMenu", () => {
  it("opens with the current choice pressed and focused", async () => {
    const { user, trigger } = setup();
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "New game" })).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const easy = screen.getByRole("button", { name: "Easy" });
    expect(easy.getAttribute("aria-pressed")).toBe("true");
    await waitFor(() => expect(document.activeElement).toBe(easy));
  });

  it("changes nothing until Start new game is pressed", async () => {
    const { onStart, user, trigger } = setup();
    await user.click(trigger);

    await user.click(screen.getByRole("button", { name: "Hard" }));
    expect(screen.getByRole("button", { name: "Hard" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Easy" }).getAttribute("aria-pressed")).toBe("false");
    expect(onStart).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(onStart).not.toHaveBeenCalled();

    await user.click(trigger);
    expect(screen.getByRole("button", { name: "Easy" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("starts with the picked values and hands focus to the board", async () => {
    const { onStart, user, trigger } = setup();
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Hard" }));

    await user.click(screen.getByRole("button", { name: "Start new game" }));

    expect(onStart).toHaveBeenCalledExactlyOnceWith({ difficulty: "hard" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });
});
