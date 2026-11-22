import { expect, test } from "@playwright/test";

const SITE = "https://microbreak.vercel.app";

for (const [path, canonical] of [
  ["/", `${SITE}/`],
  ["/sudoku", `${SITE}/sudoku/`],
] as const) {
  test(`${path} has a canonical link`, async ({ page }) => {
    await page.goto(path);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
  });
}

test("robots.txt points to the sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");

  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
});

test("sitemap lists the shown pages only", async ({ request }) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.ok()).toBe(true);
  expect(await index.text()).toContain(`${SITE}/sitemap-0.xml`);

  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).toContain(`<loc>${SITE}/sudoku/</loc>`);
  expect(sitemap).not.toContain("/404");
  expect(sitemap).not.toContain("/2048");
});
