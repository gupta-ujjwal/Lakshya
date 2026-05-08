import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

// `base` is set so assets resolve under GitHub Pages project-site URLs
// (`<user>.github.io/<repo>/`). For a custom domain or root host, override
// with `VITE_BASE=/`. For local dev, the default `/` works.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [
    react(),
    tsconfigPaths(),
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
        // navigateFallback is a no-op while HashRouter is active
        // (App() in src/App.tsx) — every in-app navigation resolves as a
        // request for "/" anyway. This becomes load-bearing if the
        // BrowserRouter swap (Phase 3) ever lands.
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
