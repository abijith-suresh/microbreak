import { expect, type Page, test } from "@playwright/test";

const CARDS = [
  { name: "Sudoku", line: "Fill every row, column and box", href: "/sudoku" },
  { name: "Wordle", line: "Guess the hidden word", href: "/wordle" },
  { name: "Minesweeper", line: "Clear the board, dodge the mines", href: "/minesweeper" },
  { name: "Nonograms", line: "Reveal the picture from the clues", href: "/nonograms" },
];

const card = (page: Page, name: string) =>
  page.getByRole("main").getByRole("link", { name: new RegExp(`^${name}\\b`) });
const board = (page: Page, name: string) => card(page, name).locator("[aria-hidden='true']");

test("each card names its game, says one line about it and links to it", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main").getByRole("link")).toHaveCount(4);
  for (const { name, line, href } of CARDS) {
    await expect(card(page, name)).toHaveAccessibleName(`${name} ${line}`);
    await expect(card(page, name)).toHaveAttribute("href", href);
  }
  await expect(page.getByText(/Chess|2048/)).toHaveCount(0);
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
  const resting = await board(page, "Sudoku").textContent();

  await card(page, "Sudoku").hover();
  await expect(card(page, "Sudoku")).toHaveAttribute("data-animating", "true");
  await expect.poll(() => board(page, "Sudoku").textContent()).not.toBe(resting);

  // Only the hovered card plays.
  await card(page, "Wordle").hover();
  await expect(card(page, "Wordle")).toHaveAttribute("data-animating", "true");
  await expect(card(page, "Sudoku")).toHaveAttribute("data-animating", "false");
  await expect.poll(() => board(page, "Sudoku").textContent()).toBe(resting);

  await page.mouse.move(0, 0);
  await expect(card(page, "Wordle")).toHaveAttribute("data-animating", "false");
});

test("the Nonograms card fills in its picture on hover and rests again after", async ({ page }) => {
  await page.goto("/");
  const filled = () => board(page, "Nonograms").locator("[data-mark='filled']").count();
  const resting = await filled();

  await card(page, "Nonograms").hover();
  await expect(card(page, "Nonograms")).toHaveAttribute("data-animating", "true");
  await expect.poll(filled).toBeGreaterThan(resting);

  await page.mouse.move(0, 0);
  await expect.poll(filled).toBe(resting);
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
  const resting = await board(page, "Sudoku").textContent();

  await card(page, "Sudoku").hover();
  await page.waitForTimeout(800);
  await expect(card(page, "Sudoku")).toHaveAttribute("data-animating", "false");
  expect(await board(page, "Sudoku").textContent()).toBe(resting);
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

test.describe("moving between home and a game", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Needs cross-document view transitions"
  );

  const recordReveal = () =>
    window.addEventListener("pagereveal", (e) => {
      (window as unknown as { revealed: boolean }).revealed = Boolean(
        (e as unknown as { viewTransition: unknown }).viewTransition
      );
    });
  const revealed = (page: Page) =>
    page.evaluate(() => (window as unknown as { revealed?: boolean }).revealed);

  test("morphs into the game and back", async ({ page }) => {
    await page.addInitScript(recordReveal);
    await page.goto("/");
    await card(page, "Sudoku").click();
    await expect(page.getByRole("heading", { level: 1, name: "Sudoku" })).toBeVisible();
    expect(await revealed(page)).toBe(true);

    await page.getByRole("link", { name: "Back to games" }).click();
    await expect(card(page, "Sudoku")).toBeVisible();
    expect(await revealed(page)).toBe(true);
  });

  test("a Nonograms card and its game share transition names", async ({ page }) => {
    const names = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("[style*='view-transition-name']")]
          .map((el) => el.style.getPropertyValue("view-transition-name"))
          .filter((name) => name.endsWith("-nonograms"))
          .sort()
      );
    await page.goto("/");
    expect(await names()).toEqual(["board-nonograms", "title-nonograms"]);
    await card(page, "Nonograms").click();
    await expect(page.getByRole("heading", { level: 1, name: "Nonograms" })).toBeVisible();
    expect(await names()).toEqual(["board-nonograms", "title-nonograms"]);
  });

  test("just navigates with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(recordReveal);
    await page.goto("/");
    await card(page, "Wordle").click();
    await expect(page.getByRole("heading", { level: 1, name: "Wordle" })).toBeVisible();
    expect(await revealed(page)).toBe(false);
  });
});
