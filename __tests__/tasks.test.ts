import { describe, it, expect } from "vitest";
import {
  CreateTaskSchema,
  TaskQuerySchema,
} from "../lib/api/tasks/schemas";

describe("Task Schemas", () => {
  describe("CreateTaskSchema", () => {
    it("validates valid task", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule123",
        title: "Chapter 1 Review",
        subject: "Mathematics",
        targetDate: "2025-06-15T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduleId).toBe("schedule123");
        expect(result.data.priority).toBe(0);
      }
    });

    it("validates priority bounds", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule123",
        title: "Chapter 1 Review",
        subject: "Mathematics",
        targetDate: "2025-06-15T00:00:00.000Z",
        priority: 5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects priority > 10", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule123",
        title: "Chapter 1 Review",
        subject: "Mathematics",
        targetDate: "2025-06-15T00:00:00.000Z",
        priority: 15,
      });
      expect(result.success).toBe(false);
    });

    it("rejects priority < 0", () => {
      const result = CreateTaskSchema.safeParse({
        scheduleId: "schedule123",
        title: "Chapter 1 Review",
        subject: "Mathematics",
        targetDate: "2025-06-15T00:00:00.000Z",
        priority: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("TaskQuerySchema", () => {
    it("parses multiple filters", () => {
      const result = TaskQuerySchema.safeParse({
        scheduleId: "schedule123",
        subject: "Mathematics",
        take: "20",
      });
      expect(result.success).toBe(true);
    });
  });
});