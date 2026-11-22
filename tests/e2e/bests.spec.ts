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

test("a solved Calcudoku stays solved after a reload and keeps its best", async ({ page }) => {
  const SAVE = "microbreak-calcudoku-session:v1";
  const solution = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1],
  ];
  const cages = [
    {
      cells: [
        [0, 0],
        [1, 0],
      ],
      operation: "subtract",
      target: 2,
    },
    {
      cells: [
        [0, 1],
        [0, 2],
      ],
      operation: "multiply",
      target: 6,
    },
    { cells: [[0, 3]], operation: "given", target: 4 },
    {
      cells: [
        [1, 1],
        [1, 2],
      ],
      operation: "divide",
      target: 4,
    },
    {
      cells: [
        [1, 3],
        [2, 3],
      ],
      operation: "add",
      target: 5,
    },
    {
      cells: [
        [2, 0],
        [3, 0],
        [3, 1],
      ],
      operation: "add",
      target: 9,
    },
    {
      cells: [
        [2, 1],
        [2, 2],
      ],
      operation: "subtract",
      target: 3,
    },
    {
      cells: [
        [3, 2],
        [3, 3],
      ],
      operation: "divide",
      target: 2,
    },
  ];
  const values = solution.map((row, r) => row.map((v, c) => (r === 3 && c === 3 ? null : v)));
  await page.goto("/");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
    key: SAVE,
    value: {
      status: "playing",
      newBest: false,
      timerSeconds: 30,
      difficulty: "easy",
      puzzle: { size: 4, cages, solution },
      values,
      notes: values.map((row) => row.map(() => [])),
      selectedCell: null,
      notesMode: false,
      hasStartedFilling: true,
    },
  });
  await page.goto("/calcudoku");

  await page.getByRole("gridcell", { name: /^Row 4, column 4,/ }).click();
  await page.keyboard.press("1");

  await expect(result(page)).toContainText("Solved");
  await expect(result(page)).toContainText("4×4 · Easy");
  await expect(result(page)).toContainText("New personal best");
  await expect(result(page)).toContainText("Nice break · Now back to your agents");

  await page.reload();
  await expect(result(page)).toContainText("Solved");
  expect(await save(page, SAVE)).toMatchObject({ status: "won", newBest: true });
  expect((await save(page, BESTS)).games.calcudoku["4x4"].seconds).toBeGreaterThanOrEqual(30);

  await page.getByRole("button", { name: "New game" }).click();
  await page
    .getByRole("dialog", { name: "New game" })
    .getByRole("button", { name: "Start new game" })
    .click();
  await expect(result(page)).toBeHidden();
  await expect(page.locator(".calcudoku-cell")).toHaveCount(16);
  await expect(page.getByRole("main")).toBeFocused();
});
