import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/db";
import {
  addToTodayCount,
  getLast7DayAverage,
  getTodayCount,
  setTodayCount,
} from "@/repo";
import { clearDb } from "../helpers";

describe("mcq counter repo", () => {
  beforeEach(async () => {
    // Fake Date so today() is deterministic; keep microtask scheduling
    // on real timers so Dexie doesn't hang.
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date("2026-05-12T00:00:00.000Z"));
    await clearDb();
  });
  afterEach(async () => {
    vi.useRealTimers();
    await clearDb();
  });

  it("getTodayCount returns 0 when no row exists", async () => {
    expect(await getTodayCount()).toBe(0);
  });

  it("setTodayCount upserts and getTodayCount reads it back", async () => {
    await setTodayCount(42);
    expect(await getTodayCount()).toBe(42);
  });

  it("setTodayCount overwrites a prior value on re-call", async () => {
    await setTodayCount(10);
    await setTodayCount(75);
    expect(await getTodayCount()).toBe(75);
    // Exactly one row stored per day — date is the primary key.
    expect(await db.mcqLogs.count()).toBe(1);
  });

  it("setTodayCount clamps negative input to 0", async () => {
    await setTodayCount(-5);
    expect(await getTodayCount()).toBe(0);
  });

  it("addToTodayCount appends to an existing total", async () => {
    await setTodayCount(50);
    await addToTodayCount(20);
    expect(await getTodayCount()).toBe(70);
  });

  it("addToTodayCount creates today's row when none exists", async () => {
    await addToTodayCount(15);
    expect(await getTodayCount()).toBe(15);
    expect(await db.mcqLogs.count()).toBe(1);
  });

  it("addToTodayCount accumulates across repeated batches", async () => {
    await addToTodayCount(30);
    await addToTodayCount(25);
    await addToTodayCount(10);
    expect(await getTodayCount()).toBe(65);
  });

  it("addToTodayCount ignores non-positive deltas", async () => {
    await setTodayCount(40);
    await addToTodayCount(0);
    await addToTodayCount(-7);
    await addToTodayCount(NaN);
    expect(await getTodayCount()).toBe(40);
  });

  it("addToTodayCount truncates fractional deltas", async () => {
    await addToTodayCount(12.9);
    expect(await getTodayCount()).toBe(12);
  });

  it("getLast7DayAverage returns 0 when no rows exist", async () => {
    expect(await getLast7DayAverage()).toBe(0);
  });

  it("getLast7DayAverage averages 7 days, treating missing days as 0", async () => {
    // 70 on today only, the other six days are 0 → 70/7 = 10.
    await setTodayCount(70);
    expect(await getLast7DayAverage()).toBe(10);
  });

  it("getLast7DayAverage rounds to the nearest integer", async () => {
    await db.mcqLogs.bulkPut([
      { date: "2026-05-06", count: 50 },
      { date: "2026-05-07", count: 50 },
      { date: "2026-05-08", count: 50 },
      { date: "2026-05-09", count: 50 },
      { date: "2026-05-10", count: 50 },
      { date: "2026-05-11", count: 50 },
      { date: "2026-05-12", count: 53 },
    ]);
    // (50*6 + 53) / 7 = 353/7 = 50.43 → 50
    expect(await getLast7DayAverage()).toBe(50);
  });

  it("getLast7DayAverage ignores rows outside the 7-day window", async () => {
    await db.mcqLogs.bulkPut([
      { date: "2026-05-12", count: 100 }, // today
      { date: "2026-05-01", count: 999 }, // outside window
    ]);
    // 100/7 = 14.28 → 14
    expect(await getLast7DayAverage()).toBe(14);
  });
});
