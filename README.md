# Lakshya

A mobile-first study dashboard where a student uploads their schedule (JSON) and a target exam date, then tracks daily progress against it. **Runs entirely in the browser** — no server, no database, no account. All data lives in IndexedDB on the user's device.

## Tech stack

- **Build:** Vite + React 18 + TypeScript
- **Routing:** react-router-dom (HashRouter, for friction-free GitHub Pages hosting)
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

The router uses `HashRouter`, so a refresh on `/import` (URL: `…/#/import`) doesn't 404 on Pages.

Drop this workflow into `.github/workflows/deploy-pages.yml` in the GitHub web UI (or push it from a token with `workflow` scope). It builds `dist/` on every push to `main` and injects `VITE_BASE=/<repo>/` so assets resolve under the project-site URL `https://<user>.github.io/<repo>/`. For a custom domain or user/org root site, override `VITE_BASE=/`.

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
│   ├── Dashboard.tsx     Reads via repo, exports/imports JSON
│   └── Import.tsx        Validates JSON via Zod, calls importSchedule
├── components/           DaysLeftHero, SessionWidget, StatusBar, …
├── domain/               Zod schemas + pure functions
│   ├── schedule.ts
│   ├── session.ts        Discriminated-union Session (open | closed)
│   ├── progress.ts
│   └── ingest.ts         generateTasksFromSchedule (pure)
├── repo/                 Domain operations over Dexie
│   ├── schedules.ts      importSchedule, getLatestSchedule
│   ├── tasks.ts          listTasks, recordTaskProgress, pickNextTaskForToday
│   ├── sessions.ts       startSession, endSession, getActiveSession
│   ├── dashboard.ts      getDashboard (streak, adherence, overdue)
│   └── serialize.ts      exportAll, importAll, clearAll
└── lib/                  countdown, format, dates, urgency-tones, theme-context
```

## Data model

Stored in IndexedDB:

- **Schedule** — title, target date, raw imported JSON, hours/day
- **Task** — title, subject, target date (YYYY-MM-DD), priority
- **TaskProgress** — `(taskId, date)` unique; status pending/completed
- **Session** — discriminated union: `{ state: "open" }` while active, `{ state: "closed", endedAt, duration, reflection }` once ended

Dates are ISO date strings (`YYYY-MM-DD`) at storage boundaries; Dates only appear inside computation. There is no `User` concept — one device, one user.

## Backup & restore

Lakshya is per-device. The dashboard's "Your data" card has **Export JSON**, **Import JSON**, and **Erase all data** buttons. Export early, restore on a new browser, and you keep your streak.

## Sessions

The **Up Next** card on the dashboard includes a **Start Session** button. It picks the highest-priority incomplete task for today, opens a 25-minute focus timer, and writes an open `Session` row. Finishing the timer naturally marks the linked task complete via `TaskProgress`; stopping early just closes the session. A discriminated union enforces the open/closed state at the type level — no nullable `endedAt`/`duration` parallel fields.

## What was Phase 0

Earlier versions of this app ran on Next.js + Postgres + Prisma with a fake-auth header. That whole stack is now gone. The migration commit is intentionally large because the move from server-backed to local-first touches every data-fetching call site. Phase 2 is PWA (service worker + manifest + offline app shell).
