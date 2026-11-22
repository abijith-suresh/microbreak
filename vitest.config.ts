import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

const alias = { "@": "/src" };

export default defineConfig({
  resolve: { alias },
  test: {
    testTimeout: 60_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "html"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        plugins: [solid()],
        test: {
          name: "components",
          environment: "happy-dom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["src/components/__tests__/setup.ts"],
        },
      },
    ],
  },
});
