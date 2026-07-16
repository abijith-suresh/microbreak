// @ts-check
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://microbreak.vercel.app",
  output: "static",
  integrations: [solid()],
  vite: {
    plugins: /** @type {any} */ (tailwindcss()),
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
