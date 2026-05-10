import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCalendarSummary,
  importSchedule,
  PROGRESS_COMPLETED,
  recordTaskProgress,
  listTasks,
} from "@/repo";
import type { ImportScheduleInput } from "@/domain/schedule";
import { clearDb } from "../helpers";

const TODAY = "2026-05-10";

const sampleInput: ImportScheduleInput = {
  title: "Plan",
  targetDate: "2026-06-30",
  cycleLengthDays: 1,
  hoursPerDay: 4,
  timetable: [
    {
      dayNumber: 1,
      slots: [{ subject: "Math" }, { subject: "Physics" }],
    },
  ],
};

describe("getCalendarSummary", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${TODAY}T00:00:00.000Z`));
    await clearDb();
  });
  afterEach(async () => {
    vi.useRealTimers();
    await clearDb();
  });

  it("returns [] when no schedule exists", async () => {
    expect(await getCalendarSummary("2026-05")).toEqual([]);
  });

  it("returns 31 days for May (ends 2026-05-31)", async () => {
    await importSchedule(sampleInput);
    const days = await getCalendarSummary("2026-05");
    expect(days).toHaveLength(31);
    expect(days[0].date).toBe("2026-05-01");
    expect(days[30].date).toBe("2026-05-31");
  });

  it("returns 28 days for non-leap February", async () => {
    await importSchedule({
      ...sampleInput,
      targetDate: "2026-04-01",
    });
    const days = await getCalendarSummary("2026-02");
    expect(days).toHaveLength(28);
  });

  it("returns 29 days for leap February", async () => {
    await importSchedule({
      ...sampleInput,
      targetDate: "2024-04-01",
    });
    const days = await getCalendarSummary("2024-02");
    expect(days).toHaveLength(29);
    expect(days[28].date).toBe("2024-02-29");
  });

  it("counts total tasks per day from scheduled tasks", async () => {
    await importSchedule(sampleInput);
    const days = await getCalendarSummary("2026-05");
    const todayCell = days.find((d) => d.date === TODAY)!;
    expect(todayCell.total).toBe(2); // Math + Physics
    expect(todayCell.completed).toBe(0);
    expect(todayCell.heat).toBe("todo");
  });

  it("flips heat to 'done' when all tasks for the day are completed", async () => {
    await importSchedule(sampleInput);
    const todayTasks = await listTasks({ fromDate: TODAY, toDate: TODAY });
    for (const t of todayTasks) await recordTaskProgress(t.id, PROGRESS_COMPLETED);
    const days = await getCalendarSummary("2026-05");
    const cell = days.find((d) => d.date === TODAY)!;
    expect(cell.completed).toBe(2);
    expect(cell.heat).toBe("done");
  });

  it("flips past-dated incomplete days to 'overdue'", async () => {
    await importSchedule(sampleInput);
    vi.setSystemTime(new Date("2026-05-20T00:00:00.000Z"));
    const days = await getCalendarSummary("2026-05");
    const cell = days.find((d) => d.date === TODAY)!;
    expect(cell.heat).toBe("overdue");
  });

  it("flips partially-completed past-dated days to 'partial'", async () => {
    await importSchedule(sampleInput);
    const todayTasks = await listTasks({ fromDate: TODAY, toDate: TODAY });
    await recordTaskProgress(todayTasks[0].id, PROGRESS_COMPLETED);
    vi.setSystemTime(new Date("2026-05-20T00:00:00.000Z"));
    const days = await getCalendarSummary("2026-05");
    const cell = days.find((d) => d.date === TODAY)!;
    expect(cell.completed).toBe(1);
    expect(cell.total).toBe(2);
    expect(cell.heat).toBe("partial");
  });

  it("marks empty days (no tasks) as 'empty'", async () => {
    // sampleInput's targetDate is 2026-06-30, so July has no tasks.
    await importSchedule(sampleInput);
    const days = await getCalendarSummary("2026-07");
    expect(days.every((d) => d.heat === "empty" && d.total === 0)).toBe(true);
  });
});
