import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/db";
import {
  addMock,
  EXPORT_VERSION,
  exportAll,
  getTodayCount,
  importAll,
  importSchedule,
  listMocks,
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

  // Tenet 4 detector — without this test, omitting mockTests from
  // ALL_TABLES / ExportPayloadSchema / parsePayload silently drops
  // the user's entire mock-test history on every backup. Same shape
  // as the mcqLogs round-trip case above.
  it("round-trips mockTests (Tenet 4 — silent-drop detector)", async () => {
    await addMock({
      series: "marrow",
      date: "2026-05-12",
      subjectScores: { Anatomy: 70, Physiology: 60 },
      total: 65,
    });
    await addMock({
      series: "prepladder",
      date: "2026-05-11",
      subjectScores: { Pathology: 80 },
      total: 80,
    });
    const before = await exportAll();
    expect(before.mockTests).toHaveLength(2);

    await clearDb();
    expect(await listMocks()).toHaveLength(0);

    await importAll(before);
    const after = await listMocks();
    expect(after).toHaveLength(2);
    // Sort both sides by id so order doesn't matter for equality.
    const byId = (a: { id: string }, b: { id: string }) =>
      a.id.localeCompare(b.id);
    expect([...after].sort(byId)).toEqual([...before.mockTests].sort(byId));
  });

  it("accepts a v2 payload without mockTests (back-compat)", async () => {
    await importSchedule(sampleInput);
    const v3 = await exportAll();
    const v2 = {
      version: 2,
      exportedAt: v3.exportedAt,
      schedules: v3.schedules,
      tasks: v3.tasks,
      taskProgress: v3.taskProgress,
      sessions: v3.sessions,
      mcqLogs: v3.mcqLogs,
      // no mockTests field
    };
    await clearDb();
    await addMock({
      series: "marrow",
      date: "2026-05-12",
      subjectScores: { Anatomy: 70 },
      total: 70,
    }); // sentinel — should be wiped on import
    await importAll(v2);
    expect(await listMocks()).toEqual([]);
    expect(await db.schedules.toArray()).toHaveLength(1);
  });
});
