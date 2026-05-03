import { describe, it, expect } from "vitest";
import {
  CreateScheduleSchema,
  UpdateScheduleSchema,
  ScheduleQuerySchema,
} from "@/lib/api/schedules/schemas";

describe("Schedules API Schemas", () => {
  describe("CreateScheduleSchema", () => {
    it("accepts valid schedule with all required fields", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "NEET PG 2026",
        targetDate: "2026-10-01T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts schedule with optional data field", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "NEET PG 2026",
        targetDate: "2026-10-01T00:00:00.000Z",
        data: { notes: "Focus on Anatomy", subjects: ["Anatomy", "Physiology"] },
      });
      expect(result.success).toBe(true);
    });

    it("accepts Date object as targetDate", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "NEET PG 2026",
        targetDate: new Date("2026-10-01"),
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing userId", () => {
      const result = CreateScheduleSchema.safeParse({
        title: "NEET PG 2026",
        targetDate: "2026-10-01T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing title", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        targetDate: "2026-10-01T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty string userId", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "",
        title: "NEET PG 2026",
        targetDate: "2026-10-01T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty string title", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "",
        targetDate: "2026-10-01T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects title exceeding max length (255)", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "a".repeat(256),
        targetDate: "2026-10-01T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid ISO date format", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "NEET PG 2026",
        targetDate: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("rejects date without time component", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user-123",
        title: "NEET PG 2026",
        targetDate: "2026-10-01",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateScheduleSchema", () => {
    it("accepts partial update with title only", () => {
      const result = UpdateScheduleSchema.safeParse({
        title: "Updated Title",
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with targetDate only", () => {
      const result = UpdateScheduleSchema.safeParse({
        targetDate: "2026-11-01T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with data only", () => {
      const result = UpdateScheduleSchema.safeParse({
        data: { notes: "Updated notes" },
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty update", () => {
      const result = UpdateScheduleSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid targetDate", () => {
      const result = UpdateScheduleSchema.safeParse({
        targetDate: "invalid-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ScheduleQuerySchema", () => {
    it("accepts empty query", () => {
      const result = ScheduleQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts userId filter", () => {
      const result = ScheduleQuerySchema.safeParse({ userId: "user-123" });
      expect(result.success).toBe(true);
    });

    it("accepts pagination parameters", () => {
      const result = ScheduleQuerySchema.safeParse({ take: "20", skip: "10" });
      expect(result.success).toBe(true);
    });

    it("coerces string numbers", () => {
      const result = ScheduleQuerySchema.safeParse({ take: "50", skip: "5" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.take).toBe(50);
        expect(result.data.skip).toBe(5);
      }
    });

    it("rejects take above maximum", () => {
      const result = ScheduleQuerySchema.safeParse({ take: "101" });
      expect(result.success).toBe(false);
    });
  });
});