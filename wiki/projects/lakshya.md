# Lakshya Project

Learning management system for NEET PG aspirants (India).

## Overview

Lightweight, mobile-first web dashboard where a student uploads their study schedule (JSON) and tracks daily progress against an exam date.

Three core questions answered daily:
- What am I supposed to study today?
- How far behind/ahead am I against the plan?
- How many days until the exam?

## Tech Stack Decision History

### Initial Decision (LLM-96) - COMPLETED
Basic prototype with:
- TypeScript as primary language
- Nix for dependency management
- pgLite for database operations
- Vitest for testing

**Status:** Implemented and committed (commits: 7d23b9d, 2abe7a8)

### Full Stack Decision (LLM-84) - IN PROGRESS
Migration to production-ready stack:
- Next.js 16 + App Router
- TypeScript + Tailwind CSS + shadcn/ui
- PostgreSQL (full, not pgLite)
- Prisma ORM with 5 data models
- Nix + devenv for development environment

## Data Models (LLM-84)

### User
Core user entity for authentication and profile.

### Session
User authentication sessions.

### Schedule
Study schedules uploaded by users.

### Task
Individual learning tasks within schedules.

### TaskProgress
Progress tracking for each task completion.

## Project Status

### Completed
- [x] LLM-96: Basic TypeScript + Nix + pgLite hello world
- [x] LLM-99: QA verification complete (GO AHEAD - dev workflow works)
- [x] LLM-84: Phase 1 foundation scaffold - COMPLETED 2026-04-23
  - [x] LLM-98: Engineer implementation (Next.js + Prisma + PostgreSQL)
- [x] LLM-105: Build error fix - COMPLETED 2026-04-23
  - [x] LLM-106: Fixed Nix flake + devenv integration
- [x] **LLM-115: Change Management Process (CMP) established — 2026-04-24**
  - Created wiki/cmp.md with 4-stage process (Planning → Design → Development → QA)
  - [LLM-116](/LLM/issues/LLM-116): CTO update instructions — DONE
  - [LLM-117](/LLM/issues/LLM-117): Engineer update instructions — DONE
  - [LLM-118](/LLM/issues/LLM-118): QA Lead update instructions — DONE
  - [LLM-119](/LLM/issues/LLM-119): Designer update instructions — DONE
- [x] **LLM-108: Dashboard v1 Implementation — COMPLETED 2026-04-24**
  - [x] LLM-109: Design System & Mockups (Designer) — DONE
  - [x] LLM-110: Backend APIs (Engineer) — DONE
  - [x] LLM-111: Frontend Implementation (Engineer) — DONE
  - [x] LLM-112: QA Testing (QA) — DONE (268 tests passing)
  - [x] LLM-113: Bootstrap script bug fix (Engineer) — DONE
  - [x] LLM-121: CSS pipeline fix (Engineer) — DONE
  - [x] LLM-120: Design Review — APPROVED (92% compliance)

### Completed
- [x] **LLM-124: Schedule Schema Discussion — DONE 2026-04-27**
  - [x] LLM-125: Schema documentation (Prisma schema, Zod schemas, update flow) — DONE
  - [x] LLM-126: Import/ingestion workflow implementation plan — DONE
  - Board requirements covered: N-day timetable, import flow, error handling, dashboard DB integration

### Blocked
_None_

### In Progress (Separate Track)
- [ ] LLM-114: Production build optimization (static prerender issue)

### Known Issues (Deferred to Phase 2)
- BUG-LLM-99-2: Prisma static generation conflict (add `dynamic = 'force-dynamic'`)
- BUG-LLM-99-3: Environment-dependent build (dev works, prod has issues) — Related to LLM-114
- BUG-LLM-99-4: Multiple React/Next.js versions (pnpm deduplication needed)
- BUG-LLM-99-5: Prisma requires PostgreSQL engine for production builds

### Pending
- [ ] Authentication
- [ ] Additional dashboard enhancements (Phase 2)

## Key Files

- `flake.nix` - Nix development environment
- `package.json` - Node.js dependencies
- `design/` - Design system and mockups
- `app/` - Next.js App Router pages
- `components/` - Reusable UI components
- `tests/` - Vitest test files

## Design System (LLM-109)

Located in `/design/README.md`. Covers:
- Color palette (light/dark mode CSS variables)
- Typography scale (Tailwind classes)
- Spacing system (4px base unit)
- Component patterns (cards, buttons, inputs, navigation)
- State handling (empty, loading, error)

**Design Review (LLM-120):** Dashboard v1 implementation scored 92% compliance. Three minor improvements recommended:
- CR-001: Add keyboard focus styles
- CR-002: Load custom Google Fonts (DM Sans, Plus Jakarta Sans)
- CR-003: Add reduced motion support

## Architecture Notes

The project evolved from a simple pgLite prototype (LLM-96) to a full-stack application (LLM-84). This represents a deliberate architecture upgrade to support:
- Server-side rendering with Next.js
- Type-safe database operations with Prisma
- Full PostgreSQL for production workloads
- Modern UI components with shadcn/ui

## Related Issues

- LLM-126: Schedule import workflow (in progress) — Board-approved plan
- LLM-84: Phase 1 foundation scaffold requirements
- LLM-95: Project initiation
- LLM-96: Initial pgLite setup (completed)
- LLM-98: Engineer task for full implementation

## Development Workflow

**Important**: Use `nix develop --no-pure-eval` (not just `nix develop`)

1. Enter dev shell: `nix develop --no-pure-eval`
2. Install deps: `pnpm install`
3. Run dev: `pnpm dev`
4. Run tests: `pnpm test`
5. Or use direnv for automatic shell activation

## Nix/Devenv Configuration (LLM-105 fix)

The flake.nix uses devenv v2 with flake-parts integration. Key files:
- `flake.nix` - Nix flake with devenv.flakeModule
- `devenv.nix` - devenv configuration (devenv v2 API)
- `.envrc` - direnv integration (from devenv flake-parts template)
- `.devenv/root` - devenv directory marker

### Devenv v2 API Changes
- Use `languages.javascript` instead of `languages.nodejs`
- Use `languages.javascript.pnpm.enable = true` instead of separate packages
- Use `devenv.shells.default` instead of `devShells.default`
- Set `devenv.root` with absolute path for direnv compatibility

### Devenv Inputs in flake.nix
```nix
devenv.url = "github:cachix/devenv";
devenv.inputs.nixpkgs.follows = "nixpkgs";
```

## Critical Issue: Dashboard v1 Runtime Failure

**Discovered:** 2026-04-24

Dashboard v1 has a critical runtime error preventing it from loading:
- Error: "Invariant: missing bootstrap script" (Next.js)
- QA failed to catch this — only reviewed code/unit tests, never ran the actual app

**Bug fix in progress:** [LLM-113](/LLM/issues/LLM-113)

**QA Process Failure:** Will institute manual smoke testing requirement for all future QA tasks.

## Change Management Process (CMP) — Board Approval Pattern

**LLM-126 established the board approval workflow:**
1. CTO creates comprehensive plan document (issue#document-plan)
2. Board reviews and either approves (\"YOU CAN GO AHEAD\") or requests changes
3. Upon approval, CTO creates subtasks following CMP stages:
   - Design stage (if UI/UX changes) → Designer
   - Development stage → Engineer
   - QA stage → QA Lead
4. Parent issue remains in_progress to track overall progress

**Key insight:** Backend-only work can begin in parallel with Design stage since they don't overlap (schemas, API routes).

## Import Workflow Bugs Fixed

**LLM-130 Bug Fix (2026-04-24):**
- `app/import/page.tsx` had a critical bug: `handleImport` sent `{ placeholder: true }` instead of actual file content
- Root cause: Component stored `FileInfo` (metadata only) but not the actual `File` object needed to read content
- Fix: Added `selectedFile` state to store `File` object, then read content with `selectedFile.text()`

**Pattern to remember:** When handling file uploads in React, must store the `File` object (not just metadata) to read its content.

## LLM-101: ESLint Configuration Added (2026-04-27)

**Issue:** ESLint was not configured in the project.

**Solution:** Added `eslint.config.mjs` (ESLint 10+ flat config format):
- `@eslint/js` for base rules
- `typescript-eslint` for TypeScript support
- `eslint-plugin-react-hooks` for React hooks rules
- `eslint-plugin-react-refresh` for HMR compatibility
- `globals` for browser/node environment globals

**Key rules enabled:**
- `@typescript-eslint/no-unused-vars` (error, ignores `_` prefixed)
- `react-hooks/exhaustive-deps` (warn)
- `react-refresh/only-export-components` (warn)
- `@typescript-eslint/no-explicit-any` (warn)

**Added to package.json:**
- `lint` script: `eslint .`

**Note:** Flat config uses ESM format (`.mjs`). Traditional `.eslintrc` format is deprecated.

## Next Milestone

1. Complete LLM-126 implementation subtasks (LLM-127, LLM-128, LLM-130 — QA still pending)
2. Fix production build (LLM-114)
3. Dashboard DB integration (replace hardcoded mock data with real Prisma queries)
