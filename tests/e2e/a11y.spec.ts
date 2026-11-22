import { expect, test } from "@playwright/test";

for (const path of ["/", "/about/", "/sudoku/", "/minesweeper/", "/wordle/", "/calcudoku/"]) {
  test(`${path} has one main landmark`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toHaveCount(1);
  });
}

test("back link keeps its name on phones", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/sudoku/");
  await expect(page.getByRole("link", { name: "Back to games" })).toBeVisible();
});

test("minesweeper board is one tab stop with labelled cells", async ({ page }) => {
  await page.goto("/minesweeper/");

  await expect(page.getByRole("button", { name: "Hidden, row 1, column 1" })).toBeVisible();
  await expect(page.locator(".minesweeper-cell[tabindex='0']")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Dig", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("calcudoku board is a grid with one tab stop and cells that name their cage", async ({
  page,
}) => {
  await page.goto("/calcudoku/");

  const board = page.getByRole("grid", { name: /^Calcudoku board/ });
  await expect(board).toBeVisible();
  await expect(board.getByRole("gridcell")).toHaveCount(25);
  await expect(board.locator("[role='gridcell'][tabindex='0']")).toHaveCount(1);
  await expect(
    board.getByRole("gridcell", { name: /^Row 1, column 1, (cage|given)/ })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Notes" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
});

test("calcudoku plays by keyboard alone", async ({ page }) => {
  await page.goto("/calcudoku/");
  await expect(page.getByRole("gridcell").first()).toBeVisible();

  // Tab reaches the board; arrows move the selection and focus with it.
  await page.getByRole("gridcell").first().focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  const cell = page.getByRole("gridcell", { name: /^Row 2, column 2,/ });
  await expect(cell).toBeFocused();

  const given = /given/.test((await cell.getAttribute("aria-label")) ?? "");
  test.skip(given, "The cell picked is a given in this puzzle");

  await page.keyboard.press("n");
  await page.keyboard.press("1");
  await page.keyboard.press("3");
  await expect(cell).toHaveAccessibleName(/, empty, notes 1 and 3$/);
  await page.keyboard.press("n");
  await page.keyboard.press("2");
  await expect(cell).toHaveAccessibleName(/, 2(,|$)/);
  await page.keyboard.press("Backspace");
  await expect(cell).toHaveAccessibleName(/, empty$/);
});
