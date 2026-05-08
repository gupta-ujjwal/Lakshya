import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EXPORT_VERSION, exportAll, importAll, importSchedule } from "@/repo";
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
});
