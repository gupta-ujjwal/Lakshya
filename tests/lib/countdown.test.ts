import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { daysUntil, urgencyLevel, journeyProgress } from "@/lib/countdown";

describe("countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("daysUntil", () => {
    it("returns 0 for today", () => {
      expect(daysUntil("2026-05-05T00:00:00.000Z")).toBe(0);
    });

    it("returns positive for future dates", () => {
      expect(daysUntil("2026-05-15T00:00:00.000Z")).toBe(10);
    });

    it("returns negative for past dates", () => {
      expect(daysUntil("2026-05-01T00:00:00.000Z")).toBe(-4);
    });
  });

  describe("urgencyLevel", () => {
    it("calm when more than 60 days", () => {
      expect(urgencyLevel(120)).toBe("calm");
      expect(urgencyLevel(60)).toBe("calm");
    });

    it("focus when 30-59 days", () => {
      expect(urgencyLevel(45)).toBe("focus");
      expect(urgencyLevel(30)).toBe("focus");
    });

    it("urgent when 14-29 days", () => {
      expect(urgencyLevel(20)).toBe("urgent");
      expect(urgencyLevel(14)).toBe("urgent");
    });

    it("critical when 0-13 days", () => {
      expect(urgencyLevel(13)).toBe("critical");
      expect(urgencyLevel(0)).toBe("critical");
    });

    it("past when negative", () => {
      expect(urgencyLevel(-1)).toBe("past");
      expect(urgencyLevel(-100)).toBe("past");
    });
  });

  describe("journeyProgress", () => {
    it("returns 0 at the start", () => {
      expect(
        journeyProgress("2026-05-05T00:00:00.000Z", "2026-08-05T00:00:00.000Z")
      ).toBe(0);
    });

    it("returns 100 past the target", () => {
      expect(
        journeyProgress("2026-01-01T00:00:00.000Z", "2026-05-01T00:00:00.000Z")
      ).toBe(100);
    });

    it("returns 100 when target precedes start", () => {
      expect(
        journeyProgress("2026-05-05T00:00:00.000Z", "2026-04-01T00:00:00.000Z")
      ).toBe(100);
    });

    it("returns linear ratio mid-journey", () => {
      expect(
        journeyProgress("2026-05-05T00:00:00.000Z", "2026-05-15T00:00:00.000Z")
      ).toBe(0);
      vi.setSystemTime(new Date("2026-05-10T00:00:00.000Z"));
      expect(
        journeyProgress("2026-05-05T00:00:00.000Z", "2026-05-15T00:00:00.000Z")
      ).toBe(50);
    });
  });
});
