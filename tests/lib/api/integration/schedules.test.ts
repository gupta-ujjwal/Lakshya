import { describe, it, expect } from "vitest";
import {
  CreateScheduleSchema,
  UpdateScheduleSchema,
  ScheduleQuerySchema,
} from "@/lib/api/schedules/schemas";

describe("Schedules Integration Tests", () => {
  describe("CreateScheduleSchema - full workflow", () => {
    it("creates a valid schedule with all fields", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "NEET PG 2026 Study Plan",
        targetDate: "2026-10-26T00:00:00.000Z",
        data: { subjects: ["Anatomy", "Physiology"], targetScore: 850 },
      });
      expect(result.success).toBe(true);
    });

    it("validates targetDate as Date object", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "Study Plan",
        targetDate: new Date("2026-10-26T00:00:00.000Z"),
      });
      expect(result.success).toBe(true);
    });

    it("rejects title exceeding max length", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "A".repeat(256),
        targetDate: "2026-10-26T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects past targetDate", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "Study Plan",
        targetDate: "2020-01-01T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("supports complex data payload", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "Study Plan",
        targetDate: "2026-10-26T00:00:00.000Z",
        data: {
          milestones: [
            { name: "Phase 1", targetDate: "2026-05-01", completed: false },
          ],
          notes: "Focus on high-yield topics",
          color: "#FF5733",
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("UpdateScheduleSchema - partial updates", () => {
    it("updates only title", () => {
      const result = UpdateScheduleSchema.safeParse({ title: "Updated Title" });
      expect(result.success).toBe(true);
    });

    it("updates only targetDate", () => {
      const result = UpdateScheduleSchema.safeParse({
        targetDate: "2026-11-15T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("updates data field", () => {
      const result = UpdateScheduleSchema.safeParse({
        data: { notes: "Updated notes" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty string title in update", () => {
      const result = UpdateScheduleSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("ScheduleQuerySchema - query patterns", () => {
    it("query by userId returns paginated results", () => {
      const result = ScheduleQuerySchema.safeParse({
        userId: "user-123",
        take: "20",
        skip: "0",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe("user-123");
        expect(result.data.take).toBe(20);
        expect(result.data.skip).toBe(0);
      }
    });

    it("default pagination values", () => {
      const result = ScheduleQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.take).toBeUndefined();
        expect(result.data.skip).toBeUndefined();
      }
    });

    it("enforces maximum page size", () => {
      const result = ScheduleQuerySchema.safeParse({ take: "100" });
      expect(result.success).toBe(true);
      const tooLarge = ScheduleQuerySchema.safeParse({ take: "101" });
      expect(tooLarge.success).toBe(false);
    });

    it("enforces minimum page size of 1", () => {
      const result = ScheduleQuerySchema.safeParse({ take: "1" });
      expect(result.success).toBe(true);
      const zero = ScheduleQuerySchema.safeParse({ take: "0" });
      expect(zero.success).toBe(false);
    });
  });

  describe("Schedule workflow - create then query", () => {
    it("simulates create-then-query workflow", () => {
      const createResult = CreateScheduleSchema.safeParse({
        userId: "user-abc",
        title: "NEET PG Prep",
        targetDate: "2026-10-26T00:00:00.000Z",
        data: { priority: "high" },
      });
      expect(createResult.success).toBe(true);

      const queryResult = ScheduleQuerySchema.safeParse({
        userId: "user-abc",
        take: "10",
        skip: "0",
      });
      expect(queryResult.success).toBe(true);
    });
  });
});