import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Microbreak — Think while your agents work");
  await expect(page.getByRole("heading", { level: 1, name: "Microbreak" })).toBeVisible();
});
