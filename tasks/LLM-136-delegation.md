# LLM-136: Schedule upload error - Engineering Subtask

**Parent Issue:** LLM-136  
**Assigned to:** Engineer (aea43016-9df7-420b-9298-10a9d72807d1)  
**Status:** Ready for Development

## Problem Statement
User gets an error when uploading `btr_schedule.json` (112 days, 42310 bytes). The file is located at `/home/vishal/juspay/Playground/lakshya/btr_schedule.json`.

## Root Cause Analysis (CONFIRMED)

I found the bug: **date format validation mismatch** between `ImportScheduleSchema` and the database schema.

**The Problem:**
- `lib/api/schedules/schemas.ts:20` defines `targetDate: z.string()` with NO format validation
- But `lib/api/schedules/ingest.ts:86` passes it directly to `new Date(input.targetDate)` for Prisma
- The test file `tests/lib/api/schedules/schemas.test.ts:90-97` shows `CreateScheduleSchema` REQUIRES datetime format with time component
- The `btr_schedule.json` has `"targetDate": "2026-07-31"` (date-only)

When Prisma tries to save this, `new Date("2026-07-31")` is interpreted inconsistently and causes an error.

**Contrast with working schemas:**
```typescript
// CreateScheduleSchema (works)
targetDate: z.string().datetime().or(z.date())

// ImportScheduleSchema (broken)  
targetDate: z.string()  // <- No validation!
```

**The Fix:**
Update `ImportScheduleSchema` to accept date-only format and normalize it, OR ensure the ingest function properly converts date strings to Date objects before Prisma operations.

## Files Involved
- `lib/api/schedules/schemas.ts` - Zod schema definitions
- `lib/api/schedules/ingest.ts` - Task generation and import logic
- `app/api/schedules/import/route.ts` - API endpoint handler
- `app/import/page.tsx` - Frontend upload component

## Reproduction Steps
1. Navigate to the schedule upload UI at `/import`
2. Upload the attached `btr_schedule.json` file
3. Observe the error

## Expected Behavior
Schedule parses and shows on dashboard.

## Acceptance Criteria
- [ ] Investigate exact error cause by reproducing locally
- [ ] Fix the underlying issue (likely date format validation or parsing)
- [ ] Add appropriate error handling if needed
- [ ] Write tests covering the fix (TDD approach)
- [ ] Verify `pnpm build` and `pnpm test` pass
- [ ] Successfully upload `btr_schedule.json` without errors

## Context from Parent Issue
- Attachment: `btr_schedule.json` (22233562-2237-456c-a1a0-6c585fcf1f86)
- Repro: Upload via schedule upload UI
- Priority: medium

---
Delegated by: CTO  
Date: 2026-04-27
