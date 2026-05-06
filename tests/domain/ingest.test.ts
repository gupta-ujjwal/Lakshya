import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateTasksFromSchedule } from "@/domain/ingest";
import type { ImportScheduleInput } from "@/domain/schedule";

const baseInput: ImportScheduleInput = {
  title: "Test",
  targetDate: "2026-05-15",
  cycleLengthDays: 3,
  hoursPerDay: 4,
  timetable: [
    { dayNumber: 1, slots: [{ subject: "Math" }, { subject: "English" }] },
    { dayNumber: 2, slots: [{ subject: "Physics" }] },
    { dayNumber: 3, slots: [] },
  ],
};

describe("generateTasksFromSchedule", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T00:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("emits one task per slot per day in the cycle", () => {
    const tasks = generateTasksFromSchedule(baseInput);
    // 6 days inclusive (May 10 → May 15). Day 1 (×2 slots), day 2 (×1),
    // day 3 (skip), repeat. So days 1,2,3,4,5,6 → cycle 1,2,3,1,2,3
    // → counts: 2+1+0+2+1+0 = 6 tasks total.
    expect(tasks).toHaveLength(6);
  });

  it("uses YYYY-MM-DD strings for targetDate", () => {
    const tasks = generateTasksFromSchedule(baseInput);
    for (const t of tasks) {
      expect(t.targetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("preserves slot order via priority", () => {
    const tasks = generateTasksFromSchedule(baseInput);
    const day1 = tasks.filter((t) => t.targetDate === "2026-05-10");
    expect(day1.map((t) => t.priority)).toEqual([0, 1]);
    expect(day1.map((t) => t.subject)).toEqual(["Math", "English"]);
  });

  it("returns empty when target precedes start", () => {
    vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));
    expect(generateTasksFromSchedule(baseInput)).toEqual([]);
  });

  it("returns empty when timetable is empty", () => {
    expect(
      generateTasksFromSchedule({ ...baseInput, timetable: [] }),
    ).toEqual([]);
  });

  it("uses topic when present, falls back to subject", () => {
    const tasks = generateTasksFromSchedule({
      ...baseInput,
      timetable: [
        {
          dayNumber: 1,
          slots: [{ subject: "Math", topic: "Calculus" }, { subject: "English" }],
        },
      ],
      cycleLengthDays: 1,
    });
    expect(tasks[0].title).toBe("Calculus");
    expect(tasks[0].subject).toBe("Math");
    expect(tasks[1].title).toBe("English");
  });
});
