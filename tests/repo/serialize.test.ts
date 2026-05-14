import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/db";
import {
  EXPORT_VERSION,
  exportAll,
  getTodayCount,
  importAll,
  importSchedule,
  setTodayCount,
} from "@/repo";
import type { ImportScheduleInput } from "@/domain/schedule";
import { clearDb } from "../helpers";

const sampleInput: ImportScheduleInput = {
  title: "Plan",
  targetDate: "2026-05-15",
  cycleLengthDays: 1,
  hoursPerDay: 4,
  timetable: [
    { dayNumber: 1, slots: [{ subject: "Math" }] },
  ],
};

describe("export/import round trip", () => {
  beforeEach(async () => {
    await clearDb();
  });
  afterEach(async () => {
    await clearDb();
  });

  it("round-trips schedule and tasks with no data loss", async () => {
    await importSchedule(sampleInput);
    const before = await exportAll();
    expect(before.version).toBe(EXPORT_VERSION);
    expect(before.schedules).toHaveLength(1);
    expect(before.tasks.length).toBeGreaterThan(0);

    await clearDb();
    expect((await exportAll()).schedules).toHaveLength(0);

    await importAll(before);
    const after = await exportAll();
    expect(after.schedules).toEqual(before.schedules);
    expect(after.tasks).toEqual(before.tasks);
  });

  it("rejects mismatched version", async () => {
    await expect(importAll({ version: 999 })).rejects.toThrow(
      /Unsupported export version/,
    );
  });

  it("rejects malformed payloads", async () => {
    await expect(importAll(null)).rejects.toThrow();
    await expect(
      importAll({ version: EXPORT_VERSION, schedules: [] }),
    ).rejects.toThrow(/missing required collections/);
  });

  it("round-trips mcqLogs", async () => {
    await setTodayCount(42);
    const before = await exportAll();
    expect(before.mcqLogs).toHaveLength(1);
    expect(before.mcqLogs[0].count).toBe(42);

    await clearDb();
    expect(await getTodayCount()).toBe(0);

    await importAll(before);
    expect(await getTodayCount()).toBe(42);
  });

  it("accepts a v1 payload without mcqLogs (back-compat)", async () => {
    await importSchedule(sampleInput);
    const v2 = await exportAll();
    const v1 = {
      version: 1,
      exportedAt: v2.exportedAt,
      schedules: v2.schedules,
      tasks: v2.tasks,
      taskProgress: v2.taskProgress,
      sessions: v2.sessions,
      // no mcqLogs field
    };
    await clearDb();
    await setTodayCount(99); // sentinel — should be wiped on import
    await importAll(v1);
    expect(await db.mcqLogs.toArray()).toEqual([]);
    expect(await db.schedules.toArray()).toHaveLength(1);
  });
});
