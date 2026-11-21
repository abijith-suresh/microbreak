import { expect, type Page, test } from "@playwright/test";

const WORDLE_SAVE = "microbreak-wordle-session:v1";

const card = (page: Page, game: string) =>
  page.getByRole("main").getByRole("link", { name: new RegExp(`^${game}:`) });
const save = (page: Page) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), WORDLE_SAVE);

test("the home page leads with one card per game", async ({ page }) => {
  await page.goto("/");

  for (const game of ["Sudoku", "Wordle", "Minesweeper"]) {
    await expect(card(page, game)).toHaveAccessibleName(new RegExp(`^${game}: New game`));
  }
  await expect(page.getByRole("main").getByRole("link")).toHaveCount(3);
  await expect(page.getByText(/Chess|Nonograms|2048/)).toHaveCount(0);
});

test("a game in progress shows on its card and resumes from it", async ({ page }) => {
  await page.goto("/wordle");
  await expect.poll(async () => (await save(page))?.answer).toBeTruthy();
  const { answer } = await save(page);
  const guess = answer === "crane" ? "slate" : "crane";

  await page.keyboard.type(guess);
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await save(page))?.guesses.length).toBe(1);

  await page.goto("/");
  await expect(card(page, "Wordle")).toHaveAccessibleName(/^Wordle: In progress, 5 letters/);
  await expect(card(page, "Wordle")).toContainText("In progress");

  await card(page, "Wordle").click();
  await expect(page).toHaveURL(/\/wordle\/?$/);
  await expect.poll(async () => (await save(page))?.guesses.length).toBe(1);
  expect((await save(page)).answer).toBe(answer);
  expect((await save(page)).status).toBe("playing");
});

test("a finished game shows as solved with its best", async ({ page }) => {
  await page.goto("/wordle");
  await expect.poll(async () => (await save(page))?.answer).toBeTruthy();
  const { answer } = await save(page);
  await page.keyboard.type(answer);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Solved" })).toBeVisible();

  await page.goto("/");
  const wordle = card(page, "Wordle");
  await expect(wordle).toHaveAccessibleName(
    /^Wordle: Solved, 5 letters, \d+:\d\d\. Best 1 guess, new personal best\.$/
  );
  await expect(wordle).toContainText("Solved");
  await expect(wordle).toContainText("New best");

  await wordle.click();
  await expect(page.getByRole("region", { name: "Solved" })).toBeVisible();
});
