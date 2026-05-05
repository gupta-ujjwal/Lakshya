# Lakshya

A lightweight, mobile-first web dashboard where a student uploads their study schedule (JSON) and a target exam date, then tracks daily progress against it.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL 16 via Prisma ORM
- **Styling:** Tailwind CSS
- **Shell:** Nix + devenv
- **Package Manager:** pnpm

## Prerequisites

- Nix 2.21+ with flakes enabled
- direnv (optional but recommended)

## Setup

### 1. Clone & Enter

```bash
git clone https://github.com/gupta-ujjwal/Lakshya
cd Lakshya
```

### 2. Enable direnv (optional)

```bash
direnv allow
```

This automatically loads the dev shell when you cd into the project.

### 3. Alternative: Manual Nix Shell

```bash
nix develop
```

### 4. Start PostgreSQL

```bash
devenv up
```

This starts PostgreSQL on port 5432 with a database named `lakshya`.

### 5. Install Dependencies

```bash
pnpm install
```

### 6. Copy Environment File

```bash
cp .env.example .env
```

### 7. Push Schema to Database

```bash
pnpm db:push
```

This creates the database schema without running migrations (use `pnpm db:migrate` for tracked migrations).

### 8. Generate Prisma Client

```bash
pnpm db:generate
```

### 9. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) — you should see "Hello Lakshya".

## Database Commands

| Command          | Description                    |
|------------------|--------------------------------|
| `pnpm db:push`   | Push schema to database        |
| `pnpm db:generate` | Regenerate Prisma client     |
| `pnpm db:migrate` | Run migrations                 |
| `pnpm db:studio` | Open Prisma Studio             |

## Type Checking

```bash
pnpm typecheck
```

## Testing

Unit tests:

```bash
pnpm test
```

E2e tests:

```bash
pnpm install
pnpm exec playwright install --with-deps
pnpm test:e2e
```

E2e tests run against a dev server that starts automatically via `webServer` config.

## Project Structure

```
lakshya/
├── app/               # Next.js App Router pages
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page ("Hello Lakshya")
├── components/        # React components
├── lib/              # Utility code (Prisma client)
├── prisma/
│   └── schema.prisma  # Database schema (5 models)
├── devenv.nix        # Devenv configuration
├── flake.nix         # Nix flake configuration
├── .envrc            # Direnv configuration
└── .env.example      # Environment variable template
```

## Data Models

The five core models are:

- **User** — a study tracker account
- **Schedule** — a target exam schedule with tasks
- **Task** — a single study task within a schedule
- **TaskProgress** — daily progress log for a task
- **Session** — a focus block (Pomodoro) tied to an optional Task, with `startedAt`/`endedAt`/`duration` and an end-of-session reflection emoji

## Sessions

The dashboard's **Up Next** card includes a **Start Session** button — the
single-click ignition for the daily loop. It picks the highest-priority
incomplete task for today, opens a 25-minute focus timer, and writes a
`Session` row (`startedAt`, `endedAt`, `duration`, optional `reflection`).
Finishing the timer naturally marks the linked task complete via
`TaskProgress`; stopping early just closes the session.

API:

- `POST /api/sessions` — start a session. Body: `{ taskId?, focusMinutes? }`.
  When `taskId` is omitted, the server picks the next incomplete task for
  today (by priority, then creation order). Defaults to a 25-minute focus.
- `PATCH /api/sessions/:id` — end a session. Body: `{ reflection?, markTaskComplete? }`.
  Reflection is one of `💪 🙂 😩`. When `markTaskComplete` is `true` and the
  session was bound to a task, today's `TaskProgress` is upserted to
  `completed`.

## Known Limitations

- No authentication (Phase 1)
- Sessions don't survive a page reload mid-timer (Phase 2 polish)
- No business logic beyond the daily-loop ignition (Phase 1)