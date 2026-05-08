import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// `base` is set so assets resolve under GitHub Pages project-site URLs
// (`<user>.github.io/<repo>/`). For a custom domain or root host, override
// with `VITE_BASE=/`. For local dev, the default `/` works.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000,
    // Exclude project dirs that aren't part of the Vite source tree from
    // the file watcher. Without this, watching .direnv/ (Nix flake inputs,
    // tens of thousands of files) blows past the default inotify limit
    // and `pnpm dev` exits with ENOSPC before serving the first request.
    watch: {
      ignored: [
        "**/.direnv/**",
        "**/.devenv/**",
        "**/apm_modules/**",
        "**/wiki/**",
        "**/tasks/**",
        "**/life/**",
        "**/memory/**",
        "**/test-results/**",
        "**/dist/**",
      ],
    },
  },
  build: { outDir: "dist", sourcemap: true },
});
