import { expect, type Page, test } from "@playwright/test";

const topBar = (page: Page) => page.locator("header");
const newGameButton = (page: Page) => page.getByRole("button", { name: /^New/ });
const menu = (page: Page) => page.getByRole("dialog", { name: "New game" });

async function startFromMenu(page: Page, choices: string[]) {
  await newGameButton(page).click();
  for (const choice of choices) {
    await menu(page).getByRole("button", { name: choice, exact: true }).click();
  }
  await menu(page).getByRole("button", { name: "Start new game" }).click();
  await expect(menu(page)).toBeHidden();
}

test.describe("every game opens straight onto a board", () => {
  for (const [path, title, cell] of [
    ["/sudoku", "Sudoku", ".sudoku-cell"],
    ["/minesweeper", "Minesweeper", ".minesweeper-cell"],
  ] as const) {
    test(title, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page.locator(cell).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /^Start$/ })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Back to games" })).toHaveAttribute("href", "/");
    });
  }

  test("Wordle", async ({ page }) => {
    await page.goto("/wordle");
    await expect(page.getByRole("heading", { level: 1, name: "Wordle" })).toBeVisible();
    await expect(topBar(page)).toContainText("5 letters");
    await expect(page.getByRole("button", { name: /^Start$/ })).toHaveCount(0);
  });
});

test("the new-game menu starts a board at the chosen settings and remembers them", async ({
  page,
}) => {
  await page.goto("/sudoku");
  await expect(topBar(page)).toContainText("9×9 · Medium");

  await startFromMenu(page, ["4×4", "Easy"]);
  await expect(topBar(page)).toContainText("4×4 · Easy");
  await expect(page.locator(".sudoku-cell")).toHaveCount(16);

  // With no game to resume, the next visit starts at the last settings used.
  await page.evaluate(() => localStorage.removeItem("microbreak-sudoku-session:v1"));
  await page.reload();
  await expect(topBar(page)).toContainText("4×4 · Easy");
  await expect(page.locator(".sudoku-cell")).toHaveCount(16);
});

test("closing the menu changes nothing", async ({ page }) => {
  await page.goto("/minesweeper");
  await expect(topBar(page)).toContainText("Easy");

  await newGameButton(page).click();
  await menu(page).getByRole("button", { name: "Hard", exact: true }).click();
  await page.keyboard.press("Escape");

  await expect(menu(page)).toBeHidden();
  await expect(newGameButton(page)).toBeFocused();
  await expect(topBar(page)).toContainText("Easy");
});

test("a game in progress resumes after a reload", async ({ page }) => {
  await page.goto("/wordle");
  await expect(topBar(page)).toContainText("5 letters");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("microbreak-wordle-session:v1")))
    .not.toBeNull();

  await page.keyboard.type("crane");
  await page.keyboard.press("Enter");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("microbreak-wordle-session:v1") ?? "{}").guesses?.length
      )
    )
    .toBe(1);

  await page.reload();
  await expect(topBar(page)).toContainText("5 letters");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("microbreak-wordle-session:v1") ?? "{}").guesses?.[0]
            ?.word
      )
    )
    .toBe("crane");
});

test("keys typed in the open menu don't reach the board", async ({ page }) => {
  await page.goto("/wordle");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("microbreak-wordle-session:v1")))
    .not.toBeNull();

  await newGameButton(page).click();
  await page.keyboard.type("abc");
  await page.keyboard.press("Escape");

  const input = await page.evaluate(
    () => JSON.parse(localStorage.getItem("microbreak-wordle-session:v1") ?? "{}").currentInput
  );
  expect(input).toBe("");
});
