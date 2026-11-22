import { expect, type Page, test } from "@playwright/test";

const CARDS = [
  { name: "Sudoku", line: "Fill every row, column and box", href: "/sudoku" },
  { name: "Wordle", line: "Guess the hidden word", href: "/wordle" },
  { name: "Minesweeper", line: "Clear the board, dodge the mines", href: "/minesweeper" },
];

const card = (page: Page, name: string) =>
  page.getByRole("main").getByRole("link", { name: new RegExp(`^${name}\\b`) });
const board = (page: Page, name: string) => card(page, name).locator("[aria-hidden='true']");

test("each card names its game, says one line about it and links to it", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main").getByRole("link")).toHaveCount(3);
  for (const { name, line, href } of CARDS) {
    await expect(card(page, name)).toHaveAccessibleName(`${name} ${line}`);
    await expect(card(page, name)).toHaveAttribute("href", href);
  }
  await expect(page.getByText(/Chess|Nonograms|2048/)).toHaveCount(0);
});

test("cards never show your own game", async ({ page }) => {
  await page.goto("/wordle");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("microbreak-wordle-session:v1")))
    .not.toBeNull();
  await page.keyboard.type("crane");
  await page.keyboard.press("Enter");

  await page.goto("/");
  const main = page.getByRole("main");
  await expect(main).not.toContainText(/In progress|Resume|Solved|Best|New game|\d:\d\d/);
  await expect(card(page, "Wordle")).toHaveAccessibleName("Wordle Guess the hidden word");
});

test("hovering a card plays its board and leaving puts it back", async ({ page }) => {
  await page.goto("/");
  const resting = await board(page, "Sudoku").innerText();

  await card(page, "Sudoku").hover();
  await expect(card(page, "Sudoku")).toHaveAttribute("data-animating", "true");
  await expect.poll(() => board(page, "Sudoku").innerText()).not.toBe(resting);

  // Only the hovered card plays.
  await card(page, "Wordle").hover();
  await expect(card(page, "Wordle")).toHaveAttribute("data-animating", "true");
  await expect(card(page, "Sudoku")).toHaveAttribute("data-animating", "false");
  await expect.poll(() => board(page, "Sudoku").innerText()).toBe(resting);

  await page.mouse.move(0, 0);
  await expect(card(page, "Wordle")).toHaveAttribute("data-animating", "false");
});

test("keyboard focus plays a card's board too", async ({ page }) => {
  await page.goto("/");
  await card(page, "Minesweeper").focus();
  await expect(card(page, "Minesweeper")).toHaveAttribute("data-animating", "true");
  await card(page, "Minesweeper").blur();
  await expect(card(page, "Minesweeper")).toHaveAttribute("data-animating", "false");
});

test("with reduced motion the boards stay still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const resting = await board(page, "Sudoku").innerText();

  await card(page, "Sudoku").hover();
  await page.waitForTimeout(800);
  await expect(card(page, "Sudoku")).toHaveAttribute("data-animating", "false");
  expect(await board(page, "Sudoku").innerText()).toBe(resting);
});

test("on touch screens the boards stay still", async ({ browser, browserName }) => {
  test.skip(browserName === "firefox", "Firefox can't emulate a touch-only device");
  const context = await browser.newContext({ hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("/");

  await card(page, "Wordle").focus();
  await page.waitForTimeout(500);
  await expect(card(page, "Wordle")).toHaveAttribute("data-animating", "false");
  await context.close();
});
