import { expect, test } from "@playwright/test";

for (const path of ["/", "/about/", "/sudoku/", "/minesweeper/", "/wordle/"]) {
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
