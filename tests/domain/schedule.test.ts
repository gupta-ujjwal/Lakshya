import { describe, it, expect } from "vitest";
import {
  ImportScheduleSchema,
  validateCycleTimetable,
  type ImportScheduleInput,
  type TimetableDay,
} from "@/domain/schedule";

const ALL_SUBJECTS = (n: number): TimetableDay => ({
  dayNumber: n,
  slots: [{ subject: "Math" }],
});

const baseInput = (timetable: TimetableDay[]): unknown => ({
  title: "Plan",
  targetDate: "2026-12-31",
  cycleLengthDays: 7,
  hoursPerDay: 4,
  timetable,
});

describe("validateCycleTimetable", () => {
  it("returns empty arrays for a complete cycle", () => {
    const result = validateCycleTimetable(
      [1, 2, 3, 4, 5, 6, 7].map(ALL_SUBJECTS),
      7,
    );
    expect(result).toEqual({ outOfRange: [], duplicate: [], missing: [] });
  });

  it("reports missing days", () => {
    const result = validateCycleTimetable(
      [1, 2, 4, 5, 6, 7].map(ALL_SUBJECTS),
      7,
    );
    expect(result.missing).toEqual([3]);
    expect(result.duplicate).toEqual([]);
    expect(result.outOfRange).toEqual([]);
  });

  it("reports duplicate days", () => {
    const result = validateCycleTimetable(
      [1, 2, 2, 3, 4, 5, 6, 7].map(ALL_SUBJECTS),
      7,
    );
    expect(result.duplicate).toEqual([2]);
    expect(result.missing).toEqual([]);
  });

  it("reports out-of-range days and excludes them from missing/duplicate", () => {
    const result = validateCycleTimetable(
      [1, 2, 3, 4, 5, 6, 7, 8].map(ALL_SUBJECTS),
      7,
    );
    expect(result.outOfRange).toEqual([8]);
    expect(result.missing).toEqual([]);
  });

  it("deduplicates repeated out-of-range days so the user sees each number once", () => {
    const result = validateCycleTimetable(
      [1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9].map(ALL_SUBJECTS),
      7,
    );
    expect(result.outOfRange).toEqual([8, 9]);
  });

  it("reports all three categories together when present", () => {
    const result = validateCycleTimetable(
      [
        ALL_SUBJECTS(1),
        ALL_SUBJECTS(2),
        ALL_SUBJECTS(2), // duplicate
        ALL_SUBJECTS(4),
        ALL_SUBJECTS(8), // out of range
        // missing: 3, 5, 6, 7
      ],
      7,
    );
    expect(result.duplicate).toEqual([2]);
    expect(result.outOfRange).toEqual([8]);
    expect(result.missing).toEqual([3, 5, 6, 7]);
  });
});

describe("ImportScheduleSchema cycle completeness", () => {
  it("accepts a complete 7-day cycle", () => {
    const result = ImportScheduleSchema.safeParse(
      baseInput([1, 2, 3, 4, 5, 6, 7].map(ALL_SUBJECTS)),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a cycle missing day 3", () => {
    const result = ImportScheduleSchema.safeParse(
      baseInput([1, 2, 4, 5, 6, 7].map(ALL_SUBJECTS)),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("Missing cycle day(s): 3"))).toBe(
        true,
      );
    }
  });

  it("rejects a cycle with duplicate day 2", () => {
    const result = ImportScheduleSchema.safeParse(
      baseInput([1, 2, 2, 3, 4, 5, 6, 7].map(ALL_SUBJECTS)),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(
        messages.some((m) => m.includes("Duplicate cycle day(s): 2")),
      ).toBe(true);
    }
  });

  it("rejects a cycle with out-of-range day 8", () => {
    const result = ImportScheduleSchema.safeParse(
      baseInput([1, 2, 3, 4, 5, 6, 7, 8].map(ALL_SUBJECTS)),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(
        messages.some((m) =>
          m.includes("outside cycle range 1..7"),
        ),
      ).toBe(true);
    }
  });

  it("emits all three error families on a thoroughly broken cycle", () => {
    const result = ImportScheduleSchema.safeParse(
      baseInput([
        ALL_SUBJECTS(1),
        ALL_SUBJECTS(2),
        ALL_SUBJECTS(2),
        ALL_SUBJECTS(8),
      ]),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message).join(" | ");
      expect(messages).toMatch(/Missing cycle day/);
      expect(messages).toMatch(/Duplicate cycle day/);
      expect(messages).toMatch(/outside cycle range/);
    }
  });
});

describe("ImportScheduleSchema fuzz / oversize hardening", () => {
  it("rejects cycleLengthDays > 366", () => {
    const result = ImportScheduleSchema.safeParse(
      baseInput([{ dayNumber: 1, slots: [{ subject: "Math" }] }]),
    );
    // valid baseline above; now make it oversize
    const oversize = ImportScheduleSchema.safeParse({
      ...(baseInput([]) as object),
      cycleLengthDays: 367,
      timetable: Array.from({ length: 367 }, (_, i) => ALL_SUBJECTS(i + 1)),
    });
    expect(result.success).toBe(true);
    expect(oversize.success).toBe(false);
  });

  it("rejects when title is missing", () => {
    const result = ImportScheduleSchema.safeParse({
      targetDate: "2026-12-31",
      cycleLengthDays: 1,
      timetable: [ALL_SUBJECTS(1)],
    });
    expect(result.success).toBe(false);
  });

  it("rejects when targetDate is malformed", () => {
    const result = ImportScheduleSchema.safeParse({
      title: "P",
      targetDate: "12/31/2026",
      cycleLengthDays: 1,
      timetable: [ALL_SUBJECTS(1)],
    });
    expect(result.success).toBe(false);
  });

  it("rejects deeply-nested / wrong-type timetable entries", () => {
    const result = ImportScheduleSchema.safeParse({
      title: "P",
      targetDate: "2026-12-31",
      cycleLengthDays: 1,
      timetable: [{ dayNumber: 1, slots: [{ subject: 42 }] }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty timetable", () => {
    const result = ImportScheduleSchema.safeParse({
      title: "P",
      targetDate: "2026-12-31",
      cycleLengthDays: 1,
      timetable: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a minimal 1-day cycle", () => {
    const valid: ImportScheduleInput = {
      title: "P",
      targetDate: "2026-12-31",
      cycleLengthDays: 1,
      timetable: [ALL_SUBJECTS(1)],
    };
    const result = ImportScheduleSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
