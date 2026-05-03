import { describe, it, expect } from "vitest";
import {
  CreateTaskProgressSchema,
  UpdateTaskProgressSchema,
  TaskProgressQuerySchema,
} from "@/lib/api/progress/schemas";

describe("Progress API Schemas", () => {
  describe("CreateTaskProgressSchema", () => {
    it("accepts valid progress with required fields", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "completed",
      });
      expect(result.success).toBe(true);
    });

    it("accepts progress with optional notes", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "completed",
        notes: "Finished reading chapter 1",
      });
      expect(result.success).toBe(true);
    });

    it("accepts progress with optional date", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "completed",
        date: "2026-04-10T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts Date object as date", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "completed",
        date: new Date("2026-04-10"),
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing taskId", () => {
      const result = CreateTaskProgressSchema.safeParse({
        status: "completed",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing status", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty taskId", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "",
        status: "completed",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty status", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "",
      });
      expect(result.success).toBe(false);
    });

    it("accepts various status values", () => {
      const statuses = ["pending", "in_progress", "completed", "skipped", "blocked"];
      for (const status of statuses) {
        const result = CreateTaskProgressSchema.safeParse({
          taskId: "task-123",
          status,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid date format", () => {
      const result = CreateTaskProgressSchema.safeParse({
        taskId: "task-123",
        status: "completed",
        date: "not-a-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateTaskProgressSchema", () => {
    it("accepts partial update with status only", () => {
      const result = UpdateTaskProgressSchema.safeParse({
        status: "in_progress",
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial update with notes only", () => {
      const result = UpdateTaskProgressSchema.safeParse({
        notes: "Updated notes",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty update", () => {
      const result = UpdateTaskProgressSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects empty status", () => {
      const result = UpdateTaskProgressSchema.safeParse({
        status: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("TaskProgressQuerySchema", () => {
    it("accepts empty query", () => {
      const result = TaskProgressQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts taskId filter", () => {
      const result = TaskProgressQuerySchema.safeParse({ taskId: "task-123" });
      expect(result.success).toBe(true);
    });

    it("accepts date filter", () => {
      const result = TaskProgressQuerySchema.safeParse({
        date: "2026-04-10T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });

    it("accepts pagination parameters", () => {
      const result = TaskProgressQuerySchema.safeParse({ take: "20", skip: "5" });
      expect(result.success).toBe(true);
    });

    it("rejects take above maximum", () => {
      const result = TaskProgressQuerySchema.safeParse({ take: "101" });
      expect(result.success).toBe(false);
    });
  });
});