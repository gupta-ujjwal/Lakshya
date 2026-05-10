import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  importSchedule,
  listSubjects,
  listTasks,
  PROGRESS_COMPLETED,
  PROGRESS_PENDING,
  recordTaskProgress,
} from "@/repo";
import type { ImportScheduleInput } from "@/domain/schedule";
import { clearDb } from "../helpers";

const TODAY = "2026-05-10";

const sampleInput: ImportScheduleInput = {
  title: "Plan",
  // targetDate is well past TODAY so generation has room.
  targetDate: "2026-06-30",
  cycleLengthDays: 2,
  hoursPerDay: 4,
  timetable: [
    { dayNumber: 1, slots: [{ subject: "Math" }, { subject: "Physics" }] },
    { dayNumber: 2, slots: [{ subject: "Chemistry" }] },
  ],
};

describe("listTasks", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${TODAY}T00:00:00.000Z`));
    await clearDb();
  });
  afterEach(async () => {
    vi.useRealTimers();
    await clearDb();
  });

  it("returns [] when no schedule has been imported", async () => {
    expect(await listTasks()).toEqual([]);
  });

  it("returns all tasks for the latest schedule with todo status by default", async () => {
    await importSchedule(sampleInput);
    const all = await listTasks();
    expect(all.length).toBeGreaterThan(0);
    // Today's first slot should be in the list.
    const todayTasks = all.filter((t) => t.targetDate === TODAY);
    expect(todayTasks.length).toBeGreaterThan(0);
    expect(todayTasks.every((t) => t.status === "todo")).toBe(true);
  });

  it("derives 'completed' once recordTaskProgress lands a completed row", async () => {
    await importSchedule(sampleInput);
    const before = await listTasks({ fromDate: TODAY, toDate: TODAY });
    const target = before[0];
    expect(target.status).toBe("todo");

    await recordTaskProgress(target.id, PROGRESS_COMPLETED);
    const after = await listTasks({ fromDate: TODAY, toDate: TODAY });
    const updated = after.find((t) => t.id === target.id)!;
    expect(updated.status).toBe("completed");
  });

  it("derives 'overdue' for past-dated tasks with no completed progress", async () => {
    await importSchedule(sampleInput);
    // Jump time forward — yesterday's tasks become overdue.
    vi.setSystemTime(new Date("2026-05-15T00:00:00.000Z"));
    const past = await listTasks({ fromDate: TODAY, toDate: TODAY });
    expect(past.every((t) => t.status === "overdue")).toBe(true);
  });

  it("filters by status", async () => {
    await importSchedule(sampleInput);
    const todayTasks = await listTasks({ fromDate: TODAY, toDate: TODAY });
    await recordTaskProgress(todayTasks[0].id, PROGRESS_COMPLETED);

    const completed = await listTasks({
      status: "completed",
      fromDate: TODAY,
      toDate: TODAY,
    });
    expect(completed.length).toBe(1);
    expect(completed[0].id).toBe(todayTasks[0].id);

    const todo = await listTasks({
      status: "todo",
      fromDate: TODAY,
      toDate: TODAY,
    });
    expect(todo.find((t) => t.id === todayTasks[0].id)).toBeUndefined();
  });

  it("filters by subject (multi-select)", async () => {
    await importSchedule(sampleInput);
    const onlyMath = await listTasks({ subjects: ["Math"] });
    expect(onlyMath.length).toBeGreaterThan(0);
    expect(onlyMath.every((t) => t.subject === "Math")).toBe(true);

    const mathOrChem = await listTasks({ subjects: ["Math", "Chemistry"] });
    expect(mathOrChem.length).toBeGreaterThan(onlyMath.length);
    expect(
      mathOrChem.every((t) => t.subject === "Math" || t.subject === "Chemistry"),
    ).toBe(true);
  });

  it("filters by date range", async () => {
    await importSchedule(sampleInput);
    const todayOnly = await listTasks({ fromDate: TODAY, toDate: TODAY });
    expect(todayOnly.every((t) => t.targetDate === TODAY)).toBe(true);
  });

  it("treats PROGRESS_PENDING as not-completed (overdue once date is past)", async () => {
    await importSchedule(sampleInput);
    const todayTasks = await listTasks({ fromDate: TODAY, toDate: TODAY });
    await recordTaskProgress(todayTasks[0].id, PROGRESS_PENDING);
    vi.setSystemTime(new Date("2026-05-15T00:00:00.000Z"));
    const after = await listTasks({ fromDate: TODAY, toDate: TODAY });
    expect(after.find((t) => t.id === todayTasks[0].id)?.status).toBe("overdue");
  });

  it("sorts by priority desc, then targetDate asc", async () => {
    await importSchedule(sampleInput);
    const all = await listTasks();
    for (let i = 1; i < all.length; i++) {
      const prev = all[i - 1];
      const curr = all[i];
      if (prev.priority === curr.priority) {
        expect(prev.targetDate.localeCompare(curr.targetDate)).toBeLessThanOrEqual(
          0,
        );
      } else {
        expect(prev.priority).toBeGreaterThanOrEqual(curr.priority);
      }
    }
  });
});

describe("listSubjects", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(`${TODAY}T00:00:00.000Z`));
    await clearDb();
  });
  afterEach(async () => {
    vi.useRealTimers();
    await clearDb();
  });

  it("returns [] when no schedule has been imported", async () => {
    expect(await listSubjects()).toEqual([]);
  });

  it("returns the unique subject set from the latest schedule, sorted", async () => {
    await importSchedule(sampleInput);
    const subjects = await listSubjects();
    expect(subjects).toEqual(["Chemistry", "Math", "Physics"]);
  });
});
