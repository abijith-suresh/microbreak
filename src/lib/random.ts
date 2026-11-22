/** A source of numbers in [0, 1), like Math.random. Tests pass a seeded one. */
export type Random = () => number;

/** A small, fast seeded generator (mulberry32), so a seed always gives the same sequence. */
export function createSeededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(random: Random, max: number): number {
  return Math.floor(random() * max);
}

/** Shuffles the array in place (Fisher–Yates) and returns it. */
export function shuffle<T>(items: T[], random: Random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(random, i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Picks an option with probability proportional to its weight. Weight 0 never comes up. */
export function pickWeighted<T>(options: readonly (readonly [T, number])[], random: Random): T {
  const total = options.reduce((sum, [, weight]) => sum + Math.max(weight, 0), 0);
  if (total <= 0) throw new Error("pickWeighted needs at least one positive weight");
  let roll = random() * total;
  let last: T = options[0][0];
  for (const [option, weight] of options) {
    if (weight <= 0) continue;
    last = option;
    roll -= weight;
    if (roll < 0) return option;
  }
  return last;
}
