# Lakshya

A mobile-first study dashboard where a student uploads their schedule (JSON) and a target exam date, then tracks daily progress against it. **Runs entirely in the browser** — no server, no database, no account. All data lives in IndexedDB on the user's device.

## Tech stack

- **Build:** Vite + React 18 + TypeScript
- **Routing:** react-router-dom (BrowserRouter; GitHub Pages SPA fallback via `public/404.html`)
- **Storage:** Dexie over IndexedDB
- **Styling:** Tailwind CSS
- **Tests:** Vitest + jsdom + fake-indexeddb
- **Package manager:** pnpm

## Setup

```bash
pnpm install
pnpm dev
```

Visit http://localhost:3000.

## Common commands

| Command          | Description                                      |
|------------------|--------------------------------------------------|
| `pnpm dev`       | Start the Vite dev server                        |
| `pnpm build`     | Type-check and build a production bundle (dist/) |
| `pnpm preview`   | Serve the production build locally               |
| `pnpm test`      | Run the unit + repo test suites                  |
| `pnpm typecheck` | `tsc --noEmit`                                   |
| `pnpm lint`      | ESLint                                           |

## Deploying to GitHub Pages

URLs are clean (`https://<user>.github.io/<repo>/import`, no `#/`). A refresh or direct deep link works because `public/404.html` runs the [rafgraph](https://github.com/rafgraph/spa-github-pages) redirect — Pages serves it on any 404, the script encodes the path into a query string, and `index.html`'s decoder restores it before React mounts.

> If you fork to a custom domain or user/org root site, override `VITE_BASE=/` in CI. A small Vite plugin (`patchSpaFallbackBase` in `vite.config.ts`) keeps `public/404.html`'s `pathSegmentsToKeep` in sync with the resolved base — no second edit required.

Drop this workflow into `.github/workflows/deploy-pages.yml` in the GitHub web UI (or push it from a token with `workflow` scope). It builds `dist/` on every push to `main` and injects `VITE_BASE=/<repo>/` so assets resolve under the project-site URL `https://<user>.github.io/<repo>/`.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          VITE_BASE: /${{ github.event.repository.name }}/
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Project structure

```
src/
├── main.tsx              Vite entrypoint
├── App.tsx               Router + theme provider
├── globals.css           Tailwind layers + design tokens
├── db.ts                 Dexie schema (single seam)
├── pages/
│   ├── DashboardLayout.tsx
│   ├── Dashboard.tsx     Today's tasks, focus pin, stats, days-left hero
│   ├── Tasks.tsx         Browse + filter all schedule tasks; overall progress
│   ├── Calendar.tsx      Month grid with daily completion heat
│   ├── Subjects.tsx      Subject grid + per-subject detail with "study today" pin
│   └── Import.tsx        Schedule import + data management (export/restore/erase)
├── components/           DaysLeftHero, SessionWidget, StatusBar, …
├── domain/               Zod schemas + pure functions
│   ├── schedule.ts
│   ├── session.ts        Discriminated-union Session (open | closed)
│   ├── progress.ts
│   └── ingest.ts         generateTasksFromSchedule (pure)
├── repo/                 Domain operations over Dexie
│   ├── schedules.ts      importSchedule, getLatestSchedule
│   ├── tasks.ts          listTasks, listSubjects, recordTaskProgress, pickNextTaskForToday
│   ├── sessions.ts       startSession, endSession, getActiveSession
│   ├── dashboard.ts      getDashboard, getOverallProgress
│   ├── calendar.ts       getCalendarSummary (per-day heat for the month)
│   └── serialize.ts      exportAll, importAll, clearAll
└── lib/                  countdown, format, dates, urgency-tones, theme-context, focus-pin
```

## Data model

Stored in IndexedDB:

- **Schedule** — title, target date, raw imported JSON, hours/day
- **Task** — title, subject, target date (YYYY-MM-DD), priority
- **TaskProgress** — `(taskId, date)` unique; status pending/completed
- **Session** — discriminated union: `{ state: "open" }` while active, `{ state: "closed", endedAt, duration, reflection }` once ended

Dates are ISO date strings (`YYYY-MM-DD`) at storage boundaries; Dates only appear inside computation. There is no `User` concept — one device, one user.

## Backup & restore

Lakshya is per-device. The Import page's "Manage data" panel has **Export JSON**, **Restore backup**, and **Erase all data**. Export early, restore on a new browser, and you keep your streak. The dashboard footer links straight there.

## Sessions

The **Up Next** card on the dashboard includes a **Start Session** button. It picks the highest-priority incomplete task for today, opens a stopwatch (counts up — no fixed target), and writes an open `Session` row. When the user stops the session, the reflection step has a "Mark this task as done" toggle (default on) and three emoji reflection buttons. The stored `duration` (seconds) is computed from elapsed time, never from a target. A discriminated union enforces the open/closed state at the type level — no nullable `endedAt`/`duration` parallel fields.

## Subjects & focus pinning

Every imported schedule produces a list of subjects (Anatomy, Pathology, …). The Subjects tab shows them as a list with letter-tile icons; tapping a subject opens its detail page with a per-subject progress bar, a **Study this subject today** pin, and the subject's tasks. Pinning a subject surfaces a "Today's focus" section on the dashboard alongside the schedule's tasks for today. Pins are stored in `localStorage` keyed on the day, so they auto-clear at midnight — `today` means today, not "until I remember to unpin."

## What was Phase 0

Earlier versions of this app ran on Next.js + Postgres + Prisma with a fake-auth header. That whole stack is now gone. The migration commit is intentionally large because the move from server-backed to local-first touches every data-fetching call site.

## Phase 2 — PWA

The app installs to home screen, runs from cache, and survives offline. Built on `vite-plugin-pwa` (Workbox under the hood).

- **Phase 2a:** manifest, icons, service worker, offline launch. `registerType: "prompt"` — new versions wait quietly until the next page load rather than ambushing an active focus session.
- **Phase 2b:** in-app "Update available" banner via `useRegisterSW`. Mounted at the app root (above the router) because a SW update is a global signal. The "Update and reload" button is the destructive moment — `vite-plugin-pwa` auto-reloads the page after the new SW takes control, and the label names that consequence.
- **Phase 2c:** self-host fonts via `@fontsource-variable/*` so offline rendering matches online pixel-for-pixel. `--font-sans` and `--font-display` CSS variables in `globals.css` are the single source of truth for typography; both Tailwind utilities and the `html` body-font rule reference the vars.

## Phase 3 — Clean URLs

`BrowserRouter` replaces `HashRouter`. URLs lose the `#/`. The GitHub Pages SPA fallback is implemented via `public/404.html` (encoder) + the small script in `index.html` `<head>` (decoder). After the SW installs, deep-link refreshes hit the precached `index.html` via the SW's `navigateFallback` and bypass the redirect entirely.
