import { describe, expect, it } from "vitest";
import {
  computeGuess,
  getMaxGuesses,
  isWordValid,
  mergeKeyboardState,
  type LetterState,
  type WordList,
} from "../wordle";

describe("getMaxGuesses", () => {
  it("returns guess count scaled to variant", () => {
    expect(getMaxGuesses(4)).toBe(5);
    expect(getMaxGuesses(5)).toBe(6);
    expect(getMaxGuesses(6)).toBe(7);
  });
});

describe("computeGuess", () => {
  it("marks all letters correct when guess matches answer", () => {
    const result = computeGuess("crane", "crane");
    expect(result).toEqual(["correct", "correct", "correct", "correct", "correct"]);
  });

  it("marks all letters absent when nothing matches", () => {
    const result = computeGuess("ghost", "cabin");
    expect(result).toEqual(["absent", "absent", "absent", "absent", "absent"]);
  });

  it("marks present for correct letter wrong position", () => {
    // admit vs crane: a is present (pos 2 in answer), no exact matches
    const result = computeGuess("admit", "crane");
    expect(result).toEqual(["present", "absent", "absent", "absent", "absent"]);
  });

  it("handles duplicate letters in guess — only one present", () => {
    // Answer: "crane" has one 'c'. Guess "cocoa" has two 'c's.
    const result = computeGuess("cocoa", "crane");
    // c=correct, o=absent, c=absent (already consumed), o=absent, a=present
    expect(result).toEqual(["correct", "absent", "absent", "absent", "present"]);
  });

  it("handles duplicate letters in answer — both can match", () => {
    // steel vs eerie: no exact matches, e appears twice in both → both present
    const result = computeGuess("steel", "eerie");
    expect(result).toEqual(["absent", "absent", "present", "present", "absent"]);
  });

  it("handles mix of correct and present", () => {
    // trace vs crane: r(pos1) a(pos2) e(pos4) correct, c is present, t is absent
    const result = computeGuess("trace", "crane");
    expect(result).toEqual(["absent", "correct", "correct", "present", "correct"]);
  });

  it("works for 4-letter words", () => {
    const result = computeGuess("lake", "cake");
    expect(result).toEqual(["absent", "correct", "correct", "correct"]);
  });

  it("works for 6-letter words", () => {
    // plates vs staple: only a(pos2) is exact match, rest are present
    const result = computeGuess("plates", "staple");
    expect(result).toEqual(["present", "present", "correct", "present", "present", "present"]);
  });
});

describe("isWordValid", () => {
  const wordList: WordList = {
    solutions: ["crane", "house", "stair"],
    guesses: ["about", "above", "crane", "house", "stair", "world"],
  };

  it("finds words in solutions list", () => {
    expect(isWordValid("crane", wordList)).toBe(true);
    expect(isWordValid("house", wordList)).toBe(true);
  });

  it("finds words in guesses list", () => {
    expect(isWordValid("about", wordList)).toBe(true);
    expect(isWordValid("world", wordList)).toBe(true);
  });

  it("rejects words not in either list", () => {
    expect(isWordValid("zzzzz", wordList)).toBe(false);
    expect(isWordValid("xyz", wordList)).toBe(false);
  });
});

describe("mergeKeyboardState", () => {
  it("adds new letter states", () => {
    const result = mergeKeyboardState(
      {},
      {
        word: "crane",
        states: ["correct", "absent", "present", "absent", "absent"] as LetterState[],
      }
    );
    expect(result).toEqual({
      c: "correct",
      r: "absent",
      a: "present",
      n: "absent",
      e: "absent",
    });
  });

  it("upgrades absent to present", () => {
    const result = mergeKeyboardState(
      { a: "absent" },
      {
        word: "apple",
        states: ["correct", "absent", "absent", "absent", "absent"] as LetterState[],
      }
    );
    expect(result.a).toBe("correct");
  });

  it("does not downgrade correct to present", () => {
    const result = mergeKeyboardState(
      { a: "correct" },
      {
        word: "apple",
        states: ["present", "absent", "absent", "absent", "absent"] as LetterState[],
      }
    );
    expect(result.a).toBe("correct");
  });

  it("does not downgrade present to absent", () => {
    const result = mergeKeyboardState(
      { a: "present" },
      { word: "apple", states: ["absent", "absent", "absent", "absent", "absent"] as LetterState[] }
    );
    expect(result.a).toBe("present");
  });
});
