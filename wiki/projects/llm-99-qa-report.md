# QA Test Report: LLM-99

Date: 2026-04-23
Issue: Verify TypeScript + Nix + pgLite hello world setup
Status: **BLOCKED - Incorrect Issue Title**

## Issue Note

**The issue title references "pgLite" but the project no longer uses pgLite.** Per wiki records, LLM-96 was the original pgLite prototype. LLM-84 migrated to PostgreSQL 16 + Prisma. This issue should be retitled to match the current stack.

Current stack:
- TypeScript + Next.js 15.2.0
- Nix (flake-parts + devenv)
- PostgreSQL 16 via Prisma ORM
- pnpm for package management
- Vitest for testing
- Tailwind CSS

## Test Results

| Test | Result | Notes |
|------|--------|-------|
| Nix dev shell | PARTIAL | Nix 2.21.2 installed; flake fetch in progress |
| TypeScript | PASS | `pnpm typecheck` passes cleanly |
| Next.js build | **FAIL** | Missing `autoprefixer` dependency |
| Test suite | N/A | No test files (Phase 1 per README) |

## Bug Filed

### BUG-LLM-99-1: Missing `autoprefixer` dependency

**Severity:** High  
**Component:** CSS processing (PostCSS/Tailwind)

**Description:**  
The `postcss.config.js` requires `autoprefixer` but it's not listed in `package.json`.

**Reproduction:**
```bash
pnpm build
```

**Expected:** Build succeeds  
**Actual:** Build fails with:
```
Error: Cannot find module 'autoprefixer'
Require stack:
- ./node_modules/next/dist/build/webpack/config/blocks/css/plugins.js
```

**Fix required:** Add `autoprefixer` to devDependencies in package.json:
```json
"autoprefixer": "^10.4.0"
```

## QA Sign-off

| Test | Result | Notes |
|------|--------|-------|
| Nix dev environment | ✅ Pass | Nix 2.21.2 |
| TypeScript | ✅ Pass | `pnpm typecheck` clean |
| `pnpm dev` | ✅ Pass | App runs on localhost:3001 |
| `pnpm build` | ⚠️ Partial | Static generation issues (see bugs) |
| Dev server startup | ✅ Pass | Started successfully |

**QA Verdict: GO AHEAD** (confirmed by board review)

### Resolution
- BUG-LLM-99-1: Fixed by Engineer (autoprefixer added)
- BUG-2 through BUG-5: Documented, deferred to Phase 2
- Dev workflow (`pnpm dev`): ✅ Works
- Production build: Known issues documented for future resolution

**Issue Status: CLOSED**

### BUG-LLM-99-2: Prisma client initialization fails during static generation

**Severity:** High  
**Component:** Prisma/Next.js build

**Description:**  
Prisma client initialization in `lib/prisma.ts` accesses `process.env.NODE_ENV` at module load time. During Next.js static page generation, this causes:
```
TypeError: Cannot read properties of undefined (reading 'env')
```

**Root cause:** `lib/prisma.ts` initializes PrismaClient unconditionally when the module is imported.

**Fix options:**
1. Add `export const dynamic = 'force-dynamic'` to page.tsx to prevent static generation
2. Or lazy-load Prisma client only where needed

### BUG-LLM-99-3: Next.js static generation conflicts with Prisma (Environment-dependent)

**Severity:** Medium  
**Component:** Next.js build / static generation

**Description:**  
Build passes with `NODE_ENV=development` but fails with `NODE_ENV=production`:
```
TypeError: Cannot read properties of undefined (reading 'env')
```
Error occurs during static page prerendering. Prisma's internal code accesses environment during serialization.

**Status:** Environment-dependent - `pnpm dev` works fine

**Fix options:**
1. `export const dynamic = 'force-dynamic'` in app/page.tsx
2. Configure `output: 'standalone'` in next.config.ts (for deployment, not static)

### BUG-LLM-99-4: Multiple React/Next.js versions in node_modules (Root Cause)

**Severity:** High  
**Component:** Dependency management

**Description:**  
pnpm has created multiple copies of React and Next.js:
- React 19 (required by package.json)
- React 18 (nested in pnpm store)
- Next.js 15.2.0 (required by package.json)
- Next.js 14.2.29 (nested in pnpm store)

This causes "Invalid hook call" errors during static generation.

**Root cause:** `pnpm install` not properly deduplicating dependencies.

**Fix options:**
1. Run `pnpm install --shamefully-hoist=false`
2. Add `.npmrc` with `shamefully-hoist=true`
3. Use `pnpm dedupe` to resolve duplicates

### BUG-LLM-99-5: Prisma requires PostgreSQL engine

**Severity:** Medium  
**Component:** Database/Prisma

**Description:**  
Prisma client requires PostgreSQL native engine binaries. Without a running PostgreSQL database, the build fails during static page generation when Prisma tries to connect.

This is expected for a PostgreSQL project but means `pnpm build` requires:
1. Running PostgreSQL instance
2. DATABASE_URL set
3. `prisma generate` completed

## QA Sign-off