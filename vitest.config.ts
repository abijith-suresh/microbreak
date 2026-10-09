import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  test: {
    testTimeout: 60_000,
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
});
