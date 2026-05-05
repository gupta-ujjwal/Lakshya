import { describe, it, expect } from "vitest";
import { startOfDay, nextDay } from "@/lib/api/dates";

describe("startOfDay", () => {
  it("buckets a UTC instant to UTC midnight on the same calendar day", () => {
    const result = startOfDay(new Date("2026-05-05T22:30:00.000Z"));
    expect(result.toISOString()).toBe("2026-05-05T00:00:00.000Z");
  });

  it("buckets early-morning UTC to the same day, not the previous day", () => {
    const result = startOfDay(new Date("2026-05-05T00:30:00.000Z"));
    expect(result.toISOString()).toBe("2026-05-05T00:00:00.000Z");
  });

  it("is idempotent: startOfDay(startOfDay(d)) === startOfDay(d)", () => {
    const d = new Date("2026-05-05T14:23:45.678Z");
    expect(startOfDay(startOfDay(d)).getTime()).toBe(startOfDay(d).getTime());
  });

  it("uses UTC components, not local — late-evening UTC stays on the UTC day", () => {
    // 23:59 UTC on the 5th should bucket to the 5th, not the 6th, regardless
    // of whether the host TZ has already rolled over.
    const result = startOfDay(new Date("2026-05-05T23:59:59.999Z"));
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(4);
    expect(result.getUTCDate()).toBe(5);
    expect(result.getUTCHours()).toBe(0);
  });
});

describe("nextDay", () => {
  it("returns 24h after the input instant", () => {
    const a = new Date("2026-05-05T00:00:00.000Z");
    const b = nextDay(a);
    expect(b.getTime() - a.getTime()).toBe(86_400_000);
    expect(b.toISOString()).toBe("2026-05-06T00:00:00.000Z");
  });

  it("advances exactly 24h across a DST spring-forward boundary", () => {
    // 2026-03-08 02:00 local in US/Eastern is the spring-forward instant.
    // The naive `setDate(d+1)` form preserved local clock time, so it
    // would produce 23h or 25h gaps. UTC arithmetic always produces 24h.
    const before = new Date("2026-03-08T05:00:00.000Z");
    const after = nextDay(before);
    expect(after.getTime() - before.getTime()).toBe(86_400_000);
  });

  it("composes: nextDay(startOfDay(d)) is the next UTC midnight", () => {
    const d = new Date("2026-05-05T14:23:45.678Z");
    expect(nextDay(startOfDay(d)).toISOString()).toBe(
      "2026-05-06T00:00:00.000Z"
    );
  });
});
