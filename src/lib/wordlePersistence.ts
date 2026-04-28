import type { Variant } from "./wordle";
import { isRecord } from "./storage";

export interface RecentWordleAnswers {
  4: string[];
  5: string[];
  6: string[];
}

const RECENT_ANSWER_WINDOW = 8;

export function createEmptyRecentWordleAnswers(): RecentWordleAnswers {
  return { 4: [], 5: [], 6: [] };
}

export function isRecentWordleAnswers(value: unknown): value is RecentWordleAnswers {
  return (
    isRecord(value) &&
    Array.isArray(value[4]) &&
    value[4].every((word) => typeof word === "string") &&
    Array.isArray(value[5]) &&
    value[5].every((word) => typeof word === "string") &&
    Array.isArray(value[6]) &&
    value[6].every((word) => typeof word === "string")
  );
}

export function addRecentWordleAnswer(
  current: RecentWordleAnswers,
  variant: Variant,
  answer: string
): RecentWordleAnswers {
  const nextForVariant = [...current[variant].filter((word) => word !== answer), answer].slice(
    -RECENT_ANSWER_WINDOW
  );

  return {
    ...current,
    [variant]: nextForVariant,
  };
}
