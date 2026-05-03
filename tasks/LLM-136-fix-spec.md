# LLM-136 Fix Specification: Schedule Upload Error

## Problem Summary
Schedule upload fails when importing `btr_schedule.json` with date-only format `"2026-07-31"`.

## Root Cause
`ImportScheduleSchema` accepts `targetDate` as `z.string()` without format validation, but the database expects a proper DateTime. The mismatch causes Prisma to fail when saving.

## Fix Required

### 1. Update `lib/api/schedules/schemas.ts`

Change line 20 from:
```typescript
targetDate: z.string(),
```

To:
```typescript
targetDate: z.string().transform((val) => {
  // Normalize date-only format to datetime
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return new Date(`${val}T00:00:00.000Z`);
  }
  // Already datetime format
  return new Date(val);
}).or(z.date()),
```

### 2. Alternative Fix (if transform causes type issues):

Replace line 20 with:
```typescript
targetDate: z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(`${val}T00:00:00.000Z`)),
  z.string().datetime(),
]),
```

### 3. Update Tests

Add test in `tests/lib/api/schedules/schemas.test.ts`:
```typescript
it("accepts date-only format for targetDate", () => {
  const result = ImportScheduleSchema.safeParse({
    title: "Test Schedule",
    targetDate: "2026-07-31",
    cycleLengthDays: 7,
    timetable: [{ dayNumber: 1, slots: [{ subject: "Test" }] }],
  });
  expect(result.success).toBe(true);
});
```

### 4. Verify Fix

Test with the actual file:
```bash
# Upload btr_schedule.json via the import UI
# Or test programmatically:
curl -X POST http://localhost:3000/api/schedules/import \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d @btr_schedule.json
```

## Files to Modify
1. `lib/api/schedules/schemas.ts` - Add date format validation/transformation
2. `tests/lib/api/schedules/schemas.test.ts` - Add test coverage for date formats
3. (Optional) `lib/api/schedules/ingest.ts` - Remove redundant date conversion if handled in schema

## Verification Steps
- [ ] `pnpm test` passes with new tests
- [ ] `pnpm build` succeeds
- [ ] Upload `btr_schedule.json` via UI works without error
- [ ] Schedule appears on dashboard after upload

---
**Priority:** Medium  
**Delegated by:** CTO  
**Due:** Follow CMP Development stage (TDD + build + tests pass before marking `in_review`)
