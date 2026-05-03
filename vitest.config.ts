import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "__tests__/**/*.test.ts",
      "tests/lib/**/*.test.ts",
    ],
    exclude: [
      "node_modules/**",
      "tests/e2e/**",
      "tests/helpers/**",
      "tests/mocks/**",
      "tests/index.test.ts",
      "__tests__/**",
      "**/*.d.ts",
      "**/*.config.ts",
      ".next/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "tests/**",
        "__tests__/**",
        "**/*.d.ts",
        "**/*.config.ts",
        ".next/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  esbuild: {
    target: "node20",
  },
});