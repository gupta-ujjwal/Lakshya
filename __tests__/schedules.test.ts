import { describe, it, expect } from "vitest";
import {
  CreateScheduleSchema,
  UpdateScheduleSchema,
  ScheduleQuerySchema,
} from "../lib/api/schedules/schemas";

describe("Schedule Schemas", () => {
  describe("CreateScheduleSchema", () => {
    it("validates valid schedule", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user123",
        title: "Math Exam Prep",
        targetDate: "2025-06-15T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe("user123");
        expect(result.data.title).toBe("Math Exam Prep");
      }
    });

    it("requires userId", () => {
      const result = CreateScheduleSchema.safeParse({
        title: "Math Exam Prep",
        targetDate: "2025-06-15T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty title", () => {
      const result = CreateScheduleSchema.safeParse({
        userId: "user123",
        title: "",
        targetDate: "2025-06-15T00:00:00.000Z",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateScheduleSchema", () => {
    it("allows partial updates", () => {
      const result = UpdateScheduleSchema.safeParse({
        title: "Updated Title",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("ScheduleQuerySchema", () => {
    it("parses userId filter", () => {
      const result = ScheduleQuerySchema.safeParse({ userId: "user123" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userId).toBe("user123");
      }
    });
  });
});