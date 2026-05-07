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

  function cleanup() {
    stop();
  }

  return {
    start,
    stop,
    reset,
    set,
    cleanup,
  };
}
