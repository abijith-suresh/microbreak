import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import Button from "../Button";
import { Chip } from "../Chip";

describe("Button", () => {
  it("reflects aria-pressed when given", () => {
    render(() => <Button aria-pressed={true}>Notes</Button>);
    expect(screen.getByRole("button", { name: "Notes" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("leaves aria-pressed off when not given", () => {
    render(() => <Button>Hint</Button>);
    expect(screen.getByRole("button", { name: "Hint" }).hasAttribute("aria-pressed")).toBe(false);
  });

  it("ignores clicks while disabled", async () => {
    const onClick = vi.fn();
    render(() => (
      <Button disabled onClick={onClick}>
        Undo
      </Button>
    ));
    const button = screen.getByRole("button", { name: "Undo" }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Chip", () => {
  it("toggles aria-pressed through its owner", async () => {
    const [pressed, setPressed] = createSignal(false);
    render(() => (
      <Chip pressed={pressed()} onClick={() => setPressed(!pressed())}>
        Hard
      </Chip>
    ));
    const chip = screen.getByRole("button", { name: "Hard" });

    expect(chip.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    await userEvent.click(chip);
    expect(chip.getAttribute("aria-pressed")).toBe("false");
  });
});
