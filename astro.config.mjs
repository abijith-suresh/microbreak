// @ts-check
import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { games } from "./src/data/games";

// Pages kept out of the sitemap: the 404 page and any game behind its flag.
const hiddenPaths = new Set([
  "/404",
  ...games.filter((game) => game.enabled === false).map((game) => game.href),
]);
const isListed = (/** @type {string} */ page) =>
  !hiddenPaths.has(new URL(page).pathname.replace(/\/$/, ""));

export default defineConfig({
  site: "https://microbreak.vercel.app",
  output: "static",
  integrations: [solid(), sitemap({ filter: isListed })],
  vite: {
    plugins: /** @type {any} */ (tailwindcss()),
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
