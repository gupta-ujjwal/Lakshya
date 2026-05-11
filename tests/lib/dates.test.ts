import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { today, toDateKey, fromDateKey, addDaysToKey } from "@/lib/dates";
import { daysUntil } from "@/lib/countdown";

// All date helpers bucket to UTC midnight regardless of the device's
// local timezone. These tests pin `Date` at cross-midnight UTC moments
// to lock that invariant — historically this is where a TZ regression
// would slip in (see closed #13).

describe("date helpers — UTC truth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("today() returns the UTC date even at IST 23:30 (still 18:00 UTC)", () => {
    vi.setSystemTime(new Date("2026-05-11T18:00:00.000Z"));
    expect(today()).toBe("2026-05-11");
  });

  it("today() returns the *next* UTC date when local IST has rolled into Tuesday but UTC is still Monday", () => {
    // IST midnight on 2026-05-12 == 2026-05-11T18:30Z. UTC is still
    // Monday. today() must say Monday — picks UTC midnight bucketing.
    vi.setSystemTime(new Date("2026-05-11T18:30:00.000Z"));
    expect(today()).toBe("2026-05-11");
  });

  it("today() crosses to the next day at UTC midnight, not local midnight", () => {
    vi.setSystemTime(new Date("2026-05-11T23:59:59.999Z"));
    expect(today()).toBe("2026-05-11");
    vi.setSystemTime(new Date("2026-05-12T00:00:00.000Z"));
    expect(today()).toBe("2026-05-12");
  });

  it("daysUntil() is a UTC calendar diff and ignores sub-day timestamps", () => {
    vi.setSystemTime(new Date("2026-05-11T08:00:00.000Z"));
    expect(daysUntil("2026-05-12")).toBe(1);
    expect(daysUntil("2026-05-11")).toBe(0);
    expect(daysUntil("2026-05-10")).toBe(-1);
  });

  it("daysUntil() stays stable as local time rolls through the day", () => {
    vi.setSystemTime(new Date("2026-05-11T01:00:00.000Z"));
    const morning = daysUntil("2026-12-31");
    vi.setSystemTime(new Date("2026-05-11T22:00:00.000Z"));
    const evening = daysUntil("2026-12-31");
    expect(morning).toBe(evening);
  });

  it("addDaysToKey() is DST-safe (fixed 86,400,000 ms step, not a setDate hop)", () => {
    // 2026 US-DST spring-forward is 2026-03-08. addDaysToKey crosses
    // it without a 23-hour day because we don't go via setDate.
    expect(addDaysToKey("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDaysToKey("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDaysToKey("2026-03-07", 7)).toBe("2026-03-14");
  });

  it("toDateKey/fromDateKey round-trip exactly through UTC midnight", () => {
    const key = "2026-05-11";
    expect(toDateKey(fromDateKey(key))).toBe(key);
    const date = fromDateKey(key);
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
  });

  it("addDaysToKey() handles negative offsets", () => {
    expect(addDaysToKey("2026-05-11", -1)).toBe("2026-05-10");
    expect(addDaysToKey("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("addDaysToKey() crosses year boundaries cleanly", () => {
    expect(addDaysToKey("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDaysToKey("2025-12-31", 366)).toBe("2027-01-01");
  });
});
