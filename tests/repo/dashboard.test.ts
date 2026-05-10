import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db, newId, nowIso } from "@/db";
import {
  getDashboard,
  getOverallProgress,
  importSchedule,
  recordTaskProgress,
} from "@/repo";
import { PROGRESS_COMPLETED } from "@/domain/progress";
import type { ImportScheduleInput } from "@/domain/schedule";
import type { ClosedSession } from "@/domain/session";
import { clearDb } from "../helpers";

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

  it("completedEver is true even for completions older than the streak window", async () => {
    // Pin the regression: the focus-pin filter on Dashboard relies on
    // completedEver to hide already-finished tasks. A 30-day-window
    // proxy would mis-flag an old-but-completed task as still pending.
    await importSchedule(sampleInput);
    const t = (await db.tasks.toArray())[0];
    // Record completion 60 days ago — well outside STREAK_LOOKBACK_DAYS.
    vi.setSystemTime(new Date("2026-03-11T00:00:00.000Z"));
    await recordTaskProgress(t.id, PROGRESS_COMPLETED);
    vi.setSystemTime(new Date("2026-05-10T00:00:00.000Z"));
    const dash = await getDashboard();
    const flagged = dash!.tasks.find((row) => row.id === t.id)!;
    expect(flagged.completedEver).toBe(true);
  });

  it("flags scheduledForToday and pinnedSubject independently", async () => {
    await importSchedule(sampleInput);
    const dash = await getDashboard({ pinnedSubjects: ["Math"] });
    const todayMath = dash!.tasks.find(
      (t) => t.targetDate === "2026-05-10" && t.subject === "Math",
    )!;
    const futureMath = dash!.tasks.find(
      (t) => t.targetDate === "2026-05-12" && t.subject === "Math",
    )!;
    const todayPhysics = dash!.tasks.find(
      (t) => t.targetDate === "2026-05-10" && t.subject === "Physics",
    )!;
    expect(todayMath.scheduledForToday).toBe(true);
    expect(todayMath.pinnedSubject).toBe(true);
    expect(futureMath.scheduledForToday).toBe(false);
    expect(futureMath.pinnedSubject).toBe(true);
    expect(todayPhysics.scheduledForToday).toBe(true);
    expect(todayPhysics.pinnedSubject).toBe(false);
  });

  it("totalStudyMinutes sums duration over closed sessions only", async () => {
    await importSchedule(sampleInput);
    const closed: ClosedSession = {
      id: newId(),
      state: "closed",
      startedAt: "2026-05-10T08:00:00.000Z",
      endedAt: "2026-05-10T08:30:00.000Z",
      duration: 1800,
      taskId: null,
      reflection: null,
      createdAt: nowIso(),
    };
    const open = {
      id: newId(),
      state: "open" as const,
      startedAt: "2026-05-10T09:00:00.000Z",
      taskId: null,
      createdAt: nowIso(),
    };
    await db.sessions.bulkAdd([closed, open]);
    const dash = await getDashboard();
    expect(dash!.stats.totalStudyMinutes).toBe(30);
  });
});

describe("getOverallProgress", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-10T00:00:00.000Z"));
    await clearDb();
  });
  afterEach(async () => {
    vi.useRealTimers();
    await clearDb();
  });

  it("returns null with no schedule", async () => {
    expect(await getOverallProgress()).toBeNull();
  });

  it("counts a completed task once even with multiple progress rows", async () => {
    await importSchedule(sampleInput);
    const tasks = await db.tasks.toArray();
    const t = tasks[0];
    await recordTaskProgress(t.id, PROGRESS_COMPLETED);
    // Same task ticked again on a different day — two rows, one task.
    vi.setSystemTime(new Date("2026-05-11T00:00:00.000Z"));
    await recordTaskProgress(t.id, PROGRESS_COMPLETED);
    const overall = await getOverallProgress();
    expect(overall!.total).toBe(12);
    expect(overall!.completed).toBe(1);
  });
});
