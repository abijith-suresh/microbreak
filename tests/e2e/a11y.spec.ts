import { expect, test } from "@playwright/test";

for (const path of ["/", "/about/", "/sudoku/", "/minesweeper/", "/wordle/", "/nonograms/"]) {
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

test("nonograms board is a table with one tab stop, labelled cells and readable clues", async ({
  page,
}) => {
  await page.goto("/nonograms/");

  const grid = page.getByRole("table", { name: "Nonogram, 10 by 10" });
  await expect(grid).toBeVisible();
  await expect(grid.getByRole("button", { name: /^Row \d+, column \d+, / })).toHaveCount(100);
  await expect(page.getByRole("button", { name: "Row 1, column 1, empty" })).toBeVisible();
  await expect(page.locator("[data-cell][tabindex='0']")).toHaveCount(1);
  await expect(grid.getByRole("rowheader", { name: /^Row 1: [\d ]+$/ })).toHaveCount(1);
  await expect(grid.getByRole("columnheader", { name: /^Column 10: [\d ]+$/ })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Fill", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  // Keyboard only: tab onto the board, move, fill, cross.
  await page.locator("[data-cell][tabindex='0']").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Row 2, column 2, filled" })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("x");
  await expect(page.getByRole("button", { name: "Row 2, column 1, crossed" })).toBeFocused();
});
