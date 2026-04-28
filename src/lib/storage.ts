export type Validator<T> = (value: unknown) => value is T;

export function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadStoredJSON<T>(key: string, validate: Validator<T>): T | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredJSON(key: string, value: unknown) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
}

export function loadStoredString<T extends string>(
  key: string,
  allowedValues: readonly T[],
  fallback: T
): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null && allowedValues.includes(raw as T) ? (raw as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredString(key: string, value: string) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

export function loadStoredNumber(key: string, fallback = 0): number {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredNumber(key: string, value: number) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore storage failures
  }
}

export function removeStoredValue(key: string) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isTuple2(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "number")
  );
}
