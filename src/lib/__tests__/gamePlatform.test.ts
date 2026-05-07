import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElapsedTimer } from "../elapsedTimer";

describe("createElapsedTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ticks once per second until stopped", () => {
    let seconds = 0;
    const timer = createElapsedTimer({
      getValue: () => seconds,
      setValue: (value) => {
        seconds = value;
      },
    });

    timer.start();
    vi.advanceTimersByTime(3200);
    timer.stop();
    vi.advanceTimersByTime(2000);

    expect(seconds).toBe(3);
  });

  it("resets to a provided value and stops the interval", () => {
    let seconds = 4;
    const timer = createElapsedTimer({
      getValue: () => seconds,
      setValue: (value) => {
        seconds = value;
      },
    });

    timer.start();
    vi.advanceTimersByTime(1000);
    timer.reset(7);
    vi.advanceTimersByTime(2000);

    expect(seconds).toBe(7);
  });
});
