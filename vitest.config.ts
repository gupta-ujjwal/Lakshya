import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // vite-plugin-pwa's React virtual module isn't available under
      // vitest (the plugin doesn't run here). Point it at a stub that
      // returns the at-rest "no update needed" state, so components
      // that import useRegisterSW render their default branch.
      "virtual:pwa-register/react": resolve(
        __dirname,
        "tests/stubs/pwa-register.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "tests/**", "**/*.d.ts", "**/*.config.ts"],
    },
  },
});
