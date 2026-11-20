import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shouldIgnoreGameKey } from "../keyboard";

class FakeElement {
  constructor(
    private readonly match: string,
    private readonly parent: FakeElement | null = null
  ) {}

  closest(selector: string): FakeElement | null {
    const matches = selector.split(/,\s*/).includes(this.match);
    return matches ? this : (this.parent?.closest(selector) ?? null);
  }
}

function keydown(key: string, target: unknown, mods: Partial<KeyboardEvent> = {}) {
  return { key, target, ctrlKey: false, metaKey: false, altKey: false, ...mods } as KeyboardEvent;
}

describe("shouldIgnoreGameKey", () => {
  beforeEach(() => vi.stubGlobal("Element", FakeElement));
  afterEach(() => vi.unstubAllGlobals());

  const body = new FakeElement("body");
  const pageButton = new FakeElement("button", body);
  const gameCell = new FakeElement("button", new FakeElement("[data-game-keys]", body));

  it("ignores browser shortcuts", () => {
    expect(shouldIgnoreGameKey(keydown("f", body, { ctrlKey: true }))).toBe(true);
    expect(shouldIgnoreGameKey(keydown("f", body, { metaKey: true }))).toBe(true);
    expect(shouldIgnoreGameKey(keydown("ArrowLeft", body, { altKey: true }))).toBe(true);
  });

  it("leaves Enter and Space to a focused page control", () => {
    expect(shouldIgnoreGameKey(keydown("Enter", pageButton))).toBe(true);
    expect(shouldIgnoreGameKey(keydown(" ", pageButton))).toBe(true);
  });

  it("handles game keys on the body, a game control, or keys a button doesn't use", () => {
    expect(shouldIgnoreGameKey(keydown("Enter", body))).toBe(false);
    expect(shouldIgnoreGameKey(keydown("Enter", gameCell))).toBe(false);
    expect(shouldIgnoreGameKey(keydown("ArrowUp", pageButton))).toBe(false);
    expect(shouldIgnoreGameKey(keydown("f", pageButton))).toBe(false);
  });

  it("ignores every key while typing in a field", () => {
    const input = new FakeElement("input", body);
    expect(shouldIgnoreGameKey(keydown("a", input))).toBe(true);
  });
});
