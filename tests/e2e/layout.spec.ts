import { expect, type Page, test } from "@playwright/test";

/** Nothing scrolls sideways, and no element pokes past either edge of the screen. */
async function expectNoHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const wide = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && (box.right > width + 0.5 || box.left < -0.5);
      })
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`);
    return { scroll: document.documentElement.scrollWidth - width, wide };
  });
  expect(result.scroll, "page scrolls sideways").toBeLessThanOrEqual(0);
  expect(result.wide, "elements wider than the screen").toEqual([]);
}

const PAGES: { name: string; path: string; ready: string; prefs?: [string, string] }[] = [
  { name: "home", path: "/", ready: "main a" },
  { name: "Sudoku 9×9", path: "/sudoku", ready: ".sudoku-cell" },
  { name: "Wordle", path: "/wordle", ready: "[data-game-keys] button" },
  {
    name: "Wordle, 6 letters",
    path: "/wordle",
    ready: "[data-game-keys] button",
    prefs: ["microbreak-wordle-preferences:v1", JSON.stringify({ variant: 6 })],
  },
  { name: "Minesweeper", path: "/minesweeper", ready: ".minesweeper-cell" },
  { name: "Calcudoku 5×5", path: "/calcudoku", ready: "[role='gridcell']" },
  {
    name: "Calcudoku 4×4",
    path: "/calcudoku",
    ready: "[role='gridcell']",
    prefs: ["microbreak-calcudoku-preferences:v1", "easy"],
  },
  {
    name: "Calcudoku 6×6",
    path: "/calcudoku",
    ready: "[role='gridcell']",
    prefs: ["microbreak-calcudoku-preferences:v1", "hard"],
  },
  {
    name: "Minesweeper Medium",
    path: "/minesweeper",
    ready: ".minesweeper-cell",
    prefs: ["microbreak-minesweeper-preferences:v1", "intermediate"],
  },
];

for (const width of [320, 375, 1440]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 740 } });

    for (const { name, path, ready, prefs } of PAGES) {
      test(`${name} fits the screen`, async ({ page }) => {
        if (prefs)
          await page.addInitScript(([key, value]) => localStorage.setItem(key, value), prefs);
        await page.goto(path);
        await expect(page.locator(ready).first()).toBeVisible();
        await expectNoHorizontalOverflow(page);
      });
    }
  });
}

test.describe("Calcudoku at 320px", () => {
  test.use({ viewport: { width: 320, height: 740 } });

  test("6×6 cells stay at least 40px and the clues at least 10px", async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem("microbreak-calcudoku-preferences:v1", "hard")
    );
    await page.goto("/calcudoku");
    const cell = page.getByRole("gridcell").first();
    await expect(cell).toBeVisible();
    // Measured once the board's scale-in entrance has settled.
    await expect
      .poll(async () => (await cell.boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(40);
    const clue = await cell
      .locator("span")
      .first()
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(clue).toBeGreaterThanOrEqual(10);
  });
});
