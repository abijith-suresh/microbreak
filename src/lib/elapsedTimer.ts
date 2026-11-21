export interface ElapsedTimerOptions {
  getValue: () => number;
  setValue: (value: number) => void;
}

export function createElapsedTimer(options: ElapsedTimerOptions) {
  let interval: ReturnType<typeof setInterval> | null = null;

  function start() {
    if (interval) return;
    interval = setInterval(() => {
      options.setValue(options.getValue() + 1);
    }, 1000);
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function reset(nextValue = 0) {
    stop();
    options.setValue(nextValue);
  }

  function set(nextValue: number) {
    options.setValue(nextValue);
  }

  return {
    start,
    stop,
    reset,
    set,
  };
}

/** A finished time for people to read: "42s" or "1m 05s". */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
