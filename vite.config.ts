import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// `base` is set so assets resolve under GitHub Pages project-site URLs
// (`<user>.github.io/<repo>/`). For a custom domain or root host, override
// with `VITE_BASE=/`. For local dev, the default `/` works.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), tsconfigPaths()],
  server: { port: 3000 },
  build: { outDir: "dist", sourcemap: true },
});
