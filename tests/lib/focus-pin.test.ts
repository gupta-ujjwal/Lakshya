import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  clearAllPins,
  getPinnedSubjects,
  isSubjectPinned,
  pinSubject,
  unpinSubject,
} from "@/lib/focus-pin";

describe("focus-pin", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-10T00:00:00.000Z"));
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("returns no pinned subjects on a fresh device", () => {
    expect(getPinnedSubjects()).toEqual([]);
    expect(isSubjectPinned("Pathology")).toBe(false);
  });

  it("pins a subject for today", () => {
    pinSubject("Pathology");
    expect(getPinnedSubjects()).toEqual(["Pathology"]);
    expect(isSubjectPinned("Pathology")).toBe(true);
  });

  it("supports pinning multiple subjects at once", () => {
    pinSubject("Pathology");
    pinSubject("Microbiology");
    expect(getPinnedSubjects()).toEqual(["Pathology", "Microbiology"]);
  });

  it("is idempotent — pinning the same subject twice doesn't duplicate", () => {
    pinSubject("Pathology");
    pinSubject("Pathology");
    expect(getPinnedSubjects()).toEqual(["Pathology"]);
  });

  it("unpins individually without disturbing the rest", () => {
    pinSubject("Pathology");
    pinSubject("Microbiology");
    unpinSubject("Pathology");
    expect(getPinnedSubjects()).toEqual(["Microbiology"]);
  });

  it("auto-clears at midnight — yesterday's pin is invisible today", () => {
    pinSubject("Pathology");
    expect(getPinnedSubjects()).toEqual(["Pathology"]);
    // Roll the clock forward one day.
    vi.setSystemTime(new Date("2026-05-11T00:00:00.000Z"));
    expect(getPinnedSubjects()).toEqual([]);
    expect(isSubjectPinned("Pathology")).toBe(false);
  });

  it("survives malformed localStorage payloads without throwing", () => {
    localStorage.setItem("lakshya:focus", "{not valid json");
    expect(getPinnedSubjects()).toEqual([]);
    localStorage.setItem(
      "lakshya:focus",
      JSON.stringify({ date: "2026-05-10", subjects: ["x", 42, "y"] }),
    );
    // Non-string entries are filtered out, valid ones survive.
    expect(getPinnedSubjects()).toEqual(["x", "y"]);
  });

  it("clearAllPins drops everything", () => {
    pinSubject("Pathology");
    clearAllPins();
    expect(getPinnedSubjects()).toEqual([]);
  });
});
