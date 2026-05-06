import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/db";
import { getDashboard, importSchedule, recordTaskProgress } from "@/repo";
import { PROGRESS_COMPLETED } from "@/domain/progress";
import type { ImportScheduleInput } from "@/domain/schedule";

async function clearDb() {
  await Promise.all([
    db.schedules.clear(),
    db.tasks.clear(),
    db.taskProgress.clear(),
    db.sessions.clear(),
  ]);
}

const sampleInput: ImportScheduleInput = {
  title: "Plan",
  targetDate: "2026-05-15",
  cycleLengthDays: 1,
  hoursPerDay: 4,
  timetable: [
    {
      dayNumber: 1,
      slots: [{ subject: "Math" }, { subject: "Physics" }],
    },
  ],
};

describe("getDashboard", () => {
  beforeEach(async () => {
    // toFake: ['Date'] keeps microtask scheduling (Promise resolution,
    // queueMicrotask) on real timers — Dexie hangs otherwise.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-10T00:00:00.000Z"));
    await clearDb();
  });
  afterEach(async () => {
    vi.useRealTimers();
    await clearDb();
  });

  it("returns null when no schedule has been imported", async () => {
    expect(await getDashboard()).toBeNull();
  });

  it("returns schedule + tasks + zeroed stats for a fresh import", async () => {
    await importSchedule(sampleInput);
    const dash = await getDashboard();
    expect(dash).not.toBeNull();
    expect(dash!.schedule.title).toBe("Plan");
    expect(dash!.schedule.hoursPerDay).toBe(4);
    expect(dash!.stats.streak).toBe(0);
    expect(dash!.stats.adherence).toBe(0);
    expect(dash!.stats.overdueCount).toBe(0);
    // 6 days × 2 slots = 12 tasks (May 10 → May 15 inclusive)
    expect(dash!.tasks).toHaveLength(12);
  });

  it("flags a task as completedToday after recordTaskProgress", async () => {
    await importSchedule(sampleInput);
    const before = await getDashboard();
    const todayTask = before!.tasks.find((t) => t.targetDate === "2026-05-10")!;
    await recordTaskProgress(todayTask.id, PROGRESS_COMPLETED);
    const after = await getDashboard();
    const updated = after!.tasks.find((t) => t.id === todayTask.id)!;
    expect(updated.completedToday).toBe(true);
  });

  it("counts overdue tasks (past targetDate, never completed)", async () => {
    // Import generates tasks starting today (May 10). Set a "past" task by
    // hand-inserting one with an earlier date.
    await importSchedule(sampleInput);
    const allTasks = await db.tasks.toArray();
    const oldId = allTasks[0].id;
    await db.tasks.update(oldId, { targetDate: "2026-05-08" });
    const dash = await getDashboard();
    expect(dash!.stats.overdueCount).toBe(1);
  });

  it("computes a 1-day streak when today has a completion", async () => {
    await importSchedule(sampleInput);
    const tasks = await db.tasks
      .where("scheduleId")
      .equals((await db.schedules.toArray())[0].id)
      .toArray();
    const todayTask = tasks.find((t) => t.targetDate === "2026-05-10")!;
    await recordTaskProgress(todayTask.id, PROGRESS_COMPLETED);
    const dash = await getDashboard();
    expect(dash!.stats.streak).toBe(1);
  });
});
