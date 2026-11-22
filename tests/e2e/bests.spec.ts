import { expect, type Page, test } from "@playwright/test";

const WORDLE_SAVE = "microbreak-wordle-session:v1";
const SUDOKU_SAVE = "microbreak-sudoku-session:v1";
const BESTS = "microbreak-bests:v1";

const result = (page: Page) => page.getByRole("region", { name: /Solved|Game over/ });
const save = (page: Page, key: string) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), key);

async function winWordle(page: Page) {
  await expect.poll(async () => (await save(page, WORDLE_SAVE))?.answer).toBeTruthy();
  const { answer } = await save(page, WORDLE_SAVE);
  await page.keyboard.type(answer);
  await page.keyboard.press("Enter");
  await expect(result(page)).toBeVisible();
}

test("a won Wordle stays finished after a reload and shows the best", async ({ page }) => {
  await page.goto("/wordle");
  await winWordle(page);

  await expect(result(page)).toContainText("Solved");
  await expect(result(page)).toContainText("5 letters · 1 guess");
  await expect(result(page)).toContainText("New personal best");
  await expect(page.getByRole("button", { name: "Play again" })).toBeFocused();
  await expect(result(page)).toContainText("Nice break · Now back to your agents");
  expect(await save(page, WORDLE_SAVE)).toMatchObject({ status: "won", newBest: true });

  await page.reload();
  await expect(result(page)).toContainText("Solved");
  await expect(result(page)).toContainText("New personal best");
  expect(await save(page, WORDLE_SAVE)).toMatchObject({ status: "won" });

  // A best nobody can beat: the next one-guess win is not a new best.
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          games: {
            sudoku: {},
            minesweeper: {},
            wordle: { "5": { guesses: 1, seconds: 0 } },
            "2048": {},
          },
        })
      ),
    BESTS
  );
  await page.getByRole("button", { name: "New game" }).click();
  await page
    .getByRole("dialog", { name: "New game" })
    .getByRole("button", { name: "Start new game" })
    .click();
  await expect(result(page)).toBeHidden();
  await expect.poll(async () => (await save(page, WORDLE_SAVE))?.status).toBe("playing");

  await winWordle(page);
  await expect(result(page)).toContainText("Best: 1 guess");
  await expect(result(page)).not.toContainText("New personal best");
});

test("a solved Sudoku stays solved after a reload until a new game starts", async ({ page }) => {
  const solution = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];
  const almost = solution.map((row, r) => row.map((v, c) => (r === 3 && c === 3 ? null : v)));
  // Inject from the home page: opening /sudoku first would start a puzzle that can overwrite it.
  await page.goto("/");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SUDOKU_SAVE,
    value: {
      status: "playing",
      newBest: false,
      gridSize: 4,
      difficulty: "easy",
      puzzle: almost,
      solution,
      userBoard: almost,
      timerSeconds: 30,
      selectedCell: null,
      hasStartedFilling: true,
    },
  });
  await page.goto("/sudoku");

  await page.getByRole("button", { name: "Empty, row 4, column 4" }).click();
  await page.getByRole("button", { name: "1", exact: true }).click();

  await expect(result(page)).toContainText("Solved");
  await expect(result(page)).toContainText("4×4 · Easy");
  await expect(result(page)).toContainText("New personal best");

  await page.reload();
  await expect(result(page)).toContainText("Solved");
  expect(await save(page, SUDOKU_SAVE)).toMatchObject({ status: "won", newBest: true });
  expect((await save(page, BESTS)).games.sudoku["4x4-easy"].seconds).toBeGreaterThanOrEqual(30);

  await page.getByRole("button", { name: "New game" }).click();
  await page
    .getByRole("dialog", { name: "New game" })
    .getByRole("button", { name: "Start new game" })
    .click();
  await expect(result(page)).toBeHidden();
  await expect(page.locator(".sudoku-cell")).toHaveCount(16);
});

test("a solved Nonogram stays solved after a reload and keeps the fastest time", async ({
  page,
}) => {
  const SAVE = "microbreak-nonogram-session:v1";
  const heart = ["01010", "11111", "11111", "01110", "00100"];
  const marks = heart.map((row, r) =>
    [...row].map((cell, c) => (cell === "1" && !(r === 4 && c === 2) ? "filled" : "empty"))
  );
  // Inject from the home page: opening /nonograms first would start a puzzle that can overwrite it.
  await page.goto("/");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE,
    value: {
      status: "playing",
      newBest: false,
      timerSeconds: 42,
      size: 5,
      solution: heart,
      marks,
      mode: "fill",
      selectedCell: null,
      hasStartedPlaying: true,
    },
  });
  await page.goto("/nonograms");

  await page.getByRole("button", { name: "Row 5, column 3, empty" }).click();

  await expect(result(page)).toContainText("Solved");
  await expect(result(page)).toContainText("5×5 · Easy");
  await expect(result(page)).toContainText("New personal best");
  await expect(result(page)).toContainText("Nice break · Now back to your agents");

  await page.reload();
  await expect(result(page)).toContainText("Solved");
  expect(await save(page, SAVE)).toMatchObject({ status: "won", newBest: true });
  expect((await save(page, BESTS)).games.nonograms["5x5"].seconds).toBeGreaterThanOrEqual(42);

  await page.getByRole("button", { name: "New game" }).click();
  await page
    .getByRole("dialog", { name: "New game" })
    .getByRole("button", { name: "Start new game" })
    .click();
  await expect(result(page)).toBeHidden();
  await expect(page.locator("[data-cell]")).toHaveCount(25);
});
