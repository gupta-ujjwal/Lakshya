import { defineConfig, type PluginOption } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

// Derive pathSegmentsToKeep in dist/404.html from the resolved Vite
// base, so a fork that flips VITE_BASE doesn't have to remember to
// touch public/404.html too. Vite copies public/ verbatim, so the
// substitution lands in closeBundle (after vite-plugin-pwa has
// finished writing dist/).
function patchSpaFallbackBase(): PluginOption {
  let outDir = "dist";
  let segments = 1;
  return {
    name: "spa-fallback-base",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
      segments = config.base.split("/").filter(Boolean).length;
    },
    closeBundle() {
      const file = resolve(outDir, "404.html");
      try {
        const html = readFileSync(file, "utf-8");
        const patched = html.replace(
          /var pathSegmentsToKeep = \d+;/,
          `var pathSegmentsToKeep = ${segments};`,
        );
        if (patched !== html) writeFileSync(file, patched);
      } catch {
        // 404.html is optional — projects can drop public/404.html and
        // skip this whole code path.
      }
    },
  };
}

// `base` is set so assets resolve under GitHub Pages project-site URLs
// (`<user>.github.io/<repo>/`). For a custom domain or root host, override
// with `VITE_BASE=/`. For local dev, the default `/` works.
//
// This value also flows through `import.meta.env.BASE_URL` into the
// BrowserRouter's basename (src/App.tsx) — asset prefix and route
// prefix happen to be the same string for vanilla deploys. They would
// diverge under a reverse proxy that rewrites paths; in that case
// introduce a separate VITE_ROUTER_BASE env var and thread it into
// App.tsx instead of using import.meta.env.BASE_URL.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [
    react(),
    tsconfigPaths(),
    patchSpaFallbackBase(),
    VitePWA({
      // 'prompt' (not 'autoUpdate'): a silent reload mid-focus-session would
      // wipe the SessionWidget timer in src/components/SessionWidget.tsx.
      // Without a banner UI in this phase, updates simply wait until the
      // user closes the tab — safe default. The banner lands in Phase 2b.
      registerType: "prompt",
      manifest: {
        name: "Lakshya — Study Tracker",
        short_name: "Lakshya",
        description:
          "Local-first study tracker with focus sessions and progress tracking. Runs entirely on your device.",
        // start_url is relative ("./") so the manifest works under both
        // root-host and project-site bases (GitHub Pages /<repo>/).
        start_url: "./",
        scope: "./",
        display: "standalone",
        // theme_color here drives the OS splash and task-switcher tint.
        // Distinct surface from index.html's <meta name="theme-color">
        // (browser chrome, media-conditional) and from globals.css design
        // tokens (in-app rendering). Three sites, three different roles —
        // do not source from one constant.
        //
        // The brand-blue value mirrors the icon's fill so the OS chrome
        // matches the installed icon at install time. It does mean a
        // brief blue→cream transition on Android when the app loads
        // (in-app theme-color meta takes over), which is acceptable for
        // identity-on-icon vs. continuous-chrome.
        background_color: "#faf9f7",
        theme_color: "#2AABFF",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // navigateFallback is load-bearing under BrowserRouter
        // (App() in src/App.tsx): a refresh on /Lakshya/import after
        // the SW is installed is intercepted here and served from the
        // precached index.html, bypassing the public/404.html redirect
        // dance that handles the same case for fresh visits.
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
      // Disable the dev-mode SW so HMR isn't fighting a precache.
      devOptions: { enabled: false },
    }),
  ],
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
